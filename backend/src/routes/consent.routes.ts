import { Router } from "express";
import { saveConsent,getConsent} from "../controllers/consent.contoller";
import jwtVerification from "../middleware/authMiddleware";

const router = Router();

router.post("/",jwtVerification, saveConsent);
router.get("/", jwtVerification, getConsent);


export default router;
