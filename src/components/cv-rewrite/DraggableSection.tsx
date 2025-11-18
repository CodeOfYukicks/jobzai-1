import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

interface DraggableSectionProps {
  id: string;
  index: number;
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}

export default function DraggableSection({
  id,
  index,
  title,
  children,
  onEdit,
}: DraggableSectionProps) {
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
              ? `${provided.draggableProps.style?.transform || ''} rotate(0.5deg) scale(1.01)`
              : provided.draggableProps.style?.transform || 'none',
            opacity: snapshot.isDragging ? 0.98 : 1,
            zIndex: snapshot.isDragging ? 1000 : 'auto',
            // Assurer que le drop est instantané
            pointerEvents: snapshot.isDragging ? 'none' : 'auto',
          }}
          className="relative group"
        >
          {/* Section Content - Désactiver les interactions pendant le drag */}
          {/* Note: Drag handle retiré - on utilise le drag sur toute la section */}
          <div
            style={{
              pointerEvents: snapshot.isDragging ? 'none' : 'auto',
              userSelect: snapshot.isDragging ? 'none' : 'auto',
            }}
            className={snapshot.isDragging ? 'ring-2 ring-purple-400 dark:ring-purple-500 rounded-2xl' : ''}
          >
            {children}
          </div>

          {/* Shadow premium pendant le drag - avec transition pour éviter le freeze */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-150"
            style={{
              opacity: snapshot.isDragging ? 1 : 0,
              boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.3)',
              zIndex: -1,
              pointerEvents: 'none',
            }}
          />
        </div>
      )}
    </Draggable>
  );
}

