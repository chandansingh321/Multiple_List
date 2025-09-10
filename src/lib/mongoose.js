import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Admintodo:1bmaCJ7GChFUaDlb@cluster0.nvxekxh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URI) {
  // Intentionally not throwing to allow local, in-memory operation.
  // Consumers should handle missing connection by skipping DB ops.
  console.warn('MONGODB_URI is not set. Database operations will be skipped.');
}

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) return null;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
