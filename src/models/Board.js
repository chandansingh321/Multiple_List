import mongoose from 'mongoose';

const ColumnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    taskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  },
  { _id: false },
);

const BoardSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Kanban' },
    columns: { type: [ColumnSchema], default: [] },
    users: {
      type: [
        new mongoose.Schema(
          { id: String, name: String },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.models.Board || mongoose.model('Board', BoardSchema);
