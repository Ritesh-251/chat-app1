import { Schema, model, Document } from "mongoose";

export interface IConsent extends Document {
  researchId: string;
  conversationLogs: boolean;
  appUsage: boolean;
  audio: boolean;
  consentGivenAt: Date;
}

const ConsentSchema = new Schema<IConsent>({
  researchId: { type: String, required: true, unique: true },
  conversationLogs: { type: Boolean, default: true },
  appUsage: { type: Boolean, default: true },
  audio: { type: Boolean, default: false },
  consentGivenAt: { type: Date, default: Date.now },
});

export const Consent = model<IConsent>("Consent", ConsentSchema);
