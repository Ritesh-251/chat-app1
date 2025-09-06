import { Schema, model, Document } from "mongoose";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// User interface for TypeScript typing
export interface IUser extends Document {
  name?: string;
  enrollment: string;
  batch: string;
  course: string;
  country?: string;
  email: string;
  password: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;

  // Method signatures
  generateAccessToken(): string;
  generateRefreshToken(): string;
  isPasswordCorrect(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
    },
    enrollment: {
      type: String,
      required: true,
    },
    batch: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    country: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    refreshToken: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Pre-save hook for password hashing
userSchema.pre("save", async function (this: IUser, next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Generate Access Token
userSchema.methods.generateAccessToken = function (this: IUser): string {
  const expiry = process.env.ACCESS_TOKEN_EXPIRY;
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (!expiry) throw new Error("ACCESS_TOKEN_EXPIRY is not defined");
  if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not defined");

  const payload = {
    _id: this._id,
    email: this.email,
  };

  const options: SignOptions = {
    expiresIn: expiry as any,
  };

  return jwt.sign(payload, secret, options);
};

// Compare Password
userSchema.methods.isPasswordCorrect = async function (
  this: IUser,
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function (this: IUser): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  const expiry = process.env.REFRESH_TOKEN_EXPIRY;

  if (!secret) throw new Error("REFRESH_TOKEN_SECRET is not defined");
  if (!expiry) throw new Error("REFRESH_TOKEN_EXPIRY is not defined");

  const payload = {
    id: this._id,
  };

  const options: SignOptions = {
    expiresIn: expiry as any,
  };

  return jwt.sign(payload, secret, options);
};

const User = model<IUser>("User", userSchema);
export default User;
