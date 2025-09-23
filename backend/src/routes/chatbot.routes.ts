import { Router } from "express";
import { saveOrUpdateProfile } from "../controllers/chatbot.controller";
import jwtVerification from "../middleware/authMiddleware";

const router = Router();

// POST /api/v1/chatbot/profile
router.post("/", jwtVerification, saveOrUpdateProfile);

export default router;
