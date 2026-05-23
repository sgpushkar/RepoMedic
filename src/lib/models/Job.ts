import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // use jobId as _id
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: String, required: true },
  repo: { type: String, required: true },
  branch: { type: String, default: 'main' },
  status: { type: String, default: 'pending', enum: ['pending', 'running', 'done', 'error'] },
  step: { type: String, default: 'Queued' },
  progress: { type: Number, default: 0 },
  error: { type: String, default: null },
  analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis', default: null },
}, { timestamps: true });

export const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);
