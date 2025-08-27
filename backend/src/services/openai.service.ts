import OpenAI from 'openai';
import { ApiError } from '../utils/Apierror';

// Initialize OpenAI client with environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default configuration from .env
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const DEFAULT_TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE || '0.2');
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || 'You are a helpful academic assistant for students. Provide clear, educational responses.';

/**
 * Generate AI response for academic chat
 * @param messages - Array of conversation messages
 * @param userId - User ID for logging/research purposes
 * @returns AI response text
 */
export async function generateAIResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userId?: string
): Promise<string> {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new ApiError(500, "OpenAI API key not configured");
    }

    // Prepare messages with system prompt
    const formattedMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
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
 * Generate AI response with streaming (for real-time chat experience)
 * @param messages - Array of conversation messages
 * @param userId - User ID for logging
 * @returns Stream of AI response chunks
 */
export async function generateAIResponseStream(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userId?: string
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new ApiError(500, "OpenAI API key not configured");
    }

    const formattedMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
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
    systemPrompt: SYSTEM_PROMPT,
    configured: !!process.env.OPENAI_API_KEY
  };
}
