import { Schema, model, Document, Types } from "mongoose";

export interface IChatbotProfile extends Document {
  userId: Types.ObjectId;
  gender: string;
  purposes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatbotProfileSchema = new Schema<IChatbotProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    purposes: [{ type: String, required: true }],
  },
  { timestamps: true }
);

export default model<IChatbotProfile>("ChatbotProfile", ChatbotProfileSchema);
