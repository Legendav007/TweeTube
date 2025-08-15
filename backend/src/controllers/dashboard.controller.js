import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose , {isValidObjectId} from "mongoose";
import {Like} from "../models/like.models.js"
import {Subscription} from "../models/subscription.models.js" 
import {Video} from "../models/video.models.js"

const getChannelStats = asyncHandler(async(req , res)=>{
    // console.log(req.user?._id);
    const channelStats = {};
    try{
    const videoStats = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $group : {
                _id : null,
                totalViews : {$sum : "$views"},
                totalVideos : {$count : {}},
            },
        },
    ]);
    channelStats.totalViews = (videoStats && videoStats[0]?.totalViews) || 0;
    channelStats.totalVideos = (videoStats && videoStats[0]?.totalVideos) || 0;
    } catch(error){
        throw new ApiError(500 , "Error in getting videoStats");
    }
    try{
    const subscriber = await Subscription.aggregate([
        {
            $match : {
                channel : req.user?._id,
            },
        },
        {$count : "totalSubscribers"},
    ]);
    channelStats.totalSubscribers = (subscriber && subscriber[0]?.totalSubscribers) || 0;
    }
    catch(error){
        throw new ApiError(500 , "Error in getting total subscriber");
    }
    try{
    const totalLikes = await Like.aggregate([
        {
            $match : {
                video : {$ne : null},
                liked : true,
            },
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "channelVideo",
                pipeline : [
                    {
                        $match : {
                            owner : req.user?._id,
                        },
                    },
                    {
                        $project : {_id : 1},
                    },

                ],
            },
        },
        {
            $addFields : {
                channelVideo : {
                    $first : "$channelVideo",
                },
            },
        },
        {
            $match : {
                channelVideo : {$ne : null},
            },
        },
        {
            $group : {
                _id : null,
                likeCount : {$sum : 1},
            },
        },
    ]);
    channelStats.totalLikes =(totalLikes && totalLikes[0]?.likeCount) || 0;
    } catch(error){
        throw new ApiError(500 , "Error in getting total likes")
    }
    channelStats.ownerName = req.user?._fullName;
    return res.status(200)
    .json(
        new ApiResponse(
            200,
            channelStats,
            "Channel stats fetched successfully",
        )
    );
});

const getChannelVideos = asyncHandler(async(req , res)=>{
    // console.log(req.user?.username);
    let allVideos;
    try{
        allVideos = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $sort : {
                createdAt : -1,
            },
        },
        //likes
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "video",
                as : "likes",
                pipeline : [
                    {$match : {liked : true}},
                ],
            },
        },
        //dislikes
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "video",
                as : "dislikes",
                pipeline : [
                    {$match : {liked : false}},
                ],
            },
        },
        //comments
        {
            $lookup : {
                from : "comments",
                localField : "_id",
                foreignField : "video",
                as : "comments",
            },
        },
        {
            $project : {
                title : 1,
                thumbnail : 1,
                isPublished : 1,
                createdAt : 1,
                updatedAt : 1,
                description : 1,
                views : 1,
                likesCount : {
                    $size : "$likes",
                },
                dislikesCount : {
                    $size : "$dislikes",
                },
                commentsCount : {
                    $size : "$comments",
                },
            },
        },
    ]);}
    catch(error){
        throw new ApiError(400 , "Error is in aggregation");
    }
    return res.status(200).json(
        new ApiResponse(
            200,
            allVideos,
            "All videos fetched successfully"
        )
    );
});

export {getChannelStats , getChannelVideos};