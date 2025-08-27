import { Request, Response } from "express";
import { Consent } from "../models /consent.model";

export const saveConsent = async (req: Request, res: Response) => {
  try {
    const { researchId, conversationLogs, appUsage, audio } = req.body;

    const consent = await Consent.findOneAndUpdate(
      { researchId },
      { conversationLogs, appUsage, audio, consentGivenAt: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Consent saved", consent });
  } catch (err) {
    res.status(500).json({ error: "Failed to save consent" });
  }
};
