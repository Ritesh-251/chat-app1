import { Router } from "express";
import {
    adminLogin,
    adminSignup,
    adminLogout,
    getAdminProfile,
    getDashboardStats,
    getAllStudents,
    getAllChats,
    getAnalytics,
    exportData,
    getFlaggedContent,
    toggleChatFlag,
    
} from "../controllers/admin.controller";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware";
import { validateRequest } from "../middleware/validationMiddleware";
import { adminSignupSchema, adminLoginSchema } from "../validation/authSchema";

const router = Router();


// Public routes (no auth required)
router.post("/login", validateRequest(adminLoginSchema), adminLogin);
router.post("/signup", validateRequest(adminSignupSchema), adminSignup);
// Most recent chat for a student (no auth required)


// Protected routes (require admin auth)
router.use(adminAuthMiddleware); // Apply admin auth middleware to all routes below

router.post("/logout", adminLogout);
router.get("/profile", getAdminProfile);

// Dashboard routes
router.get("/stats", getDashboardStats);
router.get("/analytics", getAnalytics);

// Student management routes
router.get("/students", getAllStudents);

// Chat management routes
router.get("/chats", getAllChats);
router.get("/flagged", getFlaggedContent);
router.patch("/chats/:chatId/flag", toggleChatFlag);

// Export routes
router.get("/export", exportData);

export default router;
