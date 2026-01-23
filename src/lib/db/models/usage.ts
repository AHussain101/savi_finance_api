// Usage Model - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUsage extends Document {
  apiKeyId: Types.ObjectId;
  endpoint: string;
  timestamp: Date;
}

const UsageSchema = new Schema<IUsage>({
  apiKeyId: {
    type: Schema.Types.ObjectId,
    ref: "ApiKey",
    required: true,
    index: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// TTL index to auto-delete old usage records after 90 days
UsageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Usage =
  mongoose.models.Usage || mongoose.model<IUsage>("Usage", UsageSchema);
