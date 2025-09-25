import { Request, Response } from "express";

export const saveUsageLogs = async (req: Request, res: Response) => {
  try {
    const logs = req.body;
    const userId = (req as any).user?._id;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: "No logs provided" });
    }


    const usaageLog = (req as any).UsageLog.find({
      userId
    })
    // Check consent
    const consent = await (req as any).Consent.findOne({ userId });
    if (!consent || !consent.appUsage) {
      return res.status(403).json({ error: "User has not consented to usage tracking" });
    }

    const logsWithUser = logs.map((log) => ({
      ...log,
      userId,
    }));
await (req as any).UsageLog.insertMany(logsWithUser);

    res.status(201).json({ message: "Usage logs saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save usage logs" });
  }
};