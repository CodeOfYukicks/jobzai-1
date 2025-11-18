import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';

interface DraggableEntryProps {
  id: string;
  index: number;
  children: React.ReactNode;
}

export default function DraggableEntry({ id, index, children }: DraggableEntryProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            // Désactiver les transitions pendant le drag, mais activer une transition rapide au drop
            transition: snapshot.isDragging 
              ? 'none' 
              : provided.draggableProps.style?.transition || 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease-out',
            // Optimisation GPU
            willChange: snapshot.isDragging ? 'transform' : 'auto',
            // Styles pendant le drag - légère rotation et scale pour feedback visuel
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform || ''} rotate(0.5deg) scale(1.02)`
              : provided.draggableProps.style?.transform || 'none',
            opacity: snapshot.isDragging ? 0.95 : 1,
            zIndex: snapshot.isDragging ? 1000 : 'auto',
            // Assurer que le drop est instantané
            pointerEvents: snapshot.isDragging ? 'none' : 'auto',
          }}
          className="relative group"
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            style={{
              pointerEvents: snapshot.isDragging ? 'none' : 'auto',
            }}
            className={`absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 ${
              snapshot.isDragging
                ? 'opacity-100 bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30 scale-110'
                : 'opacity-60 group-hover:opacity-100 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:scale-105'
            }`}
            title="Drag to reorder"
          >
            <GripVertical
              className={`w-4 h-4 transition-colors duration-150 ${
                snapshot.isDragging
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400'
              }`}
            />
          </div>

          {/* Content - Désactiver les interactions pendant le drag */}
          <div
            style={{
              pointerEvents: snapshot.isDragging ? 'none' : 'auto',
              userSelect: snapshot.isDragging ? 'none' : 'auto',
            }}
            className={`${snapshot.isDragging ? 'ring-2 ring-purple-400 dark:ring-purple-500 rounded-xl' : ''} bg-gradient-to-br from-white to-gray-50 dark:from-[#050507] dark:to-[#111118] rounded-xl border border-gray-200/70 dark:border-gray-800/80`}
          >
            {children}
          </div>

          {/* Shadow pendant le drag - avec transition pour éviter le freeze */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-150"
            style={{
              opacity: snapshot.isDragging ? 1 : 0,
              boxShadow: '0 20px 40px -10px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.2)',
              zIndex: -1,
              pointerEvents: 'none',
            }}
          />
        </div>
      )}
    </Draggable>
  );
}

