import { Request, Response } from "express";
import admin from "../firebase";

// Note: Token model is not implemented yet, using in-memory storage
// TODO: Create Token model when implementing database storage
// import Token from "../models/token.model";

// Store FCM tokens (in-memory for now, should be in database)
const userFCMTokens = new Map<string, string>();

// Predefined messages
const notificationMessages = [
  "📚 Ready for a quick study boost? Let's go!",
  "⏰ Your AI buddy is waiting to help you today!",
  "💡 Time to sharpen your mind—just 10 mins of study!",
  "🔥 A little focus now, big rewards later!",
  "📖 Open your books, your future self will thank you!",
  "🚀 Let's crush one more topic today!",
  "🎯 Stay consistent, you're doing amazing!",
  "🧠 Exercise your brain, one chapter at a time!",
  "✨ Your progress is adding up—keep it going!",
  "🌱 Growth happens a little every day, study time!",
  "📈 Keep leveling up, champion!",
  "⚡ Quick revision now = easier tests later!",
  "🎓 Step closer to your goals today!",
  "💪 You've got this—let's start small!",
  "🔑 One topic today = confidence tomorrow!",
  "📅 Don't break the streak, 5 mins study now!",
  "🎶 Study vibes on! Let's do this!",
  "📔 Notes are waiting to be reviewed!",
  "🌟 Build your skills brick by brick!",
  "💭 A focused mind is unstoppable!",
  "🕒 Even a short study session counts!",
  "📕 Knowledge is your superpower, unlock it!",
  "🚴 Small effort today, big results tomorrow!",
  "🏆 Keep hustling, you're closer than you think!",
  "🌞 Morning brain boost: review one topic!",
  "🌙 Night owl? Let's revise before bed!",
  "🎉 Consistency beats motivation every time!",
  "🌍 The world is yours, keep learning!",
  "⚙️ Sharpen your tools, master your craft!",
  "📌 10 minutes of study now > 0 later!",
];

// Store FCM token from app
export const storeToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "FCM token required" });

    // Store token in memory (should be stored in database with user ID)
    const userId = "anonymous"; // Should get from auth middleware
    userFCMTokens.set(userId, token);
    
    console.log(`📱 FCM token stored for user: ${userId}`);
    console.log(`🔔 Total active tokens: ${userFCMTokens.size}`);

    return res.status(200).json({ 
      message: "FCM token stored successfully",
      randomNotificationsActive: true,
      notificationWindow: "5 PM - 11 PM daily"
    });
  } catch (error) {
    console.error("❌ Error storing FCM token:", error);
    return res.status(500).json({ message: "Failed to store FCM token" });
  }
};

export const notifications = async (req: Request, res: Response) => {
  try {
    const { token } = req.body; 
    if (!token) return res.status(400).json({ message: "FCM token required" });

    // Store token in memory (should be stored in database with user ID)
    const userId = "anonymous"; // Should get from auth middleware
    userFCMTokens.set(userId, token);
    
    console.log(`📱 FCM token stored for user: ${userId}`);
    console.log(`🔔 Total active tokens: ${userFCMTokens.size}`);

    return res.status(200).json({ message: "Token saved!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to save token" });
  }
};

// Test the random notification system
export const testRandomNotification = async (req: Request, res: Response) => {
  try {
    const scheduler = (global as any).notificationScheduler;
    if (!scheduler) {
      return res.status(500).json({ message: "Notification scheduler not available" });
    }

    await scheduler.sendTestNotification();
    
    return res.status(200).json({ 
      message: "Test notification triggered!",
      todaysSchedule: scheduler.getTodaysSchedule()
    });
  } catch (error) {
    console.error("❌ Error sending test notification:", error);
    return res.status(500).json({ message: "Failed to send test notification" });
  }
};

// Get stored FCM tokens (for debugging)
export const getStoredTokens = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      totalTokens: userFCMTokens.size,
      tokens: Array.from(userFCMTokens.keys()) // Don't expose actual tokens
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get tokens" });
  }
};
