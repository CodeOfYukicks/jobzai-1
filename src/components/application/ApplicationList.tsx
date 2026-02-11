import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { JobApplication, BoardType } from '../../types/job';
import { ApplicationCard } from './ApplicationCard';

export function ApplicationList({
  applications,
  onCardClick,
  onCardDelete,
  onMoveToBoard,
  getIsInactive,
  getInactiveDays,
  showMoveToBoard = false,
  boardType = 'jobs',
}: {
  applications: JobApplication[];
  onCardClick: (app: JobApplication) => void;
  onCardDelete: (app: JobApplication) => void;
  onMoveToBoard?: (app: JobApplication) => void;
  getIsInactive?: (app: JobApplication) => boolean;
  getInactiveDays?: (app: JobApplication) => number;
  showMoveToBoard?: boolean;
  boardType?: BoardType;
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
                className="mb-3 last:mb-0"
              >
                <ApplicationCard
                  app={app}
                  onClick={() => onCardClick(app)}
                  onDelete={() => onCardDelete(app)}
                  onMoveToBoard={showMoveToBoard && onMoveToBoard ? () => onMoveToBoard(app) : undefined}
                  isDragging={snapshot.isDragging}
                  isInactive={isInactive}
                  inactiveDays={inactiveDays}
                  boardType={boardType}
                />
              </div>
            )}
          </Draggable>
        );
      })}
    </>
  );
}


