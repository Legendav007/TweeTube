import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose , {isValidObjectId} from "mongoose";
import {Like} from "../models/like.models.js"
import {Subscription} from "../models/subscription.models.js" 

const getChannelStats = asyncHandler(async(req , res)=>{
    const channelStats = {};
    const videoStats = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $project : {
                viewsCount : {$size : "$views"},
            },
        },
        {
            $group : {
                _id : null,
                totalViews : {$sum : "$viewsCount"},
                totalVideos : {$sum : 1},
            },
        },
    ]);
    const subscriber = await Subscription.aggregate([
        {
            $match : {
                channel : req.user?._id,
            },
        },
        {$count : totalSubscribers},
    ]);
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
    channelStats.ownerName = req.user?._fullName;
    channelStats.totalViews = (videoStats && videoStats[0]?.totalViews) || 0;
    channelStats.totalVideos = (videoStats && videoStats[0]?.totalVideos) || 0;
    channelStats.totalSubscribers = (subscriber && subscriber[0]?.totalSubscribers) || 0;
    channelStats.totalLikes =(totalLikes && totalLikes[0]?.likeCount) || 0;

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
    const allVideos = await Video.aggregate([
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
                titie : 1,
                thumnail : 1,
                isPublished : 1,
                createdAt : 1,
                updatedAt : 1,
                description : 1,
                views : 1,
                likesCount : {
                    $size : "$likes",
                },
                dislikesCount : {
                    $size : "dislikes",
                },
                commentsCount : {
                    $size : "comments",
                },
            },
        },
    ]);
    return res.status(200).json(
        new ApiResponse(
            200,
            allVideos,
            "All videos fetched successfully"
        )
    );
});

export {getChannelStats , getChannelVideos};