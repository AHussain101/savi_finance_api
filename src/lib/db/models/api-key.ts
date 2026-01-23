// API Key Model - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IApiKey extends Document {
  userId: Types.ObjectId;
  key: string; // Hashed
  keyPrefix: string; // For display (sk_live_xxxx)
  name: string;
  createdAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keyPrefix: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "Default Key",
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ApiKey =
  mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
