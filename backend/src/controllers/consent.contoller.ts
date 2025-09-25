import { Request, Response } from "express";


export const getConsent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    const consent = await (req as any).Consent.findOne({ userId });

    if (!consent) {
      return res.status(400).json({ hasConsent: false });
    }

    res.status(200).json({ hasConsent: true, consent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch consent" });
  }
};

export const saveConsent = async (req: Request, res: Response) => {
  try {
  
    const user = (req as any).user;
    const { conversationLogs, appUsage, audio } = req.body;
    console.log('saveConsent called. userId:', user?._id, 'body:', req.body);

    const newConsent = await (req as any).Consent.create({
      userId: user._id,
      conversationLogs,
      appUsage,
      audio
    });
    console.log('Result from create:', newConsent);

    res.status(200).json({ message: "Consent saved", consent: newConsent });
  } catch (err) {
    console.error('Error in saveConsent:', err);
    res.status(500).json({ error: "Failed to save consent" });
  }
};
