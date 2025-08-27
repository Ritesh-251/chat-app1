import { Router } from "express";
import {
    startChatWithMessage,
    getUserChats,
    getChatById,
    getMostRecentChat,
    addMessage,
    sendMessageWithAI,
    deleteChat,
    deleteMessage,
 
    setActiveChat,
    autoArchiveOldChats,
    archiveChat,
    restoreChat
} from "../controllers/chat.controller";
import jwtVerification from "../middleware/authMiddleware";

const router = Router();

// ==========================================
// CHAT CREATION & STARTING ROUTES
// ==========================================

/**
 * @route   POST /api/chat/start
 * @desc    Start a new chat with first message (ChatGPT-like)
 * @access  Private (requires authentication)
 * @body    { message: string }
 */
router.post("/start", jwtVerification, startChatWithMessage);

// ==========================================
// CHAT RETRIEVAL ROUTES
// ==========================================

/**
 * @route   GET /api/chat/user-chats
 * @desc    Get all active chats for the logged-in user with pagination
 * @access  Private (requires authentication)
 * @query   page?: number, limit?: number
 */
router.get("/user-chats", jwtVerification, getUserChats);

/**
 * @route   GET /api/chat/recent
 * @desc    Get the most recently updated active chat
 * @access  Private (requires authentication)
 */
router.get("/recent", jwtVerification, getMostRecentChat);

/**
 * @route   GET /api/chat/:chatId
 * @desc    Get a specific chat with all messages
 * @access  Private (requires authentication)
 * @params  chatId: string (MongoDB ObjectId)
 */
router.get("/:chatId", jwtVerification, getChatById);

// ==========================================
// CHAT MESSAGING ROUTES
// ==========================================

/**
 * @route   POST /api/chat/:chatId/message
 * @desc    Add a new message to an existing chat
 * @access  Private (requires authentication)
 * @params  chatId: string (MongoDB ObjectId)
 * @body    { message: string, role: 'user' }
 */
router.post("/:chatId/message", jwtVerification, addMessage);

/**
 * @route   POST /api/chat/:chatId/send
 * @desc    Send message and get AI response (ChatGPT-like experience)
 * @access  Private (requires authentication)
 * @params  chatId: string (MongoDB ObjectId)
 * @body    { message: string }
 */
router.post("/:chatId/send", jwtVerification, sendMessageWithAI);

/**
 * @route   DELETE /api/chat/:chatId/message/:messageId
 * @desc    Delete a specific message (only within 15-minute window)
 * @access  Private (requires authentication)
 * @params  chatId: string, messageId: string
 */
router.delete("/:chatId/message/:messageId", jwtVerification, deleteMessage);

// ==========================================
// CHAT MANAGEMENT ROUTES
// ==========================================


/**
 * @route   POST /api/chat/:chatId/active
 * @desc    Mark a chat as currently active (for UI state management)
 * @access  Private (requires authentication)
 * @params  chatId: string (MongoDB ObjectId)
 */
router.post("/:chatId/active", jwtVerification, setActiveChat);

// ==========================================
// DELETION & TIME-RESTRICTION ROUTES
// ==========================================

/**
 * @route   DELETE /api/chat/:chatId
 * @desc    Delete a chat (only within 15-minute window)
 * @access  Private (requires authentication)
 * @params  chatId: string (MongoDB ObjectId)
 */
router.delete("/:chatId", jwtVerification, deleteChat);



// ==========================================
// ARCHIVE MANAGEMENT ROUTES
// ==========================================

/**
 * @route   POST /api/chat/:chatId/archive
 * @desc    Manually archive a chat (different from delete)
 * @access  Private (requires authentication)
 * @params  chatId: string (MongoDB ObjectId)
 * @body    { reason?: string }
 */
router.post("/:chatId/archive", jwtVerification, archiveChat);

/**
 * @route   POST /api/chat/:chatId/restore
 * @desc    Restore an archived chat back to active status
 * @access  Private (requires authentication)
 * @params  chatId: string (MongoDB ObjectId)
 */
router.post("/:chatId/restore", jwtVerification, restoreChat);

/**
 * @route   POST /api/chat/auto-archive
 * @desc    Auto-archive old chats (typically called by cron job or admin)
 * @access  Private (requires authentication)
 * @query   days?: number (default: 30 days)
 */
router.post("/auto-archive", jwtVerification, autoArchiveOldChats);

export default router;
