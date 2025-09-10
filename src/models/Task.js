import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    assignedTo: { type: String, default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
