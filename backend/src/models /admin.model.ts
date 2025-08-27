import { Schema, model, Document } from "mongoose";
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Admin interface for TypeScript typing
export interface IAdmin extends Document {
    name: string;
    email: string;
    password: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    generateAccessToken(): string;
    isPasswordCorrect(password: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minLength: 4
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });


adminSchema.index({ email: 1 });

// Hash password before saving
adminSchema.pre("save", async function (this: IAdmin, next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});


// Generate access token method (simple)
adminSchema.methods.generateAccessToken = function (this: IAdmin): string {
    const expiry = process.env.ACCESS_TOKEN_EXPIRY;
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!expiry) throw new Error("ACCESS_TOKEN_EXPIRY is not defined");
    if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not defined");
    const payload = {
        _id: this._id,
        email: this.email,
        role: 'admin'
    };
     const options: SignOptions = {
            expiresIn: expiry as any
        };
    
    return jwt.sign(payload, secret , options);
};

// Password comparison method
adminSchema.methods.isPasswordCorrect = async function(this: IAdmin, password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

const Admin = model<IAdmin>('Admin', adminSchema);
export default Admin;
