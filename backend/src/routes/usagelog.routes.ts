import { Router } from "express";
import { saveUsageLogs } from "../controllers/usage.controller";

const router = Router();

router.post("/usage", saveUsageLogs);

export default router;
