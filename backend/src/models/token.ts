// models/Token.ts
import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.model("Token", TokenSchema);
