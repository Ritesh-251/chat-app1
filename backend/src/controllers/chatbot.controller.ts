import { Request, Response } from "express";
import ChatbotProfile from "../models/chatbotProfile.model";

export const saveOrUpdateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { gender, purposes } = req.body;

    if (!gender || !Array.isArray(purposes) || purposes.length === 0) {
      return res.status(400).json({ message: "gender and purposes are required" });
    }

    const allowedGenders = ["Male", "Female", "Other"];
    if (!allowedGenders.includes(gender)) {
      return res.status(400).json({ message: "invalid gender" });
    }

    // Upsert: update existing profile or create new one
    const profile = await ChatbotProfile.findOneAndUpdate(
      { userId },
      { gender, purposes },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: "Profile saved", profile });
  } catch (err) {
    console.error("chatbot.controller.saveOrUpdateProfile:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
