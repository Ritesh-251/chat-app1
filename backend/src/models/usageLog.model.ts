import { Schema, model, Document,Types} from "mongoose";

export interface IUsageLog extends Document {
  userId:Schema.Types.ObjectId,
  package: string;
  timeUsed: number; 
  startTime: Date;
  endTime: Date;
  createdAt: Date;
}

const UsageLogSchema = new Schema<IUsageLog>(
  {
    userId: {
      type:Schema.ObjectId,
      ref:'User'
    },
   
    package: { type: String, required: true },
    timeUsed: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  { timestamps: true }
);

export const UsageLog = model<IUsageLog>("UsageLog", UsageLogSchema);
