import { Schema, model } from 'mongoose';

const AdminSettingsSchema = new Schema(
  {
    facebookUrl: { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

export const AdminSettings = model('AdminSettings', AdminSettingsSchema);
