import { Schema, model, Document,Types} from "mongoose";

export interface IConsent extends Document {
  userId: Types.ObjectId;
  conversationLogs: boolean;
  appUsage: boolean;
  audio: boolean;
  consentGivenAt: Date;
}

const ConsentSchema = new Schema<IConsent>({
  userId:{
    type: Schema.ObjectId,
    ref:'User'
  },
  conversationLogs: { type: Boolean, default: true },
  appUsage: { type: Boolean, default: true },
  audio: { type: Boolean, default: false },
  consentGivenAt: { type: Date, default: Date.now },
});

export const Consent = model<IConsent>("Consent", ConsentSchema);
