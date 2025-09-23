import { Router } from "express";
import { notifications, storeToken, testRandomNotification, getStoredTokens } from "../controllers/notificaton.controller";

const router = Router();

// Store FCM token from app
router.post("/store-token", storeToken);

// Manual notification (existing)
router.post("/", notifications);

// Test random notification system
router.post("/test-random", testRandomNotification);

// Get stored tokens (debugging)
router.get("/tokens", getStoredTokens);

export default router;
