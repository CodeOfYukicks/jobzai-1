/**
 * EditableWidgetGrid Component
 * iOS/macOS-style editable widget grid with drag and drop
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Check, X, GripVertical, Plus, Target, Cloud, Quote, Clock, StickyNote, Heart, Maximize2, Minimize2 } from 'lucide-react';
import DailyMissions from './DailyMissions';
import DailyMotivation from './DailyMotivation';
import WeatherCard from './WeatherCard';
import TimeWidget from './TimeWidget';
import NoteWidget from './NoteWidget';
import HamsterWidget from './HamsterWidget';

// Widget types
type WidgetType = 'missions' | 'quote' | 'weather' | 'time' | 'note' | 'hamster';

interface Widget {
  id: string;
  type: WidgetType;
  size: 'small' | 'medium' | 'large';
}

// Available widgets catalog
const widgetCatalog: { 
  type: WidgetType; 
  name: string; 
  description: string;
  icon: React.ElementType;
  color: string;
  size: 'small' | 'large';
  resizable?: boolean;
}[] = [
  { 
    type: 'missions', 
    name: 'Daily Missions', 
    description: 'Track your daily goals',
    icon: Target,
    color: '#635BFF',
    size: 'large',
    resizable: true
  },
  { 
    type: 'quote', 
    name: 'Quote of the Day', 
    description: 'Get daily inspiration',
    icon: Quote,
    color: '#B7E219',
    size: 'small'
  },
  { 
    type: 'weather', 
    name: 'Weather', 
    description: 'Local conditions',
    icon: Cloud,
    color: '#22272B',
    size: 'small'
  },
  { 
    type: 'time', 
    name: 'Clock', 
    description: 'Retro digital watch',
    icon: Clock,
    color: '#dddf8f',
    size: 'small'
  },
  { 
    type: 'note', 
    name: 'Quick Note', 
    description: 'Write quick notes',
    icon: StickyNote,
    color: '#D97706',
    size: 'small'
  },
  { 
    type: 'hamster', 
    name: 'Hamster', 
    description: 'Cute motivational pet',
    icon: Heart,
    color: '#F97316',
    size: 'small'
  },
];

// Default widget configuration
const defaultWidgets: Widget[] = [
  { id: 'missions-1', type: 'missions', size: 'large' },
  { id: 'quote-1', type: 'quote', size: 'small' },
  { id: 'weather-1', type: 'weather', size: 'small' },
];

const STORAGE_KEY = 'hubWidgetConfig';

// Render widget based on type
const WidgetContent = ({ type, size }: { type: WidgetType; size: 'small' | 'medium' | 'large' }) => {
  switch (type) {
    case 'missions':
      return <DailyMissions size={size === 'large' ? 'large' : 'small'} />;
    case 'quote':
      return <DailyMotivation />;
    case 'weather':
      return <WeatherCard />;
    case 'time':
      return <TimeWidget />;
    case 'note':
      return <NoteWidget />;
    case 'hamster':
      return <HamsterWidget />;
    default:
      return null;
  }
};

// Check if widget type is resizable
const isWidgetResizable = (type: WidgetType): boolean => {
  const catalogItem = widgetCatalog.find(w => w.type === type);
  return catalogItem?.resizable ?? false;
};

// Sortable widget item
function SortableWidget({ 
  widget, 
  isEditMode, 
  onRemove,
  onResize
}: { 
  widget: Widget; 
  isEditMode: boolean; 
  onRemove: (id: string) => void;
  onResize: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const canResize = isWidgetResizable(widget.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative h-full
        ${widget.size === 'large' ? 'md:col-span-2' : ''}
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      {/* Edit mode overlay */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 pointer-events-none"
          >
            <motion.div
              animate={{ rotate: [0, -0.5, 0.5, -0.5, 0] }}
              transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse' }}
              className="h-full"
            >
              <div className="absolute inset-0 border-2 border-dashed border-[#635BFF]/50 dark:border-[#635BFF]/40 rounded-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag handle, resize button, and remove button */}
      <AnimatePresence>
        {isEditMode && (
          <>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              {...attributes}
              {...listeners}
              className="absolute top-2 left-2 z-20 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 
                shadow-lg border border-gray-200 dark:border-gray-700
                cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </motion.button>

            {/* Resize button - only for resizable widgets */}
            {canResize && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onResize(widget.id)}
                className="absolute top-2 left-12 z-20 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 
                  shadow-lg border border-gray-200 dark:border-gray-700
                  hover:bg-[#635BFF] hover:border-[#635BFF] hover:text-white
                  active:scale-95 transition-all group"
                title={widget.size === 'large' ? 'Make smaller' : 'Make larger'}
              >
                {widget.size === 'large' ? (
                  <Minimize2 className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-white" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-white" />
                )}
              </motion.button>
            )}

            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onRemove(widget.id)}
              className="absolute -top-2 -right-2 z-20 p-1 rounded-full bg-red-500 
                shadow-lg hover:bg-red-600 active:scale-95 transition-all"
            >
              <X className="w-4 h-4 text-white" />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      <div className={`h-full ${isEditMode ? 'pointer-events-none' : ''}`}>
        <WidgetContent type={widget.type} size={widget.size} />
      </div>
    </div>
  );
}

// Widget preview for drag overlay
function WidgetPreview({ widget }: { widget: Widget }) {
  return (
    <div
      className={`
        rounded-2xl overflow-hidden shadow-2xl ring-4 ring-[#635BFF]/50 transform scale-105
        ${widget.size === 'large' ? 'min-w-[400px]' : 'min-w-[200px]'}
      `}
      style={{ opacity: 0.95 }}
    >
      <div className="pointer-events-none">
        <WidgetContent type={widget.type} size={widget.size} />
      </div>
    </div>
  );
}

// Widget Gallery Panel - always shown in edit mode
function WidgetGallery({ 
  existingTypes, 
  onAddWidget 
}: { 
  existingTypes: WidgetType[]; 
  onAddWidget: (type: WidgetType) => void;
}) {
  const availableWidgets = widgetCatalog.filter(w => !existingTypes.includes(w.type));

  // All widgets added - minimal message
  if (availableWidgets.length === 0) {
    return (
      <div className="mt-3 flex items-center justify-center gap-2 py-3 text-gray-400 dark:text-gray-500">
        <Check className="w-3.5 h-3.5" />
        <span className="text-xs">All widgets added</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Minimal header */}
      <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 pl-1">
        Add widget
      </p>
      
      {/* Compact widget cards */}
      <div className="flex flex-wrap gap-2">
        {availableWidgets.map((widget) => {
          const Icon = widget.icon;
          return (
            <motion.button
              key={widget.type}
              onClick={() => onAddWidget(widget.type)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl
                bg-gray-50 dark:bg-gray-800/50 
                border border-gray-200 dark:border-gray-700
                hover:border-[#635BFF]/50 hover:bg-white dark:hover:bg-gray-800
                transition-all group"
            >
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${widget.color}15` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: widget.color }} />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {widget.name}
              </span>
              <Plus className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-[#635BFF] transition-colors" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Main component
export default function EditableWidgetGrid() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load saved configuration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWidgets(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading widget config:', e);
    }
  }, []);

  // Save configuration
  const saveConfig = useCallback((newWidgets: Widget[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
    } catch (e) {
      console.error('Error saving widget config:', e);
    }
  }, []);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        const newItems = arrayMove(items, oldIndex, newIndex);
        saveConfig(newItems);
        return newItems;
      });
    }
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets((items) => {
      const newItems = items.filter((i) => i.id !== id);
      saveConfig(newItems);
      return newItems;
    });
  };

  const handleResizeWidget = (id: string) => {
    setWidgets((items) => {
      const newItems = items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            size: item.size === 'large' ? 'small' as const : 'large' as const,
          };
        }
        return item;
      });
      saveConfig(newItems);
      return newItems;
    });
  };

  const handleAddWidget = (type: WidgetType) => {
    if (widgets.some(w => w.type === type)) return;
    const catalogItem = widgetCatalog.find(w => w.type === type);
    if (!catalogItem) return;

    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      size: catalogItem.size,
    };
    setWidgets((items) => {
      const newItems = [...items, newWidget];
      saveConfig(newItems);
      return newItems;
    });
  };

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;
  const existingTypes = widgets.map((w) => w.type);

  return (
    <div className="relative">
      {/* Edit button - Premium minimal design */}
      <div className="absolute -top-10 right-0 z-30">
        <motion.button
          onClick={() => setIsEditMode(!isEditMode)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative group"
        >
          <AnimatePresence mode="wait">
            {isEditMode ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  bg-[#635BFF] text-white text-xs font-medium tracking-wide
                  shadow-sm shadow-[#635BFF]/25"
              >
                <Check className="w-3 h-3" strokeWidth={2.5} />
                <span>Done</span>
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  text-gray-400 dark:text-gray-500 text-xs font-medium tracking-wide
                  hover:text-gray-600 dark:hover:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-800/50
                  transition-colors duration-200"
              >
                <Pencil className="w-3 h-3" strokeWidth={2} />
                <span>Edit</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Widget grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <motion.div 
            layout
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${widgets.length > 0 ? 'min-h-[220px]' : ''}`}
          >
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                isEditMode={isEditMode}
                onRemove={handleRemoveWidget}
                onResize={handleResizeWidget}
              />
            ))}

            {/* Empty state - Apple-like minimal */}
            {widgets.length === 0 && !isEditMode && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex items-center justify-center gap-3 py-6"
              >
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm">No widgets</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <button
                  onClick={() => setIsEditMode(true)}
                  className="text-sm text-[#635BFF] hover:text-[#5249e6] font-medium transition-colors"
                >
                  Add some
                </button>
              </motion.div>
            )}
          </motion.div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay>
          {activeWidget ? <WidgetPreview widget={activeWidget} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Widget Gallery - shown in edit mode */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <WidgetGallery
              existingTypes={existingTypes}
              onAddWidget={handleAddWidget}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
