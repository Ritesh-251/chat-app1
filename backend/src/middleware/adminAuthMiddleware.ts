import Admin from "../models/admin.model";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/Apierror";
import jwt from "jsonwebtoken";

// Extend Request interface to include admin
declare global {
    namespace Express {
        interface Request {
            admin?: any;
        }
    }
}

const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Try to get token from cookies first, then from Authorization header
        let token = req.cookies?.accessToken;
        
        if (!token) {
            const authHeader = req.headers["authorization"] || req.headers["Authorization"];
            if (authHeader && typeof authHeader === 'string') {
                // Handle "Bearer <token>" format
                if (authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7);
                } else {
                    // Handle direct token
                    token = authHeader;
                }
            }
        }
        
        if (!token) {
            throw new ApiError(403, "Unauthorized request - no token provided");
        }
        
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as { _id: string, role: string };
        
        // Check if the token is for admin role
        if (decodedToken.role !== 'admin') {
            throw new ApiError(403, "Access denied - Admin privileges required");
        }
        
        const admin = await Admin.findById(decodedToken?._id);
        if (!admin) {
            throw new ApiError(401, "Invalid access token - admin not found");
        }
        
        if (!admin.isActive) {
            throw new ApiError(403, "Admin account is deactivated");
        }
        
        req.admin = admin;
        next();

    } catch (error) {
        console.error("Admin JWT verification failed:", (error as any).message);
        throw new ApiError(401, "Invalid access token");
    }
}

export default adminAuthMiddleware;
