import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.models.js";

const toggleSubscription = asyncHandler(async(req , res)=>{
    const {channelId} = req.params;
    if(!isValidObjectId(channelId)) throw new ApiError(400 , "Invalid ChannelId");
    let isSubscribed;
    const findSub = await Subscription.findOne({
        subscriber : req.user?._id,
        channel : channelId,
    });
    if(findSub){
        const res = await Subscription.deleteOne({
            subscriber : req.user?._id,
            channel : channelId,
        });
        isSubscribed = false;
        // if(!nSub) throw new ApiError(400 , "Failed subscription func");
    }
    else{
        const nSub = await Subscription.create({
            subscriber : req.user?._id,
            channel : channelId,
        });
        isSubscribed = true;
        if(!nSub) throw new ApiError(400 , "Failed subscription func");
    }
    return res.status(200)
    .json( new ApiResponse(200,{ isSubscribed },"Subscription toggle successfully"));
});

const getUserSubscribers = asyncHandler(async(req , res)=>{
    const {channelId = req.user?._id} = req.params;
    if(!isValidObjectId(channelId)) throw new ApiError(400 , "Not a valid channelId");
    const result = await subscriber.aggregate([
        {
            $match : {
                channel : new moongose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "channel",
                foreignField : "subscriber",
                as : "subscribedChannels",
            },
        },
        {
            $lookup : {
                from : "users",
                localField : "subscriber",
                foreignField : "_id",
                as : "subscriber",
                pipeline : [
                    {
                        $lookup : {
                            from : "subscritions",
                            localField : "_id",
                            foreignField : "channel",
                            as : "subscribersSubscribers",
                        },
                    },
                    {
                        $project : {
                            username : 1,
                            avatar : 1,
                            fullName : 1,
                            subscribersCount : {
                                $size : "$subscribersSubscribers",
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind : {
                path : "$subscriber",
                preserveNullAndEmptyArrays : true,
            },
        },
        {
            $addFields : {
                "subscriber.isSubscribed" : {
                    $cond : {
                        if : {
                            $in : ["$subscriber._id" , "$subscribedChannels.channel"],
                        },
                        then : true,
                        else  : false,
                    },
                },
            },
        },
        {
            $group : {
                _id : "channel",
                subscriber : {
                    $push : "$subscriber",
                },
            },
        },
    ]);
    const num = result?.length > 0 ? result[0].subscriber : [];
    return res.status(200)
    .json(new ApiResponse(200 , num , "Subscriber sent successfully"));
});

const UserSubscribedChannels = asyncHandler(async(req , res)=>{
    const {subscriberId} = req.params;
    if(!isValidObjectId(subscriberId)) throw new ApiError(400 , "Not valid subscriberId");
    // console.log(subscriberId);
    let result;
    try{
     result = await Subscription.aggregate([
        {
            $match : {
                subscriber : new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "channel",
                pipeline : [
                    {
                        $project : {
                            fullName : 1,
                            username : 1,
                            avatar : 1,
                        }
                    },
                ],
            },
        },
        {$unwind : "$channel",},
        {
            $lookup : {
                from : "subscriptions",
                localField : "channel._id",
                foreignField : "channel",
                as : "channelSubscribers",
            },
        },
        {
            $addFields : {
                "channel.isSubscribed" : {
                    $cond : {
                        if : {$in : [req.user?._id , "$channelSubscribers.subscriber"]},
                        then : true,
                        else  : false,
                    },
                },
                "channel.subscribersCount" : {
                    $size : "$channelSubscribers",
                },   
            },
        },
        {
            $group : {
                _id : "$subscriber",
                subscribedChannels : {
                    $push : "$channel",
                },
            },
        },  
    ]);
    }
    catch(error){
        throw new ApiError(400 , "Error is in aggregation" , error.message)
    }
    const users = result?.length > 0 ? result[0].subscribedChannels : [];
    return res.status(200)
    .json(new ApiResponse(200 , users , "Subscribed channel list sent!"));
});

export {toggleSubscription , getUserSubscribers , UserSubscribedChannels};