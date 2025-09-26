import { Request, Response ,NextFunction} from "express";
import { ApiError } from "../utils/Apierror";
import jwt from "jsonwebtoken";

const jwtVerification = async (req:Request,res:Response,next: NextFunction) =>{
    try{
        // Try to get token from cookies first, then from Authorization header
        let token = req.cookies?.accessToken;

        
        if (!token) {
            const authHeader = req.headers["authorization"] || req.headers["Authorization"];
            if (authHeader && typeof authHeader === 'string') {
                if (authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7);
                } else {
                    token = authHeader;
                }
            }
        }
        
        if(!token){
            throw new ApiError(403,"Unauthorized request - no token provided");
        }
        
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET as string) as { _id: string };

        // Debug: log minimal token/auth info to help diagnose cross-app auth issues
        try {
            console.log(`🔐 JWT verify - appId=${(req as any).appId || 'unknown'}, tokenPresent=${!!token}, decodedId=${decodedToken?._id || 'none'}`);
        } catch (e) {
            // ignore logging errors
        }

        // Use app-specific User model from database middleware
        const UserModel = (req as any).User;
        if (!UserModel) {
            throw new ApiError(500, "Database models not initialized - ensure database middleware runs first");
        }
        
        const user = await UserModel.findById(decodedToken?._id);
         if(!user){
             console.warn(`⚠️ Auth failed - token matched id=${decodedToken?._id} but no user found in DB for appId=${(req as any).appId}`);
             throw new ApiError(401,"Invalid access token - user not found");
         }
         // Debug: show successful auth mapping
         console.log(`✅ Authenticated user for appId=${(req as any).appId}: userId=${user._id}`);
         (req as any).user = user;
         next();

    }catch (error) {
    console.error("JWT verification failed:", (error as any).message);
    throw new ApiError(401,  "Invalid access token")
    
   }
}
export default jwtVerification;