import mongoose, { Document, Schema } from 'mongoose';

interface IUserToken extends Document {
    userId: mongoose.Types.ObjectId;
    fcmToken: string;
    deviceInfo?: {
        platform: string; // iOS, Android
        appVersion?: string;
    };
    isActive: boolean;
    lastUsed: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userTokenSchema = new Schema<IUserToken>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    fcmToken: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    deviceInfo: {
        platform: {
            type: String,
            enum: ['iOS', 'Android', 'Web'],
            default: 'Android'
        },
        appVersion: String
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastUsed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
userTokenSchema.index({ userId: 1, isActive: 1 });
userTokenSchema.index({ fcmToken: 1, isActive: 1 });

// Remove duplicate tokens for same user
userTokenSchema.pre('save', async function(next) {
    if (this.isNew) {
        // Deactivate old tokens for the same user
        await UserToken.updateMany(
            { 
                userId: this.userId, 
                fcmToken: { $ne: this.fcmToken },
                isActive: true 
            },
            { isActive: false }
        );
    }
    next();
});

const UserToken = mongoose.model<IUserToken>('UserToken', userTokenSchema);

export default UserToken;

// Export schema for dynamic database connections
export { userTokenSchema };
export type { IUserToken };