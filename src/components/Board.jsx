'use client';

import Column from './Column';
import { DragDropContext } from 'react-beautiful-dnd';
import { useEffect, useState } from 'react';

export default function Board({ board, setBoard }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleDragEnd = async (result) => {
    const { destination, source, type } = result;
    if (!destination) return;
    if (type && type !== 'TASK') return;

    const sourceColIndex = board.columns.findIndex((c) => c.id === source.droppableId);
    const destColIndex = board.columns.findIndex((c) => c.id === destination.droppableId);
    if (sourceColIndex === -1 || destColIndex === -1) return;

    const newBoard = {
      ...board,
      columns: board.columns.map((col) => ({ ...col, tasks: [...col.tasks] })),
    };

    const sourceTasks = newBoard.columns[sourceColIndex].tasks;
    const [moved] = sourceTasks.splice(source.index, 1);
    const destTasks = newBoard.columns[destColIndex].tasks;
    destTasks.splice(destination.index, 0, moved);

    setBoard(newBoard);

    try {
      await fetch('/api/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBoard),
      });
    } catch (e) {
      // no-op for demo; ideally revert on error
    }
  };
  if (!mounted) return null;
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {board.columns.map((col) => (
          <Column key={col.id} column={col} setBoard={setBoard} board={board} />
        ))}
      </div>
    </DragDropContext>
  );
}
