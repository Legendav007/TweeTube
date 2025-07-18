import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadImageOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken =  user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeState : false});
        return {accessToken , refreshToken};
    } catch (error) {
        throw new ApiError(500 , "Something went wrong on generating refresh and access token");
    }
}

const registerUser = asyncHandler(async (req , res)=>{
    const {fullName , email , username , password} = req.body;
    // console.log(username);
    if([fullName , email , password , username].some((field)=>{
        field?.trim === ""
    })){
        throw new ApiError(400 , "All fields are required");
    }
    const existedUser = await User.findOne({
        $or: [{username} , {email}]
    })
    if(existedUser){
        throw new ApiError(409 , "User with email or username already existed");
    }
    // const avatarLocalPath = req.files?.avatar[0]?.path;
    let avatarLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatarLocalPath = req.files.avatar[0].path;
    }
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar image is required");
    }
    const avatar = await uploadImageOnCloudinary(avatarLocalPath);
    const coverImage = await uploadImageOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400 , "Avatar file is required");
    }
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500 , "Something went wrong during creation of profile");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser , "User Registered Successfully")
    )

})

const loginUser = asyncHandler(async(req , res)=>{
    // console.log(req.body)
    const {email , username , password} = req.body;
    if((!username && !email) || (!password)){
        throw new ApiError(400 , "Username or Password is required");
    }

    const user = await User.findOne({
        $or:[{username} , {email}]
    })
    if(!user){
        throw new ApiError(404 , "User not found!");    
    }
    // console.log(user._id)
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user credentials");
    }
    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id);
    
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken" -"watchHistory")
    // const {fullName} = loggedInUser
    // console.log(fullName)
    // console.log(loggedInUser)
    const options = {
        httpOnly : true,
        secure : true,
    }
    // console.dir(loggedInUser , {depth : 2})
    
    // const safeUser = loggedInUser.toObject()
    return res.status(200).cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(200,
            {
                user : loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req , res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1
            }
        },
        {
            new : true
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200).clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , {} , "User logged Out successfully"))
})


const refreshAccessToken = asyncHandler(async(req , res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401 , "Unauthorized Request");
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401 , "Invalid Refresh Token");
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh Token is Expired or Used");
        }
        const options = {
            httpOnly : true,
            secure : true
        }
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        return res.status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , newRefreshToken , options)
        .json(
            new ApiResponse(
                200,
                {accessToken , refreshToken : newRefreshToken},
                "Access Token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler(async(req , res) => {
    const {oldPassword , newPassword} = req.body;
    console.log(oldPassword)
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400 , "Password is incorrect");
    }
    user.password = newPassword;
    await user.save({validateBeforeSave : false});
    return res.status(200)
    .json(new ApiResponse(200,{},"Password Changed Successfully"));
})

const getCurrentUser = asyncHandler(async(req , res)=>{
    return res.status(200)
    .json(
        new ApiResponse(
        200,
        req.user,
        "Current user fetched Successfully"
        )
    )
})

const updateAccountDetails = asyncHandler(async(req , res)=>{
    const {fullName , email} = req.body;
    if(!fullName && !email){
        throw new ApiError(400 , "Fields required to change");
    }
    const updateFields = {};
    if(fullName){
        updateFields.fullName = fullName;
    }
    if(email){
        updateFields.email = email;
    }
    const user = await User.findByIdAndUpdate(req.user?._id ,
        {   
            $set : updateFields
        },
        {new : true}
    ).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,
        user,
        "Account Details Updates Successfully"
    ))
})

const updateUserAvatar = asyncHandler(async(req , res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar is missing");
    }
    const avatar = await uploadImageOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400 , "Error while uploading on avatar");
    }
    const user  = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password");
    return res.status(200)
    .json(
        new ApiResponse(200 , user , "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req , res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400 , "Cover Image is missing");
    }
    const coverImage = await uploadImageOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400 , "Error while uploading on cover image");
    }
    const user  = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password");
    return res.status(200)
    .json(
        new ApiResponse(200 , user , "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req , res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400 , "User is missing");
    }
    let channel;
    try{
        channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup : {
                from  : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelSubscribedToCount:{
                    $size : "$subscribedTo"
                },
                subscribersIds : {
                    $map : {
                        input : '$subscribers',
                        as : "sub",
                        in : "$$sub.subscriber"
                    }
                }
            }
        },
        {
            $addFields : {
                isSubscribed : {
                    $in : [req.user?._id , "$subscribersIds"]
                }
            }
        },
        {
            $project : {
                fullName : 1,
                username : 1,
                subscribersCount : 1,
                channelSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1
            }
        }
    ])
    }
    catch(error){
        throw new ApiError(400 , "Issue in the aggregation");
    }
    if(!channel?.length){
        throw new ApiError(404 , "Channel doesn't exits")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200 , channel[0] , "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req , res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1,
                                        userName : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {registerUser,loginUser,logoutUser , refreshAccessToken , getCurrentUser , changeCurrentPassword,
    updateAccountDetails , updateUserAvatar , updateUserCoverImage , getUserChannelProfile , getWatchHistory
}