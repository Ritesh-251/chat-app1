import { Request, Response } from "express";
import admin from "../firebase";
import { generateAIResponse } from "../services/openai.service";

export const notifications = async (req: Request, res: Response) => {
  try {
    const { token } = req.body; // FCM token from Flutter
    if (!token) return res.status(400).json({ message: "FCM token required" });

    const notificationPrompt = `Generate a short, friendly, and motivating notification message that encourages a student to open the app and continue their study routine.  
The tone should be supportive, positive, and age-appropriate, as if a helpful study buddy is gently reminding them.  
Use a small, friendly emoji at the start.  
Make the message feel personal and actionable, so the student feels like opening the app will help them right now.  
Example formats:

"📚 Ready for a quick study boost? Let’s go!"

"⏰ Your study buddy is waiting to help you today!"

Avoid sounding too formal or pushy.  
Do not use generic phrases like "open the app now."  
Keep the message under 60 characters.`
        
        
    const notification = await generateAIResponse([
      { role: "system", content: notificationPrompt }
    ]);

    const message = {
      token,
      notification: {
        title: "📢 Study Reminder",
        body: notification,
      },
    };

    await admin.messaging().send(message);

    return res.status(200).json({ message: "Notification sent!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to send notification" });
  }
};