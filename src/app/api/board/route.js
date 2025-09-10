import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Board from '@/models/Board';
import Task from '@/models/Task';

// Fallback in-memory board if DB is not configured
let memoryBoard = {
  columns: [
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        { id: '1', title: 'Setup project achha', assignedTo: null },
        { id: '2', title: 'Design wireframes', assignedTo: null },
      ],
    },
    {
      id: 'inprogress',
      title: 'In Progress',
      tasks: [{ id: '3', title: 'Develop homepage', assignedTo: null }],
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [],
    },
  ],
  users: [
    { id: 'u1', name: 'Alice' },
    { id: 'u2', name: 'Bob' },
  ],
};

async function ensureBoardSeeded() {
  const existing = await Board.findOne();
  if (existing) return existing;

  // Seed default board
  const todoTask1 = await Task.create({ title: 'Setup project achha' });
  const todoTask2 = await Task.create({ title: 'Design wireframes' });
  const inProgressTask = await Task.create({ title: 'Develop homepage' });

  const seeded = await Board.create({
    title: 'Kanban',
    columns: [
      { id: 'todo', title: 'To Do', taskIds: [todoTask1._id, todoTask2._id] },
      { id: 'inprogress', title: 'In Progress', taskIds: [inProgressTask._id] },
      { id: 'done', title: 'Done', taskIds: [] },
    ],
    users: [
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' },
    ],
  });
  return seeded;
}

function serializeBoard(doc) {
  return {
    columns: doc.columns.map((col) => ({
      id: col.id,
      title: col.title,
      tasks: [],
    })),
    users: doc.users,
  };
}

async function populateTasks(boardDoc) {
  const result = serializeBoard(boardDoc);
  // Build a map of columnId -> taskIds
  for (let i = 0; i < boardDoc.columns.length; i++) {
    const col = boardDoc.columns[i];
    if (!col.taskIds || col.taskIds.length === 0) {
      result.columns[i].tasks = [];
      continue;
    }
    const tasks = await Task.find({ _id: { $in: col.taskIds } }).lean();
    const byId = new Map(tasks.map((t) => [String(t._id), t]));
    result.columns[i].tasks = col.taskIds
      .map((id) => byId.get(String(id)))
      .filter(Boolean)
      .map((t) => ({ id: String(t._id), title: t.title, assignedTo: t.assignedTo || null }));
  }
  return result;
}

// Handles GET requests to /api/board
export async function GET(request) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(memoryBoard);
    }
    const doc = await ensureBoardSeeded();
    const populated = await populateTasks(doc);
    return NextResponse.json(populated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handles POST requests to /api/board
export async function POST(request) {
  try {
    const { columnId, task } = await request.json();
    const conn = await connectToDatabase();
    if (!conn) {
      const column = memoryBoard.columns.find((col) => col.id === columnId);
      if (!column) return NextResponse.json({ error: 'Column not found' }, { status: 404 });
      column.tasks.push({ ...task, id: Date.now().toString() });
      return NextResponse.json(memoryBoard);
    }

    const boardDoc = await ensureBoardSeeded();
    const column = boardDoc.columns.find((col) => col.id === columnId);
    if (!column) return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    const created = await Task.create({ title: task?.title || 'Untitled', assignedTo: task?.assignedTo || null });
    column.taskIds.push(created._id);
    await boardDoc.save();
    const populated = await populateTasks(boardDoc);
    return NextResponse.json(populated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Handles PUT requests to /api/board
export async function PUT(request) {
  try {
    const updatedBoard = await request.json();
    const conn = await connectToDatabase();
    if (!conn) {
      memoryBoard = updatedBoard;
      return NextResponse.json(memoryBoard);
    }

    const boardDoc = await ensureBoardSeeded();

    // Build set of task ids present in updated payload
    const payloadTaskIds = new Set();
    for (const col of updatedBoard.columns || []) {
      for (const t of col.tasks || []) payloadTaskIds.add(String(t.id));
    }

    // Update column ordering
    for (const col of boardDoc.columns) {
      const payloadCol = (updatedBoard.columns || []).find((c) => c.id === col.id);
      if (!payloadCol) {
        col.taskIds = [];
        continue;
      }
      col.taskIds = (payloadCol.tasks || [])
        .map((t) => t.id)
        .filter(Boolean)
        .map((id) => id);
    }

    await boardDoc.save();

    // Delete tasks that are no longer referenced by any column
    const allExistingIds = boardDoc.columns.flatMap((c) => c.taskIds.map((id) => String(id)));
    const referenced = new Set(allExistingIds);
    const toDelete = [...payloadTaskIds].filter((id) => !referenced.has(String(id)));
    if (toDelete.length > 0) {
      await Task.deleteMany({ _id: { $in: toDelete } });
    }

    const populated = await populateTasks(boardDoc);
    return NextResponse.json(populated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
