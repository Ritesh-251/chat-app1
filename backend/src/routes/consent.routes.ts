import { Router } from "express";
import { saveConsent } from "../controllers/consent.contoller";

const router = Router();

router.post("/consent", saveConsent);

export default router;
