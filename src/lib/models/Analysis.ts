import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoId:       { type: Number, default: 0 },
  repoName:     String,
  repoFullName: String,
  branch:       { type: String, default: 'main' },
  analyzedAt:   { type: Date, default: Date.now },
  duration:     { type: Number, default: 0 },
  // Job tracking (for serverless polling)
  status:       { type: String, default: 'pending', enum: ['pending', 'running', 'done', 'error'] },
  jobStep:      { type: String, default: 'Queued' },
  jobProgress:  { type: Number, default: 0 },
  jobError:     { type: String, default: null },
  stats: {
    totalFiles:      { type: Number, default: 0 },
    totalLines:      { type: Number, default: 0 },
    unusedFiles:     { type: Number, default: 0 },
    duplicateBlocks: { type: Number, default: 0 },
    sizeKB:          { type: Number, default: 0 },
  },
  languages:    [{ name: String, percent: Number, color: String }],
  fileTree:     { type: mongoose.Schema.Types.Mixed, default: [] },
  unusedFiles:  [{ path: String, name: String, size: Number, reason: String }],
  dependencies: {
    manager: { type: String, default: 'none' },
    used:    { type: mongoose.Schema.Types.Mixed, default: [] },
    unused:  { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  duplicates:   [{ files: [String], lines: Number, hash: String }],
  issues:       { type: mongoose.Schema.Types.Mixed, default: [] },
  healthScore: {
    total:     { type: Number, default: 0 },
    breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  organizerSuggestion: { type: mongoose.Schema.Types.Mixed, default: null },
  aiSummary:    { type: String, default: null },
  suggestions:  [String],
}, { timestamps: true });

export const Analysis = mongoose.models.Analysis || mongoose.model('Analysis', AnalysisSchema);
