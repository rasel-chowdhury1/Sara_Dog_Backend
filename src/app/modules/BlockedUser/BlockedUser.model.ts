import { Schema, model } from 'mongoose';
import { BlockModel, TBlockedUser } from './BlockedUser.type';

const blockUserSchema = new Schema<TBlockedUser, BlockModel>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
      required: true,
    },
    blocked_users: {
      type: [Schema.Types.ObjectId], // Users who are blocked
      default: [],
      ref: 'User',
    },
  },
  {
    timestamps: true, // Automatically add `createdAt` and `updatedAt`
    toJSON: { virtuals: true }, // Enable virtual fields in JSON output
  },
);

export const BlockUser = model<TBlockedUser, BlockModel>(
  'BlockUser',
  blockUserSchema,
);
