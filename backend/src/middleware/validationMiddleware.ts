import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/Apierror';

// Generic validation middleware
export const validateRequest = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request body
      const validatedData = schema.parse(req.body);
      
      // Replace req.body with validated and sanitized data
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Extract validation errors
        const errorMessages = error.issues.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        );
        
        throw new ApiError(400, "Validation failed", errorMessages);
      }
      
      // If it's not a Zod error, pass it along
      next(error);
    }
  };
};

// Specific validation middlewares for different endpoints
export const validateAdminSignup = validateRequest;
export const validateAdminLogin = validateRequest;
export const validateUserSignup = validateRequest;
export const validateUserLogin = validateRequest;
