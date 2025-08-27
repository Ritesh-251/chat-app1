import { z } from 'zod';

// Admin validation schemas
export const adminSignupSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .trim(),
  email: z.string()
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(4, "Admin password must be at least 4 characters")
    .max(100, "Password must be less than 100 characters")
});

export const adminLoginSchema = z.object({
  email: z.string()
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, "Password is required")
});

// User validation schemas
export const userSignupSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .trim()
    .optional(),
  enrollment: z.string()
    .min(1, "Enrollment number is required")
    .trim(),
  batch: z.string()
    .min(1, "Batch is required")
    .trim(),
  course: z.string()
    .min(1, "Course is required")
    .trim(),
  country: z.string()
    .trim()
    .optional(),
  email: z.string()
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, "User password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters")
});

export const userLoginSchema = z.object({
  email: z.string()
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, "Password is required")
});

// Export types for TypeScript
export type AdminSignupInput = z.infer<typeof adminSignupSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type UserSignupInput = z.infer<typeof userSignupSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
