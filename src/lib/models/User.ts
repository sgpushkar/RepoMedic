import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  githubId:     { type: Number, required: true, unique: true },
  login:        String,
  name:         { type: String, default: '' },
  avatar_url:   { type: String, default: '' },
  html_url:     { type: String, default: '' },
  public_repos: { type: Number, default: 0 },
  followers:    { type: Number, default: 0 },
  accessToken:  String,
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
