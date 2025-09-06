import { notifications } from "../controllers/notificaton.controller";
import { Router } from "express";
const router = Router();


router.get('/',notifications);
export default router;