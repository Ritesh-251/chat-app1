import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

export const connectDb = () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing URI");
    return mongoose.connect(uri as string);
};