'use client';

import Task from './Task';
import { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';

export default function Column({ column, setBoard, board }) {
  const [newTask, setNewTask] = useState('');

  const handleAdd = async () => {
    if (!newTask) return;
    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: column.id,
          task: { title: newTask, assignedTo: null },
        }),
      });
      const updated = await res.json();
      setBoard(updated);
      setNewTask('');
    } catch (e) {
      // no-op for demo
    }
  };

  const handleDelete = async (task) => {
    const newBoard = {
      ...board,
      columns: board.columns.map((col) =>
        col.id === column.id
          ? { ...col, tasks: col.tasks.filter((t) => String(t.id) !== String(task.id)) }
          : col,
      ),
    };
    setBoard(newBoard);
    try {
      await fetch('/api/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBoard),
      });
    } catch (e) {
      // no-op for demo
    }
  };

  return (
    <div
      className="column"
      style={{ minWidth: 280 }}
    >
      <h2 style={{ margin: 0, fontSize: 18 }}>{column.title}</h2>
      <Droppable droppableId={String(column.id)} type="TASK" direction="vertical" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`droppable ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
          >
            {column.tasks.map((task, index) => (
              <Task key={String(task.id)} task={{ ...task, id: String(task.id) }} index={index} onDelete={handleDelete} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="New task"
          className="input"
        />
      <button onClick={handleAdd} className="btn">Add</button>
      </div>
    </div>
  );
}
