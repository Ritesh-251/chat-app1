import { Router } from "express";
import { notifications } from "../controllers/notificaton.controller";

const router = Router();

router.post("/", notifications);

export default router;
