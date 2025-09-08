import { Router } from "express";
import { validateRequest } from "../middleware/validationMiddleware";
import { userSignupSchema, userLoginSchema } from "../validation/authSchema";
import { logoutUser, registerUser, Signin } from "../controllers/user.controller";
import jwtVerification from "../middleware/authMiddleware";
const router = Router();


router.post("/signup", validateRequest(userSignupSchema), registerUser);
router.post("/Signin", validateRequest(userLoginSchema), Signin);
router.post('/logout',jwtVerification,logoutUser);
export default router;