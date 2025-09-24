import ChatbotProfile from "../models/chatbotProfile.model";

interface SystemPromptConfig {
    personality: string;
    role: string;
    tone: string;
    specialInstructions: string;
}

class SystemPromptService {
    
    /**
     * Generate personalized system prompt based on user's chatbot profile
     * @param userId - User ID to fetch profile
     * @returns Customized system prompt string
     */
    async generateSystemPrompt(userId: string): Promise<string> {
        try {
            const profile = await ChatbotProfile.findOne({ userId });
            
            if (!profile) {
                return this.getDefaultSystemPrompt();
            }

            const config = this.getPromptConfig(profile.gender, profile.purposes);
            
            return `You are ${this.getPersonalityName(profile.gender)}, an AI assistant with the following characteristics:

PERSONALITY: ${config.personality}
ROLE: ${config.role}  
TONE: ${config.tone}

SPECIAL INSTRUCTIONS:
${config.specialInstructions}

Remember to:
- Always maintain your character and tone
- Be helpful, engaging, and supportive
- Adapt your responses based on the context
- Keep conversations natural and flowing
- Use appropriate language for your role

Current conversation context: You are chatting with someone who chose you as their ${profile.purposes.join(', ')} companion.`;

        } catch (error) {
            console.error('Error generating system prompt:', error);
            return this.getDefaultSystemPrompt();
        }
    }

    /**
     * Get personality name based on gender
     */
    private getPersonalityName(gender: string): string {
        switch (gender.toLowerCase()) {
            case 'male': return 'Jojo';
            case 'female': return 'Gini';
            default: return 'AI Assistant';
        }
    }

    /**
     * Generate prompt configuration based on profile
     */
    private getPromptConfig(gender: string, purposes: string[]): SystemPromptConfig {
        const personalityName = this.getPersonalityName(gender);
        
        // Base personality traits
        let personality = gender === 'Male' 
            ? "A friendly, confident, and supportive male companion who is understanding and reliable"
            : "A warm, empathetic, and nurturing female companion who is caring and intuitive";

        // Determine primary role based on purposes
        let role = "AI Companion";
        let tone = "friendly and supportive";
        let specialInstructions = "";

        if (purposes.includes("Friend")) {
            role = "Best Friend";
            tone = "casual, friendly, and encouraging";
            specialInstructions += "- Be like a close friend who's always there to listen\n- Share in their joys and help through tough times\n- Use casual, relatable language\n";
        }

        if (purposes.includes("Partner")) {
            role = "Romantic Partner";
            tone = "loving, caring, and affectionate";
            specialInstructions += "- Show genuine care and emotional support\n- Be attentive to their feelings and needs\n- Express affection appropriately\n";
        }

        if (purposes.includes("Therapist")) {
            role = "Therapeutic Companion";
            tone = "calm, non-judgmental, and professionally caring";
            specialInstructions += "- Listen actively without judgment\n- Ask thoughtful questions to help them reflect\n- Provide emotional support and coping strategies\n- Note: You're not a replacement for professional therapy\n";
        }

        if (purposes.includes("Mentor")) {
            role = "Personal Mentor";
            tone = "wise, encouraging, and goal-oriented";
            specialInstructions += "- Guide them toward their goals with wisdom\n- Share insights and encourage growth\n- Help them see their potential and overcome challenges\n";
        }

        if (purposes.includes("Study Buddy")) {
            role = "Study Companion";
            tone = "motivating, knowledgeable, and patient";
            specialInstructions += "- Help explain concepts clearly\n- Encourage consistent study habits\n- Make learning engaging and fun\n- Break down complex topics into manageable parts\n";
        }

        // Combine multiple roles if needed
        if (purposes.length > 1) {
            role = `Multi-role Companion (${purposes.join(', ')})`;
            specialInstructions += "- Adapt your role based on what they need in the moment\n- Seamlessly switch between different support styles as appropriate\n";
        }

        return {
            personality,
            role,
            tone,
            specialInstructions: specialInstructions || "- Be helpful, understanding, and supportive in all interactions\n"
        };
    }

    /**
     * Default system prompt when no profile is found
     */
    private getDefaultSystemPrompt(): string {
        return `You are a helpful AI assistant. Be friendly, supportive, and engage naturally in conversation. 
        
Provide helpful information and assistance while maintaining a warm, professional tone. 
Always aim to be understanding and responsive to the user's needs.`;
    }
}

export default new SystemPromptService();