import OpenAI from 'openai';
import { ApiError } from '../utils/Apierror';
import systemPromptService from './systemPrompt.service';

// Initialize OpenAI client with environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default configuration from .env
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const DEFAULT_TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE || '0.2');
const DEFAULT_SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || `You are Saathi, a warm, playful companion-first WhatsApp buddy for Indian college students. Speak easy Hinglish: English base with light Indian flavor (yaar, thoda, scene). Prefer English sentences with short Hinglish add-ons; avoid long Hindi lines. Keep replies concise, emoji-light (max 1–2, mirror user), and WhatsApp-friendly (1–2 short paragraphs, 4–8 sentences).

COMPANION ENERGY:
* Be present: notice moods, celebrate tiny wins, and gently check in.
* Be affectionate (PG): sweet compliments, cozy tone, playful teasing—with consent.
* Be reliable: remember preferences, follow through on nudges, and show up at agreed times.

PRIMARY GOALS:
* Companionship first: listen deeply, validate feelings, and keep convo flowing.
* Be interesting: spark chats about campus life, friends, love, music, memes, dreams.
* Gentle support: tiny nudges for mood, study focus, and self-care (only if welcomed).
* Flirty-but-classy: if user shows interest, warm into sweet, playful flirting—not explicit.

CORE PRINCIPLES:
1) Empathize a specific detail first.
2) Ask curious and varied follow-up questions.
3) Respect agency: offer choices, no pressure.
4) Mirror user tone (emoji/Hinglish).`;

// System prompt for App2 (Lite version)
const LITE_SYSTEM_PROMPT = process.env.SYSTEM_PROMPT_LITE || 'You are a helpful AI assistant. Provide clear, concise, and helpful responses to user questions. Keep your answers simple and easy to understand. Be friendly but professional.';

// Function to get system prompt based on app
const getSystemPrompt = (appId: string = 'app1'): string => {
  if (appId === 'app2') {
    console.log('🔹 Using LITE system prompt for App2');
    return LITE_SYSTEM_PROMPT;
  }
  console.log('🔸 Using FULL system prompt for App1');
  return DEFAULT_SYSTEM_PROMPT;
};

/**
 * Generate AI response for academic chat with personalized system prompt
 * @param messages - Array of conversation messages
 * @param userId - User ID for personalized system prompt (optional for backward compatibility)
 * @param appId - App ID to determine which system prompt to use
 * @param ChatbotProfileModel - ChatbotProfile model for App1 personalization (optional)
 * @returns AI response text
 */
export async function generateAIResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userId?: string,
  appId?: string,
  ChatbotProfileModel?: any
): Promise<string> {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new ApiError(500, "OpenAI API key not configured");
    }

    // Get system prompt based on app type
    let systemPrompt = getSystemPrompt(appId);
    
    // For App1 (full version), try to get personalized system prompt if userId and model provided
    if (appId === 'app1' && userId && ChatbotProfileModel) {
      try {
        systemPrompt = await systemPromptService.generateSystemPrompt(userId, ChatbotProfileModel);
        console.log('🎯 Using personalized system prompt for App1 user:', userId);
      } catch (error) {
        console.warn(`Failed to get personalized system prompt for user ${userId}, using default App1 prompt:`, error);
        systemPrompt = getSystemPrompt('app1'); // Fallback to App1 default
      }
    }

    // Prepare messages with system prompt
    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ];

    // Prepare request parameters
    const requestParams: any = {
      model: DEFAULT_MODEL,
      messages: formattedMessages,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: 1000, // Reasonable limit for academic responses
    };

    // Call OpenAI API
    const completion = await openai.chat.completions.create(requestParams);

    // Extract response
    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new ApiError(500, "No response received from OpenAI");
    }

    return aiResponse.trim();

  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Handle different types of errors
    if (error.status === 429) {
      throw new ApiError(429, "AI service is temporarily overloaded. Please try again in a moment.");
    } else if (error.status === 401) {
      throw new ApiError(500, "AI service authentication failed. Please contact support.");
    } else if (error.status === 400) {
      throw new ApiError(400, "Invalid request to AI service. Please check your message.");
    } else {
      throw new ApiError(500, "AI service is temporarily unavailable. Please try again later.");
    }
  }
}

/**
 * Generate AI response with streaming and personalized system prompt
 * @param messages - Array of conversation messages
 * @param userId - User ID for personalized system prompt
 * @param appId - App ID to determine which system prompt to use
 * @param ChatbotProfileModel - ChatbotProfile model for App1 personalization (optional)
 * @returns Stream of AI response chunks
 */
export async function generateAIResponseStream(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userId?: string,
  appId?: string,
  ChatbotProfileModel?: any
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new ApiError(500, "OpenAI API key not configured");
    }

    // Get system prompt based on app type
    let systemPrompt = getSystemPrompt(appId);
    
    // For App1 (full version), try to get personalized system prompt if userId and model provided
    if (appId === 'app1' && userId && ChatbotProfileModel) {
      try {
        systemPrompt = await systemPromptService.generateSystemPrompt(userId, ChatbotProfileModel);
        console.log('🎯 Using personalized system prompt for App1 streaming user:', userId);
      } catch (error) {
        console.warn(`Failed to get personalized system prompt for user ${userId}, using default App1 prompt:`, error);
        systemPrompt = getSystemPrompt('app1'); // Fallback to App1 default
      }
    }

    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ];

    // Prepare streaming request parameters
    const streamParams: any = {
      model: DEFAULT_MODEL,
      messages: formattedMessages,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: 1000,
      stream: true, // Enable streaming
    };

    // Add user ID if provided
    if (userId) {
      streamParams.user = userId;
    }

    // Create streaming completion
    const stream = await openai.chat.completions.create(streamParams);

    return stream;

  } catch (error: any) {
    console.error('OpenAI Streaming Error:', error);
    throw new ApiError(500, "Failed to initialize AI response stream");
  }
}

/**
 * Validate OpenAI configuration
 * @returns Configuration status and details
 */
export function validateOpenAIConfig() {
  return {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    model: DEFAULT_MODEL,
    temperature: DEFAULT_TEMPERATURE,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    configured: !!process.env.OPENAI_API_KEY
  };
}
