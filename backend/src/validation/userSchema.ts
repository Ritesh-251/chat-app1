import { z } from "zod";

export const userSignupSchema = z.object({
  name: z.string().optional(),
  enrollment: z.string().min(1, { message: "Enrollment number is required" }),
  batch: z.string().min(1, { message: "Batch is required" }),
  course: z.string().min(1, { message: "Course is required" }),
  country: z.string().optional(),
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(10, { message: "Password must be at least 10 characters long" }),
});

export const userLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" }),
});