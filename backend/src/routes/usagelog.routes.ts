import { Router } from "express";
import { saveUsageLogs } from "../controllers/usage.controller";
import jwtVerification from "../middleware/authMiddleware";

const router = Router();

router.post("/",jwtVerification,saveUsageLogs);

export default router;
