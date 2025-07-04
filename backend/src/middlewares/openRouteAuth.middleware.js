import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const checkUser = asyncHandler(async(req , res , next)=>{
    try { 
        const accessToken = req.cookies?.accessToken || 
        req.header("Authorization")?.replace("Bearer" , "");
        if(accessToken){
            const decodedToken = jwt.verify(
                accessToken,
                process.env.ACCESS_TOKEN_SECRET
            );
            if(!decodedToken) return next();
            const user = await User.findById(decodedToken._id).select(
                "-password -refreshToken"
            );
            if(!user) return next();
            req.user = user;
        }
        next();
    }
    catch(error){
        throw new ApiError(401 , error?.message || "Invalid access token");
    }
});

export {checkUser}