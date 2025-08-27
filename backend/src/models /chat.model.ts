import { Schema, model, Document, Types } from "mongoose";


// Message interface for TypeScript typing
export interface IMessage {
  _id?: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Chat interface for TypeScript typing
export interface IChat extends Document {
  userId: Types.ObjectId;
  messages: IMessage[];
  title?: string;
  totalMessages: number;
  isActive: boolean;
  archivedAt?: Date;
  archiveReason?: string;
  flagged?: boolean;
  flagReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Message subdocument schema
const messageSchema = new Schema<IMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}); 

// Main chat schema
const chatSchema = new Schema<IChat>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // For faster queries by user
  },
  messages: [messageSchema], // Array of message subdocuments
  title: {
    type: String,
    maxlength: 200
  },
  totalMessages: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  archivedAt: {
    type: Date,
    required: false
  },
  archiveReason: {
    type: String,
    enum: ['user-archived', 'auto-archived-old', 'user-deleted', 'user-deleted-within-window', 'admin-archived'],
    required: false
  },
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    required: false
  }
}, { 
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'chats' // Explicit collection name
});

// Indexes for better query performance
chatSchema.index({ userId: 1, createdAt: -1 }); // User's chats by date
chatSchema.index({ isActive: 1 }); // Active chats
chatSchema.index({ isActive: 1, updatedAt: -1 }); // For auto-archiving old chats
chatSchema.index({ 'messages.timestamp': -1 });

// Pre-save middleware to update message count
chatSchema.pre('save', function() {
  this.totalMessages = this.messages.length;
});

// Instance methods
chatSchema.methods.addMessage = function(role: 'user' | 'assistant', content: string) {
  const message = {
    role,
    content,
    timestamp: new Date()
  };
  
  this.messages.push(message);
  return this.save();
};

// Static method to get user's active chats
chatSchema.statics.getUserActiveChats = function(userId: string) {
  return this.find({ userId, isActive: true }).sort({ updatedAt: -1 });
};

// Static method to get all user chats for research export
chatSchema.statics.getUserAllChats = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

const Chat = model<IChat>('Chat', chatSchema);
export default Chat;