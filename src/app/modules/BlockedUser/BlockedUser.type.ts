import { Model, Types } from 'mongoose';

export type TBlockedUser = {
  user_id: Types.ObjectId;
  blocked_users: Types.ObjectId[];
};

export type BlockModel = Model<TBlockedUser>;
