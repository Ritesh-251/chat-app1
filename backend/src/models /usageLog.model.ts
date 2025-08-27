import { Schema, model, Document } from "mongoose";

export interface IUsageLog extends Document {
  researchId: string;
  package: string;
  timeUsed: number; 
  startTime: Date;
  endTime: Date;
  createdAt: Date;
}

const UsageLogSchema = new Schema<IUsageLog>(
  {
    researchId: { type: String, required: true },
    package: { type: String, required: true },
    timeUsed: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  { timestamps: true }
);

export const UsageLog = model<IUsageLog>("UsageLog", UsageLogSchema);
