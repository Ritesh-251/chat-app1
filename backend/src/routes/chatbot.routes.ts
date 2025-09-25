import { Router } from "express";
import { saveOrUpdateProfile } from "../controllers/chatbot.controller";
import jwtVerification from "../middleware/authMiddleware";

const router = Router();

// Middleware to only allow App1 users access to chatbot profile features
const app1OnlyMiddleware = (req: any, res: any, next: any) => {
    const appId = req.appId || 'app1';
    if (appId !== 'app1') {
        return res.status(403).json({
            success: false,
            message: "Chatbot profile features are only available in the full version of the app"
        });
    }
    next();
};

// POST /api/v1/chatbot/profile - Only available for App1
router.post("/", jwtVerification, app1OnlyMiddleware, saveOrUpdateProfile);

export default router;
