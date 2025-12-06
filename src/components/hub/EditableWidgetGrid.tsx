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
import { Pencil, Check, Plus, X, GripVertical } from 'lucide-react';
import DailyMissions from './DailyMissions';
import DailyMotivation from './DailyMotivation';
import WeatherCard from './WeatherCard';

// Widget types
type WidgetType = 'missions' | 'quote' | 'weather';

interface Widget {
  id: string;
  type: WidgetType;
  size: 'small' | 'medium' | 'large'; // small = 1 col, medium = 1 col, large = 2 cols
}

// Available widgets that can be added
const availableWidgets: { type: WidgetType; name: string; description: string }[] = [
  { type: 'missions', name: 'Daily Missions', description: 'Track your daily goals' },
  { type: 'quote', name: 'Quote of the Day', description: 'Get daily inspiration' },
  { type: 'weather', name: 'Weather', description: 'Local weather conditions' },
];

// Default widget configuration
const defaultWidgets: Widget[] = [
  { id: 'missions-1', type: 'missions', size: 'large' },
  { id: 'quote-1', type: 'quote', size: 'small' },
  { id: 'weather-1', type: 'weather', size: 'small' },
];

const STORAGE_KEY = 'hubWidgetConfig';

// Render widget based on type
const WidgetContent = ({ type }: { type: WidgetType }) => {
  switch (type) {
    case 'missions':
      return <DailyMissions />;
    case 'quote':
      return <DailyMotivation />;
    case 'weather':
      return <WeatherCard />;
    default:
      return null;
  }
};

// Sortable widget item
interface SortableWidgetProps {
  widget: Widget;
  isEditMode: boolean;
  onRemove: (id: string) => void;
}

function SortableWidget({ widget, isEditMode, onRemove }: SortableWidgetProps) {
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
            {/* Wiggle animation container */}
            <motion.div
              animate={{
                rotate: [0, -0.5, 0.5, -0.5, 0],
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className="h-full"
            >
              {/* Border highlight */}
              <div className="absolute inset-0 border-2 border-dashed border-[#635BFF]/50 dark:border-[#635BFF]/40 rounded-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag handle and remove button */}
      <AnimatePresence>
        {isEditMode && (
          <>
            {/* Drag handle */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              {...attributes}
              {...listeners}
              className="absolute top-2 left-2 z-20 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 
                shadow-lg border border-gray-200 dark:border-gray-700
                cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-700
                transition-colors"
            >
              <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </motion.button>

            {/* Remove button */}
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

      {/* Widget content */}
      <div className={`h-full ${isEditMode ? 'pointer-events-none' : ''}`}>
        <WidgetContent type={widget.type} />
      </div>
    </div>
  );
}

// Widget preview for drag overlay - shows actual widget content
function WidgetPreview({ widget }: { widget: Widget }) {
  return (
    <div
      className={`
        rounded-2xl overflow-hidden
        shadow-2xl ring-4 ring-[#635BFF]/50
        transform scale-105
        ${widget.size === 'large' ? 'min-w-[400px]' : 'min-w-[200px]'}
      `}
      style={{
        opacity: 0.95,
      }}
    >
      <div className="pointer-events-none">
        <WidgetContent type={widget.type} />
      </div>
    </div>
  );
}

// Add widget modal
interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: WidgetType) => void;
  existingTypes: WidgetType[];
}

function AddWidgetModal({ isOpen, onClose, onAdd, existingTypes }: AddWidgetModalProps) {
  const availableToAdd = availableWidgets.filter(w => !existingTypes.includes(w.type));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
              w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
              border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Widget
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Choose a widget to add to your dashboard
              </p>
            </div>

            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
              {availableToAdd.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  All widgets are already added
                </p>
              ) : (
                availableToAdd.map((widget) => (
                  <button
                    key={widget.type}
                    onClick={() => {
                      onAdd(widget.type);
                      onClose();
                    }}
                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50
                      hover:bg-gray-100 dark:hover:bg-gray-700 
                      border border-gray-200 dark:border-gray-600
                      hover:border-[#635BFF] dark:hover:border-[#635BFF]
                      transition-all text-left group"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#635BFF]">
                      {widget.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {widget.description}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-gray-600 dark:text-gray-300
                  hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Main component
export default function EditableWidgetGrid() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  const handleAddWidget = (type: WidgetType) => {
    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      size: type === 'missions' ? 'large' : 'small',
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
      {/* Edit controls */}
      <div className="absolute -top-12 right-0 z-30 flex items-center gap-3">
        {/* Add widget button (only in edit mode) */}
        <AnimatePresence>
          {isEditMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setShowAddModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full
                text-sm font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 
                border border-gray-200 dark:border-gray-700 hover:border-[#635BFF] hover:text-[#635BFF]
                shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Add
            </motion.button>
          )}
        </AnimatePresence>

        {/* Edit/Done button */}
        <motion.button
          onClick={() => setIsEditMode(!isEditMode)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full
            text-sm font-medium transition-all duration-300
            ${isEditMode 
              ? 'bg-[#635BFF] text-white shadow-lg shadow-[#635BFF]/30' 
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#635BFF] shadow-sm hover:shadow-md'
            }
          `}
        >
          {isEditMode ? (
            <>
              <Check className="w-4 h-4" />
              Done
            </>
          ) : (
            <>
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </>
          )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[220px]">
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                isEditMode={isEditMode}
                onRemove={handleRemoveWidget}
              />
            ))}

            {/* Empty state */}
            {widgets.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No widgets added yet
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#635BFF] text-white
                    hover:bg-[#5249e6] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Widget
                </button>
              </div>
            )}
          </div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay>
          {activeWidget ? <WidgetPreview widget={activeWidget} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Add widget modal */}
      <AddWidgetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddWidget}
        existingTypes={existingTypes}
      />
    </div>
  );
}

