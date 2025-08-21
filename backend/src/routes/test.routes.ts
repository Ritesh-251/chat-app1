import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/Apierror";
import { validateOpenAIConfig, generateAIResponse } from "../services/openai.service";
import jwtVerification from "../middleware/authMiddleware";

const router = Router();

/**
 * @route   GET /api/test/openai-config
 * @desc    Test OpenAI configuration
 * @access  Private (requires authentication)
 */
router.get("/openai-config", jwtVerification, asyncHandler(async (req, res) => {
    const config = validateOpenAIConfig();
    
    return res.status(200).json({
        success: true,
        message: "OpenAI configuration status",
        data: config
    });
}));

/**
 * @route   POST /api/test/openai-response
 * @desc    Test OpenAI response generation
 * @access  Private (requires authentication)
 * @body    { message: string }
 */
router.post("/openai-response", jwtVerification, asyncHandler(async (req, res) => {
    const { message } = req.body;
    const userId = (req as any).user._id;
    
    if (!message) {
        throw new ApiError(400, "Message is required");
    }
    
    try {
        const testMessage = [
            { role: 'user' as const, content: message }
        ];
        
        const aiResponse = await generateAIResponse(testMessage, userId.toString());
        
        return res.status(200).json({
            success: true,
            message: "AI response generated successfully",
            data: {
                userMessage: message,
                aiResponse: aiResponse,
                config: validateOpenAIConfig()
            }
        });
        
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Failed to generate AI response",
            error: error.message
        });
    }
}));

export default router;
