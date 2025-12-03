import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { JobApplication } from '../../types/job';
import { ApplicationCard } from './ApplicationCard';

export function ApplicationList({
  applications,
  onCardClick,
  onCardDelete,
  getIsInactive,
  getInactiveDays,
}: {
  applications: JobApplication[];
  onCardClick: (app: JobApplication) => void;
  onCardDelete: (app: JobApplication) => void;
  getIsInactive?: (app: JobApplication) => boolean;
  getInactiveDays?: (app: JobApplication) => number;
}) {
  return (
    <>
      {applications.map((app, index) => {
        const isInactive = getIsInactive ? getIsInactive(app) : false;
        const inactiveDays = getInactiveDays ? getInactiveDays(app) : 0;
        
        return (
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
                  isInactive={isInactive}
                  inactiveDays={inactiveDays}
                />
              </div>
            )}
          </Draggable>
        );
      })}
    </>
  );
}


