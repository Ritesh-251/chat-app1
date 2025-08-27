import { Request, Response } from "express";
import { UsageLog } from "../models /usageLog.model";
import { Consent } from "../models /consent.model";

export const saveUsageLogs = async (req: Request, res: Response) => {
  try {
    const logs = req.body; // Array of logs

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: "No logs provided" });
    }

    const researchId = logs[0].researchId;

    // Check consent
    const consent = await Consent.findOne({ researchId });
    if (!consent || !consent.appUsage) {
      return res.status(403).json({ error: "User has not consented to usage tracking" });
    }

    await UsageLog.insertMany(logs);
    res.status(201).json({ message: "Usage logs saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save usage logs" });
  }
};
