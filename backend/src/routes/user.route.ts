import { Router } from "express";
import { registerUser, Signin } from "../controllers/user.controller";

const router = Router();

// Test endpoint
router.get("/test", (req, res) => {
    res.json({ message: "User router is working!" });
});

// Handle CORS preflight requests
router.options("/signup", (req, res) => {
    res.status(200).end();
});

router.options("/Signin", (req, res) => {
    res.status(200).end();
});

// Add a GET handler for debugging (temporary)
router.get("/Signin", (req, res) => {
    res.status(405).json({ 
        error: "Method Not Allowed", 
        message: "This endpoint only accepts POST requests",
        allowedMethods: ["POST"]
    });
});

router.post("/signup", registerUser);
router.post("/Signin", Signin);

export default router;