import { generateAIResponse } from "../services/openai.service";
import { Request, Response } from "express";

export const notifications =  async (req:Request,res:Response)=>{
    try {
   const notificationPrompt= `Generate a short, friendly, and motivating notification message that encourages a student to open the app and continue their study routine.  
The tone should be supportive, positive, and age-appropriate, as if a helpful study buddy is gently reminding them.  
Use a small, friendly emoji at the start.  
Make the message feel personal and actionable, so the student feels like opening the app will help them right now.  
Example formats:

"📚 Ready for a quick study boost? Let’s go!"

"⏰ Your study buddy is waiting to help you today!"

Avoid sounding too formal or pushy.  
Do not use generic phrases like "open the app now."  
Keep the message under 60 characters.`
        
        const notification = await generateAIResponse([{role:"system",content:notificationPrompt}])
        return res.status(200).json({
            notification
        })

    } catch (error) {
        return res.json({"message":"failed to generate an ai notification"})
        
    }
}