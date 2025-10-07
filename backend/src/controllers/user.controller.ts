// Get most recent chat for a user
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { ApiError } from "../utils/Apierror";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";



async function generateAccessTokenandRefreshToken(id: string | Types.ObjectId, User: any, appId: string = 'app1') {
    try {
        const user = await User.findById(id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Sign access and refresh tokens including appId so we can validate against the correct DB later
        const accessSecret = process.env.ACCESS_TOKEN_SECRET as string;
        const accessExpiry = process.env.ACCESS_TOKEN_EXPIRY as string;
        const refreshSecret = process.env.REFRESH_TOKEN_SECRET as string;
        const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY as string;

        if (!accessSecret || !refreshSecret) {
            throw new ApiError(500, 'Token secrets not configured');
        }

        const accessToken = jwt.sign({ _id: user._id, email: user.email, appId }, accessSecret, { expiresIn: accessExpiry as any });
        const refreshToken = jwt.sign({ _id: user._id, appId }, refreshSecret, { expiresIn: refreshExpiry as any });

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}


export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    // Use app-specific User model
    const User = (req as any).User;
    
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

    // Generate tokens just like in Signin (include appId so tokens are scoped)
    const appId = (req as any).appId || 'app1';
    const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(user._id as Types.ObjectId, User, appId);
    const options = {
        httpOnly: true,
        secure: false,
    };

    return res.status(201)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json({
            token: accessToken,
            refreshToken: refreshToken,
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
    // Use app-specific User model
    const User = (req as any).User;
    
    const { email, password } = req.body;
    const loggedinUser = await User.findOne({email});
    if(!loggedinUser){
        throw new ApiError(403,"User doesnot even exist");
    }
    const PasswordVerification = await loggedinUser.isPasswordCorrect(password);
    if(PasswordVerification == false){
        throw new ApiError(403,"Please enter the correct password");
    }
    const appId = (req as any).appId || 'app1';
    const {accessToken,refreshToken} = await generateAccessTokenandRefreshToken(loggedinUser._id as Types.ObjectId, User, appId);
    const options = 
    {
        httpOnly:true,
        secure:false,
    }

    return res.status(201).cookie('accessToken',accessToken,options).cookie('refreshToken',refreshToken,options).json({
        token:accessToken,
        refreshToken:refreshToken,
        user: {
                email: loggedinUser.email,
                name: loggedinUser.name,
            },
    })
})
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    // Use app-specific User model
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request - no refresh token");
    }

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request - no refresh token");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET as string) as any;

        // Prefer appId from the token when deciding which DB to use
        const tokenAppId = decodedToken?.appId || (req as any).appId || 'app1';

        // Import model registry to get the correct User model for the token's app
    const { getUserModel } = await import('../db/model-registry.js');
        const UserModel = getUserModel(tokenAppId as string);

        const user = await UserModel.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token - user not found");
        }

        const maybeUser: any = user;
        if (incomingRefreshToken !== maybeUser?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: false,
        };

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessTokenandRefreshToken(user._id as Types.ObjectId, UserModel, tokenAppId as string);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json({
                token: accessToken,
                refreshToken: newRefreshToken,
                message: "Access token refreshed successfully",
                success: true
            });
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }
});

export const logoutUser = async (req:Request,res:Response) => {
    await (req as any).User.findByIdAndUpdate(
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