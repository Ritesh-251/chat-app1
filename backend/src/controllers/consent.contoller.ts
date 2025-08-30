import { Request, Response } from "express";
import { Consent } from "../models /consent.model";


export const getConsent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    const consent = await Consent.findOne({ userId });

    if (!consent) {
      return res.status(200).json({ hasConsent: false });
    }

    res.status(200).json({ hasConsent: true, consent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch consent" });
  }
};

export const saveConsent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;  
    const { conversationLogs, appUsage, audio } = req.body;

    const updatedConsent = await Consent.findOneAndUpdate(
      { userId }, 
      { conversationLogs, appUsage, audio }, 
      { new: true, upsert: true }  
    );

    res.status(200).json({ message: "Consent saved", consent: updatedConsent });
  } catch (err) {
    res.status(500).json({ error: "Failed to save consent" });
  }
};
