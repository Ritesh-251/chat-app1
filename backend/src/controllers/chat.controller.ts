import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/Apierror";
import Chat from "../models/chat.model";
import { Types } from "mongoose";
import { generateAIResponse } from "../services/openai.service";

/**
  Prevent token limit issues while maintaining context
 */
function truncateConversationHistory(messages: any[], maxMessages: number = 20): any[] {
    if (messages.length <= maxMessages) {
        return messages; // Short conversation, keep all
    }
    
    // Keep first message for context + recent messages
    const firstMessage = messages[0];
    const recentMessages = messages.slice(-(maxMessages - 1));
    
    return [firstMessage, ...recentMessages];
}


/**
 * START CHAT WITH MESSAGE (Like ChatGPT)
 * Purpose: Create chat and send first message in one action
 * Research Value: Natural conversation flow analysis
 */
export const startChatWithMessage = asyncHandler(async (req: Request, res: Response) => {
    const { message } = req.body;
    const userId = (req as any).user._id;

    // Validate inputs
    if (!userId) {
        throw new ApiError(401, "User authentication required");
    }

    if (!message || message.trim().length === 0) {
        throw new ApiError(400, "Message is required");
    }

    // Ask AI to generate a short title
    const titlePrompt = `Generate a very short title (max 6 words) summarizing this message:\n"${message}"`;

    let autoTitle: string;

    try {
        autoTitle = await generateAIResponse(
            [{ role: "user", content: titlePrompt }]
        );

        // In case AI generates something too long, fallback to first 50 chars
        if (autoTitle.length > 50) {
            autoTitle = autoTitle.substring(0, 47) + "...";
        }
    } catch (err) {
        // fallback if AI fails
        autoTitle = message.length > 50 
            ? message.substring(0, 47) + "..."
            : message;
    }

    // Create chat with the first user message
    const newChat = await Chat.create({
        userId: new Types.ObjectId(userId),
        title: autoTitle,
        messages: [{
            role: 'user',
            content: message.trim(),
            timestamp: new Date()
        }],
        isActive: true
    });

    // Generate AI response
    try {
        // For new chats, we only have one message, but use truncation for consistency
        const conversationHistory = truncateConversationHistory([
            { role: 'user' as const, content: message.trim() }
        ]);
        
        const aiResponse = await generateAIResponse(conversationHistory, userId.toString());
        
        // Add AI response to the chat
        newChat.messages.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
        });
        
        await newChat.save();
        
        return res.status(201).json({
            success: true,
            message: "Chat started with AI response",
            data: {
                chatId: newChat._id,
                title: newChat.title,
                userMessage: message.trim(),
                aiResponse: aiResponse,
                messages: newChat.messages,
                createdAt: newChat.createdAt
            }
        });
        
    } catch (aiError: any) {
        console.error('AI Response Error:', aiError);
        
        // Return chat without AI response if AI fails
        return res.status(201).json({
            success: true,
            message: "Chat started, but AI response failed",
            data: {
                chatId: newChat._id,
                title: newChat.title,
                userMessage: message.trim(),
                error: "AI service temporarily unavailable",
                createdAt: newChat.createdAt
            }
        });
    }
});

/**
 * GET ALL USER CHATS
 * Purpose: Retrieve chat history for a student
 * Research Value: Analyze conversation patterns and academic engagement
 */
export const getUserChats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id; // User added by auth middleware
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Find all chats for the user with pagination
    const chats = await Chat.find({ 
        userId: new Types.ObjectId(userId),
        isActive: true 
    })
    .select('title totalMessages createdAt updatedAt') // Don't send full messages for list view
    .sort({ updatedAt: -1 }) // Most recent first
    .skip(skip)
    .limit(limit);

    // Get total count for pagination
    const totalChats = await Chat.countDocuments({ 
        userId: new Types.ObjectId(userId),
        isActive: true 
    });

    return res.status(200).json({
        success: true,
        message: "Chats retrieved successfully",
        data: {
            chats,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalChats / limit),
                totalChats,
                hasNextPage: page < Math.ceil(totalChats / limit),
                hasPrevPage: page > 1
            }
        }
    });
});

/**
 * GET MOST RECENT ACTIVE CHAT
 * Purpose: Load the last active chat when user opens app (like ChatGPT)
 * Research Value: Track user engagement patterns
 */
export const getMostRecentChat = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;

    // Find the most recently updated chat for the user
    const recentChat = await Chat.findOne({ 
        userId: new Types.ObjectId(userId),
        isActive: true 
    })
    .sort({ updatedAt: -1 }) // Most recent first
    .limit(1);

    if (!recentChat) {
        return res.status(200).json({
            success: true,
            message: "No recent chats found",
            data: {
                hasRecentChat: false,
                shouldShowNewChat: true
            }
        });
    }

    return res.status(200).json({
        success: true,
        message: "Recent chat retrieved",
        data: {
            hasRecentChat: true,
            chat: {
                _id: recentChat._id,
                title: recentChat.title,
                messages: recentChat.messages,
                totalMessages: recentChat.totalMessages,
                createdAt: recentChat.createdAt,
                updatedAt: recentChat.updatedAt
            }
        }
    });
});

/**
 * GET SPECIFIC CHAT WITH MESSAGES
 * Purpose: Retrieve a complete conversation with all messages
 * Research Value: Analyze detailed conversation flow and AI interaction patterns
 */
export const getChatById = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const userId = (req as any).user._id;

    // Validate chat ID exists and format
    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }
    
    if (!Types.ObjectId.isValid(chatId)) {
        throw new ApiError(400, "Invalid chat ID format");
    }

    // Find chat and verify ownership
    const chat = await Chat.findOne({
        _id: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
        isActive: true
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found or access denied");
    }

    return res.status(200).json({
        success: true,
        message: "Chat retrieved successfully",
        data: {
            chat: {
                _id: chat._id,
                title: chat.title,
                messages: chat.messages,
                totalMessages: chat.totalMessages,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt
            }
        }
    });
});

/**
 * ADD MESSAGE TO CHAT
 * Purpose: Store user message only (always user role)
 * Research Value: Capture student questions and academic interests
 * Note: Auto-updates title if still using auto-generated one
 */
export const addMessage = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = (req as any).user._id;

    // Validate inputs
    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }
    
    if (!Types.ObjectId.isValid(chatId)) {
        throw new ApiError(400, "Invalid chat ID format");
    }

    if (!message || message.trim().length === 0) {
        throw new ApiError(400, "Message is required");
    }

    // Find and verify chat ownership
    const chat = await Chat.findOne({
        _id: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
        isActive: true
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found or access denied");
    }

    // Add message to chat (always as user)
    chat.messages.push({
        role: 'user',
        content: message.trim(),
        timestamp: new Date()
    });
    
    // Auto-update title if it's still default
    if (chat.messages.length <= 3 && 
        (chat.title === "New Chat" || chat.title === "General")) {
        const autoTitle = message.length > 50 
            ? message.substring(0, 47) + "..." 
            : message;
        chat.title = autoTitle;
    }
    
    // Update message count and save
    await chat.save();

    // Return updated chat
    const updatedChat = await Chat.findById(chatId);

    return res.status(200).json({
        success: true,
        message: "Message added successfully",
        data: {
            chat: updatedChat,
            newMessage: {
                role: 'user',
                content: message.trim(),
                timestamp: new Date()
            }
        }
    });
});

/**
 * SEND MESSAGE WITH AI RESPONSE
 * Purpose: Add user message and automatically generate AI response
 * Research Value: Capture complete conversation flow for academic research
 * Note: This creates the ChatGPT-like experience for students
 */
export const sendMessageWithAI = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { message } = req.body; // User message
    const userId = (req as any).user._id;

    // Validate inputs
    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }
    
    if (!Types.ObjectId.isValid(chatId)) {
        throw new ApiError(400, "Invalid chat ID format");
    }

    if (!message || message.trim().length === 0) {
        throw new ApiError(400, "Message is required");
    }

    // Find and verify chat ownership
    const chat = await Chat.findOne({
        _id: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
        isActive: true
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found or access denied");
    }

    // Add user message to chat
    chat.messages.push({
        role: 'user',
        content: message.trim(),
        timestamp: new Date()
    });
    
    // Auto-update title if it's still default
    if (chat.messages.length <= 3 && chat.title &&
        (chat.title === "New Chat" || chat.title === "General" || chat.title.endsWith("..."))) {
        const autoTitle = message.length > 50 
            ? message.substring(0, 47) + "..." 
            : message;
        chat.title = autoTitle;
    }
    
    await chat.save();

    // Generate AI response
    try {
        // 🔥 SMART TRUNCATION - Only send relevant messages to avoid token limits
        const truncatedMessages = truncateConversationHistory(chat.messages);
        
        const conversationHistory = truncatedMessages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
        }));
        
        const aiResponse = await generateAIResponse(conversationHistory, userId.toString());
        
        // Add AI response to chat
        chat.messages.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
        });
        
        await chat.save();
        
        // Return complete conversation
        const updatedChat = await Chat.findById(chatId);
        
        return res.status(200).json({
            success: true,
            message: "Message sent and AI response generated",
            data: {
                chat: updatedChat,
                userMessage: message.trim(),
                aiResponse: aiResponse,
                conversationLength: chat.messages.length
            }
        });
        
    } catch (aiError: any) {
        console.error('AI Response Error:', aiError);
        
        return res.status(200).json({
            success: true,
            message: "Message sent, but AI response failed",
            data: {
                chat: await Chat.findById(chatId),
                userMessage: message.trim(),
                error: "AI service temporarily unavailable"
            }
        });
    }
});

/**
 * UPDATE CHAT TITLE
 * Purpose: Allow students to organize their conversations
 * Research Value: Track how students categorize their academic discussions
 Maybe if we want it to be manual later 
export const updateChat = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { title } = req.body;
    const userId = (req as any).user._id;

    // Validate chat ID
    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }
    
    if (!Types.ObjectId.isValid(chatId)) {
        throw new ApiError(400, "Invalid chat ID format");
    }

    // Find and verify chat ownership
    const chat = await Chat.findOne({
        _id: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
        isActive: true
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found or access denied");
    }

    // Update title if provided
    if (title !== undefined) chat.title = title;

    await chat.save();

    return res.status(200).json({
        success: true,
        message: "Chat updated successfully",
        data: {
            chatId: chat._id,
            title: chat.title,
            updatedAt: chat.updatedAt
        }
    });
});
*/

/**
 * DELETE CHAT (TIME-RESTRICTED)
 * Purpose: Allow students to delete chats only within 15 minutes of creation
 * Research Value: Protect research data while allowing immediate mistake correction
 */
export const deleteChat = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const userId = (req as any).user._id;

    // Validate chat ID
    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }
    
    if (!Types.ObjectId.isValid(chatId)) {
        throw new ApiError(400, "Invalid chat ID format");
    }

    // Find and verify chat ownership
    const chat = await Chat.findOne({
        _id: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
        isActive: true
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found or access denied");
    }

    // Check if chat is within 15-minute deletion window
    const now = new Date();
    const chatCreatedAt = new Date(chat.createdAt);
    const timeDifference = now.getTime() - chatCreatedAt.getTime();
    const fifteenMinutesInMs = 15 * 60 * 1000; // 15 minutes in milliseconds

    if (timeDifference > fifteenMinutesInMs) {
        throw new ApiError(403, "Chat deletion not allowed. You can only delete chats within 15 minutes of creation. This chat is now permanently stored for research purposes.");
    }

    // Soft delete - set isActive to false (preserves data for research)
    chat.isActive = false;
    (chat as any).archivedAt = new Date();
    (chat as any).archiveReason = 'user-deleted-within-window';
    await chat.save();

    return res.status(200).json({
        success: true,
        message: "Chat deleted successfully",
        data: {
            deletedAt: new Date(),
            timeRemaining: Math.max(0, fifteenMinutesInMs - timeDifference),
            note: "Chat deleted within the 15-minute window"
        }
    });
});

/**
 * DELETE MESSAGE (TIME-RESTRICTED)
 * Purpose: Allow students to delete individual messages only within 15 minutes
 * Research Value: Protect message data while allowing immediate mistake correction
 */
export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const { chatId, messageId } = req.params;
    const userId = (req as any).user._id;

    // Validate IDs
    if (!chatId || !messageId) {
        throw new ApiError(400, "Chat ID and Message ID are required");
    }
    
    if (!Types.ObjectId.isValid(chatId)) {
        throw new ApiError(400, "Invalid chat ID format");
    }
    
    if (!Types.ObjectId.isValid(messageId)) {
        throw new ApiError(400, "Invalid message ID format");
    }

    // Find and verify chat ownership
    const chat = await Chat.findOne({
        _id: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
        isActive: true
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found or access denied");
    }

    // Find the specific message
    const messageIndex = chat.messages.findIndex(msg => (msg as any)._id?.toString() === messageId);
    
    if (messageIndex === -1) {
        throw new ApiError(404, "Message not found");
    }

    const message = chat.messages[messageIndex];
    
    if (!message) {
        throw new ApiError(404, "Message not found");
    }
    
    // Check if message is within 15-minute deletion window
    const now = new Date();
    const messageCreatedAt = new Date(message.timestamp);
    const timeDifference = now.getTime() - messageCreatedAt.getTime();
    const fifteenMinutesInMs = 15 * 60 * 1000; // 15 minutes in milliseconds

    if (timeDifference > fifteenMinutesInMs) {
        throw new ApiError(403, "Message deletion not allowed. You can only delete messages within 15 minutes of sending. This message is now permanently stored for research purposes.");
    }

    // Remove the message from the array
    chat.messages.splice(messageIndex, 1);
    
    // Save the updated chat
    await chat.save();

    return res.status(200).json({
        success: true,
        message: "Message deleted successfully",
        data: {
            deletedAt: new Date(),
            messageId: messageId,
            remainingMessages: chat.messages.length,
            timeRemaining: Math.max(0, fifteenMinutesInMs - timeDifference),
            note: "Message deleted within the 15-minute window"
        }
    });
});

/**
 * CHECK DELETION ELIGIBILITY
 * Purpose: Check if chat/message can be deleted (within 15-minute window)
 * Research Value: Provide transparency about data retention policy
 */

// Helper function to format time remaining
function formatTimeRemaining(milliseconds: number): string {
    if (milliseconds <= 0) return "0 minutes";
    
    const minutes = Math.floor(milliseconds / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
    
    if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    } else {
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
}

/**
 * MARK CHAT AS CURRENTLY ACTIVE
 * Purpose: Track which chat user is currently viewing (like ChatGPT's selected chat)
 * Research Value: Analyze user navigation patterns
 */
export const setActiveChat = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const userId = (req as any).user._id;

    // Validate chat ID
    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }
    
    if (!Types.ObjectId.isValid(chatId)) {
        throw new ApiError(400, "Invalid chat ID format");
    }

    // Find and verify chat ownership
    const chat = await Chat.findOne({
        _id: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
        isActive: true
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found or access denied");
    }

    // Update the chat's updatedAt to mark it as recently accessed
    // This helps with "most recent" sorting
    chat.updatedAt = new Date();
    await chat.save();

    return res.status(200).json({
        success: true,
        message: "Chat marked as active",
        data: {
            activeChatId: chat._id,
            title: chat.title,
            lastAccessed: chat.updatedAt
        }
    });
});

/**
 * AUTO-ARCHIVE OLD CHATS
 * Purpose: Automatically mark old inactive chats as inactive for better organization
 * Research Value: Track chat lifecycle and user engagement patterns
 */
export const autoArchiveOldChats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const daysOld = parseInt(req.query.days as string) || 30; // Default 30 days
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // Find chats that haven't been updated in X days
    const oldChats = await Chat.updateMany(
        {
            userId: new Types.ObjectId(userId),
            isActive: true,
            updatedAt: { $lt: cutoffDate },
            // Don't archive chats with recent messages
            totalMessages: { $gt: 0 }
        },
        {
            $set: { 
                isActive: false,
                archivedAt: new Date(),
                archiveReason: 'auto-archived-old'
            }
        }
    );

    return res.status(200).json({
        success: true,
        message: `Archived ${oldChats.modifiedCount} old chats`,
        data: {
            archivedCount: oldChats.modifiedCount,
            daysOld: daysOld
        }
    });
});

/**
 * MARK CHAT AS INACTIVE (Manual Archive)
 * Purpose: Allow users to archive chats without deleting them
 * Research Value: Study user organization behavior
 */
export const archiveChat = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { reason } = req.body; // Optional reason for archiving
    const userId = (req as any).user._id;

    // Validate chat ID
    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }
    
    if (!Types.ObjectId.isValid(chatId)) {
        throw new ApiError(400, "Invalid chat ID format");
    }

    // Find and verify chat ownership
    const chat = await Chat.findOne({
        _id: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
        isActive: true
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found or already archived");
    }

    // Archive the chat (different from delete)
    chat.isActive = false;
    (chat as any).archivedAt = new Date();
    (chat as any).archiveReason = reason || 'user-archived';
    await chat.save();

    return res.status(200).json({
        success: true,
        message: "Chat archived successfully",
        data: {
            chatId: chat._id,
            archivedAt: (chat as any).archivedAt,
            reason: reason || 'user-archived'
        }
    });
});

/**
 * RESTORE ARCHIVED CHAT
 * Purpose: Allow users to restore archived chats
 * Research Value: Track chat restoration patterns
 */
export const restoreChat = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const userId = (req as any).user._id;

    // Validate chat ID
    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }
    
    if (!Types.ObjectId.isValid(chatId)) {
        throw new ApiError(400, "Invalid chat ID format");
    }

    // Find archived chat
    const chat = await Chat.findOne({
        _id: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
        isActive: false
    });

    if (!chat) {
        throw new ApiError(404, "Archived chat not found");
    }

    // Restore the chat
    chat.isActive = true;
    chat.updatedAt = new Date(); // Update timestamp
    // Remove archive fields
    (chat as any).archivedAt = undefined;
    (chat as any).archiveReason = undefined;
    await chat.save();

    return res.status(200).json({
        success: true,
        message: "Chat restored successfully",
        data: {
            chatId: chat._id,
            restoredAt: new Date(),
            title: chat.title
        }
    });
});
