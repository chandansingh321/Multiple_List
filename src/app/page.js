'use client';

import { useEffect, useState } from 'react';
import Board from '@/components/Board';

export default function Home() {
  const [board, setBoard] = useState(null);

  useEffect(() => {
    fetch('/api/board')
      .then((res) => res.json())
      .then(setBoard);
  }, []);

  if (!board) return <div>Loading...</div>;

  return (
    <div>
      <h1>Kanban Board</h1>
      <Board board={board} setBoard={setBoard} />
    </div>
  );
}
