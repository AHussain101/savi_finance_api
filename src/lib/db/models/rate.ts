// Rate Model - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

import mongoose, { Schema, Document } from "mongoose";

export type RateType = "fiat" | "crypto" | "stock" | "metal";

export interface IRate extends Document {
  type: RateType;
  base: string; // Always USD for normalization
  quote: string; // Target currency/asset (EUR, BTC, AAPL, XAU)
  rate: number;
  dataDate: Date; // The actual date of the data (T-1)
  source: string; // Provider name
  createdAt: Date;
  updatedAt: Date;
}

const RateSchema = new Schema<IRate>(
  {
    type: {
      type: String,
      enum: ["fiat", "crypto", "stock", "metal"],
      required: true,
    },
    base: {
      type: String,
      required: true,
      default: "USD",
    },
    quote: {
      type: String,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    dataDate: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
RateSchema.index({ type: 1, base: 1, quote: 1 }, { unique: true });

export const Rate =
  mongoose.models.Rate || mongoose.model<IRate>("Rate", RateSchema);
