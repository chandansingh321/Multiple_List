'use client';

import { Draggable } from 'react-beautiful-dnd';
import { createPortal } from 'react-dom';

export default function Task({ task, index, onDelete }) {
  // NOTE: No user assignment, no drag-and-drop, no delete, no accessibility.
  return (
    <Draggable draggableId={String(task.id)} index={index} isDragDisabled={false} disableInteractiveElementBlocking={false}>
      {(provided, snapshot) => {
        const node = (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`task ${snapshot.isDragging ? 'dragging' : ''}`}
            style={provided.draggableProps.style}
          >
            <span style={{ flex: 1 }}>
              {task.title}
              {task.assignedTo && (
                <span style={{ marginLeft: 8 }}>({task.assignedTo})</span>
              )}
            </span>
            {onDelete && (
              <button onClick={() => onDelete(task)} aria-label="Delete task" className="icon-btn">
                ✕
              </button>
            )}
          </div>
        );
        return snapshot.isDragging ? createPortal(node, document.body) : node;
      }}
    </Draggable>
  );
}
