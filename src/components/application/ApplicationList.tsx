import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { JobApplication } from '../../types/job';
import { ApplicationCard } from './ApplicationCard';

export function ApplicationList({
  applications,
  onCardClick,
  onCardDelete,
}: {
  applications: JobApplication[];
  onCardClick: (app: JobApplication) => void;
  onCardDelete: (app: JobApplication) => void;
}) {
  return (
    <>
      {applications.map((app, index) => (
        <Draggable key={app.id} draggableId={app.id} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{ ...provided.draggableProps.style, zIndex: snapshot.isDragging ? 9999 : 'auto' }}
              className="mb-[18px] last:mb-0 h-[280px]"
            >
              <ApplicationCard
                app={app}
                onClick={() => onCardClick(app)}
                onDelete={() => onCardDelete(app)}
                isDragging={snapshot.isDragging}
              />
            </div>
          )}
        </Draggable>
      ))}
    </>
  );
}


