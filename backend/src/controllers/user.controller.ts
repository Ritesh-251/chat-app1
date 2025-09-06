// Get most recent chat for a user
import { asyncHandler } from "../utils/asyncHandler";
import User from "../models/user.model";
import { Request, Response } from "express";
import { ApiError } from "../utils/Apierror";
import { Types } from "mongoose";



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
    const { email, password, name, enrollment, batch, course, country } = req.body;

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

    // Generate tokens just like in Signin
    const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(user._id as Types.ObjectId);
    const options = {
        httpOnly: true,
        secure: false,
    };

    return res.status(201)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json({
            token: accessToken,
            user: {
                email: createdUser.email,
                name: createdUser.name,
                enrollment: createdUser.enrollment,
                batch: createdUser.batch,
                course: createdUser.course,
                country: createdUser.country,
                createdAt: createdUser.createdAt
            },
            success: true,
            message: "User registered successfully"
        });
});
export const Signin = asyncHandler(async(req:Request, res:Response)=>{
    const { email, password } = req.body;
    const loggedinUser = await User.findOne({email});
    if(!loggedinUser){
        throw new ApiError(403,"User doesnot even exist");
    }
    const PasswordVerification = await loggedinUser.isPasswordCorrect(password);
    if(PasswordVerification == false){
        throw new ApiError(403,"Please enter the correct password");
    }
    const {accessToken,refreshToken} = await generateAccessTokenandRefreshToken(loggedinUser._id as Types.ObjectId);
    const options = 
    {
        httpOnly:true,
        secure:false,
    }

    return res.status(201).cookie('accessToken',accessToken,options).cookie('refreshToken',refreshToken,options).json({
        token:accessToken, user: {
                email: loggedinUser.email,
                name: loggedinUser.name,
            },
    })
})
export const logoutUser = async (req:Request,res:Response) => {
    await User.findByIdAndUpdate(
      (req as any).user._id,
      {
         $set: {
            refreshToken: undefined
         }
      },{
         new: true
      }
    )
    const options = {
      httpOnly: true,
      secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",  options)
    .json("User logged out successfully");

   
}