import { asyncHandler } from "../utils/asyncHandler";
import User from "../models /user.model";
import { Request, Response } from "express";
import { ApiError } from "../utils/Apierror";
import { Types } from "mongoose";
import { userSignupSchema,userLoginSchema } from "../validation/userSchema";
import { z } from "zod";

async function generateAccessTokenandRefreshToken(id: string | Types.ObjectId) {
    try {
        const user = await User.findById(id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        
         user.refreshToken = refreshToken;
         await user.save({ validateBeforeSave: false });
        
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    
    
    const parsed = userSignupSchema.safeParse(req.body);
    if (!parsed.success) {
        console.log("Validation failed:", parsed.error.issues);
        const errorMessages = parsed.error.issues.map(issue => issue.message);
        throw new ApiError(400, "Invalid input", errorMessages);
    }
    

    const {  email, password, name, enrollment, batch, course, country  } = parsed.data;
    
    if (!email || !password) {
        throw new ApiError(411, "Email and password are required");
    }
    
    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(403, "User already exists");
    }
    
    const user = await User.create({
        email,
        password,
        name,
        batch,
        enrollment,
        course,
        country
   

    });
    
    // Remove password from response
    const createdUser = await User.findById(user._id).select("-password");
    
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }
    
    return res.status(200).json({
        success: true,
        message: "User registered successfully",
        data: createdUser
    });
});
export const Signin = asyncHandler(async(req:Request, res:Response)=>{
 const parsed = userLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(issue => issue.message);
    throw new ApiError(400, "Invalid input", errorMessages);
  }

const { email, password } = parsed.data;
const loggedinUser = await User.findOne({email});
if(!loggedinUser){
    throw new ApiError(403,"User doesnot even exist");
}
const PasswordVerification = await loggedinUser.isPasswordCorrect(password);
if(PasswordVerification == false){
    throw new ApiError(403,"Please enter the correct password");
}
const {accessToken,refreshToken} = await generateAccessTokenandRefreshToken(loggedinUser._id as Types.ObjectId);
const user = await User.findById(loggedinUser._id).select("-password -email");
const options = 
{
    httpOnly:true,
    secure:false,
}

return res.status(201).cookie('accessToken',accessToken,options).cookie('refreshToken',refreshToken,options).json({
    token:accessToken

})
})