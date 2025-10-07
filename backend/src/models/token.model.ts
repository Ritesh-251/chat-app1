import { Schema, model, Document } from 'mongoose';

export interface IToken extends Document {
    userId?: string;
    token: string;
    userEmail?: string;
    platform?: string; // e.g., 'android' | 'ios'
    createdAt?: Date;
    updatedAt?: Date;
}

const TokenSchema = new Schema<IToken>({
    userId: { type: String, required: false },
    token: { type: String, required: true },
    platform: { type: String, required: false },
}, { timestamps: true });

export default model<IToken>('Token', TokenSchema);
export { TokenSchema };
