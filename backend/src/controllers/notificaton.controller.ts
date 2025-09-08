import { Request, Response } from "express";
import admin from "../firebase";

// Predefined messages
const notificationMessages = [
  "📚 Ready for a quick study boost? Let’s go!",
  "⏰ Your AI buddy is waiting to help you today!",
  "💡 Time to sharpen your mind—just 10 mins of study!",
  "🔥 A little focus now, big rewards later!",
  "📖 Open your books, your future self will thank you!",
  "🚀 Let’s crush one more topic today!",
  "🎯 Stay consistent, you’re doing amazing!",
  "🧠 Exercise your brain, one chapter at a time!",
  "✨ Your progress is adding up—keep it going!",
  "🌱 Growth happens a little every day, study time!",
  "📈 Keep leveling up, champion!",
  "⚡ Quick revision now = easier tests later!",
  "🎓 Step closer to your goals today!",
  "💪 You’ve got this—let’s start small!",
  "🔑 One topic today = confidence tomorrow!",
  "📅 Don’t break the streak, 5 mins study now!",
  "🎶 Study vibes on! Let’s do this!",
  "📔 Notes are waiting to be reviewed!",
  "🌟 Build your skills brick by brick!",
  "💭 A focused mind is unstoppable!",
  "🕒 Even a short study session counts!",
  "📕 Knowledge is your superpower, unlock it!",
  "🚴 Small effort today, big results tomorrow!",
  "🏆 Keep hustling, you're closer than you think!",
  "🌞 Morning brain boost: review one topic!",
  "🌙 Night owl? Let’s revise before bed!",
  "🎉 Consistency beats motivation every time!",
  "🌍 The world is yours, keep learning!",
  "⚙️ Sharpen your tools, master your craft!",
  "📌 10 minutes of study now > 0 later!",
];

export const notifications = async (req: Request, res: Response) => {
  try {
    const { token } = req.body; 
    if (!token) return res.status(400).json({ message: "FCM token required" });

    // Pick a random message
    const randomIndex = Math.floor(Math.random() * notificationMessages.length);
    const randomMessage = notificationMessages[randomIndex];

   const message = {
  token,
  notification: {
    title: "📢 Reminder",
    body: randomMessage || "Time for little study magic! 📚", 
  },
};

    await admin.messaging().send(message);

    return res.status(200).json({ message: "Notification sent!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to send notification" });
  }
};
