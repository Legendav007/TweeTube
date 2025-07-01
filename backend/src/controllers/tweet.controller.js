import { Like } from "../models/like.models.js"
import {Subscription} from "../models/subscription.models.js"
import mongoose, { isValidObjectId } from "mongoose";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.models.js";

const createTweet = asyncHandler(async(req , res) => {
    const {tweet} = req.body;
    if(!tweet) throw new ApiError(400 , "Tweet is invalid");
    const tweetRes = Tweet.create({
        content : tweet,
        owner : req.user?._id
    });
    // console.log(req.user);
    if(!tweetRes) throw new ApiError(400 , "Error while tweeting");
    let newTweet = {
        ...tweetRes._doc,
        owner : {
            fullName : req.user?.fullName,
            userName : req.user?.username,
            avatar : req.user?.avatar,
        },
        totalDisLikes : 0,
        totalLikes : 0,
        isLiked : false,
        isDisLiked : false,
    };
    // console.log(newTweet.owner.fullName);
    return res.status(200)
    .json(
        new ApiResponse(200 , newTweet , "Tweet Created Successfully")
    );
});

const getUserTweets = asyncHandler(async(req ,res)=>{
    const {userId} = req.params;
    const cleanUserId = userId.slice(1);
    // console.log(cleanUserId);
    // const userId = rawuserId.slice(1);
    // console.log(typeof(rawUserId))
    // const userId = rawUserId.slice(1);
    const ow = new mongoose.Types.ObjectId(cleanUserId);
    // console.log(ow);
    if(!isValidObjectId(cleanUserId)) throw new ApiError(400 , "Invalid User Id");
    // console.log("here");
    // const allTweets = {};
    const allTweets = await Tweet.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(cleanUserId)
            },
        },
        {
            $sort : {
                createdAt : -1,
            },
        },
        //fetch likes of tweet
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "tweet",
                as : "likes",
                pipeline : [
                    {
                        $match : {
                            liked : true,
                        },
                    },
                    {
                        $group : {
                            _id : "liked",
                            owners : {$push : "$likedBy"},
                        },
                    },
                ],
            },
        },
        //fetch dislikes of  tweet
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "tweet",
                as : "dislikes",
                pipeline : [
                    {
                        $match : {
                            liked : false,
                        },
                    },
                    {
                        $group : {
                            "_id" : "liked",
                            owners : {$push : "$likedBy"},
                        },
                    },
                ],
            },
        },
        //reshaping
        {
            $addFields : {
                likes : {
                    $cond : {
                        if:{
                            $gt : [{$size : "$likes"} , 0],
                        },
                        then :  {$first : "$likes.owners"},
                        else : [],
                    },
                },
                dislikes : {
                    $cond : {
                        if:{
                            $gt: [{$size : "$dislikes"} , 0],
                        },
                        then : {$first : "$dislikes.owners"},
                        else : [],
                    },
                },
            },
        },
        // owner details
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            avatar : 1,
                            fullName : 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind : "$owner",
        },
        {
            $project : {
                content : 1,
                createdAt : 1,
                updatedAt : 1,
                owner : 1,
                totalLikes : {
                    $size : "$likes",
                },
                totalDisLikes : {
                    $size : "$dislikes",
                },
                isLiked : {
                    $cond : {
                        if : {
                            $in : [req.user?._id , "$likes"],
                        },
                        then : true,
                        else : false,
                    },
                },
                isDisLiked : {
                    $cond : {
                        if : {
                            $in : [req.user?._id , "$dislikes"],
                        },
                        then : true,
                        else : false,
                    },
                },
            },
        },
    ]);
    // console.log(allTweets);
    return res.status(200)
    .json(
        new ApiResponse(200 , allTweets , "All tweets retrieved")
    );
});

const getAllTweets = asyncHandler(async(req , res)=>{
    const allTweets = await Tweet.aggregate([
        //sort by latest
        {
            $sort : {
                createdAt : -1,
            },
        },
        //fetch likes of tweet
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "tweet",
                as : "likes",
                pipeline : [
                    {
                        $match : {
                            liked : true,
                        },
                    },
                    {
                        $group : {
                            _id : "liked",
                            owners : {$push : "$likedBy"},
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "tweet",
              as: "dislikes",
              pipeline: [
                {
                  $match: {
                    liked: false,
                  },
                },
                {
                  $group: {
                    _id: "liked",
                    owners: { $push: "$likedBy" },
                  },
                },
              ],
            },
        },
        //reshaping
        {
            $addFields : {
                likes : {
                    $cond : {
                        if:{
                            $gt : [{$size : "$likes"} , 0],
                        },
                        then :  {$first : "$likes.owners"},
                        else : [],
                    },
                },
                dislikes : {
                    $cond : {
                        if:{
                            $gt: [{$size : "$dislikes"} , 0],
                        },
                        then : {$first : "$dislikes.owners"},
                        else : [],
                    },
                },
            },
        },
        // owner details
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            avatar : 1,
                            fullName : 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind : "$owner",
        },
        {
            $project : {
                content : 1,
                createdAt : 1,
                updatedAt : 1,
                owner : 1,
                totalLikes : {
                    $size : "$likes",
                },
                totalDisLikes : {
                    $size : "$dislikes",
                },
                isLiked : {
                    $cond : {
                        if : {
                            $in : [req.user?._id , "$likes"],
                        },
                        then : true,
                        else : false,
                    },
                },
                isDisLiked : {
                    $cond : {
                        if : {
                            $in : [req.user?._id , "$dislikes"],
                        },
                        then: true,
                        else : false,
                    },
                },
            },
        },
    ]);
    return res.status(200)
    .json(new ApiResponse(200 , allTweets , "All tweets retrieved successfully"));    
});
//need to be tested
const getAllUserFeedTweets = asyncHandler(async(req , res)=>{
    const subscriptions = await Subscription.find({subscriber : req.user?._id});
    const subscribedChannel = subscriptions.map((item)=>item.channel);
    
    const allTweets = await Tweet.aggregate([
        {
            $match : {
                owner : {
                    $in : subscribedChannel,
                },
            },
        },
        //sort
        {
            $sort : {
                createdAt : -1,
            },
        },
        //fetch likes of tweet
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "tweet",
                as : "likes",
                pipeline : [
                    {
                        $match : {liked : true},
                    },
                    {
                        $group : {
                            _id : "likes",
                            owners : {$push : "$likedBy"},
                        },
                    },
                ],
            },
        },
        //fetch dislikes
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "tweet",
                as : "dislikes",
                pipeline : [
                    {
                        $match : {
                            liked : false,
                        },
                    },
                    {
                        $group : {
                            _id : "liked",
                            owners : {$push : "$likedBy"},
                        },
                    },
                ],
            },
        },
        //Reshaping
        {
            $addFields : {
                likes : {
                    $cond : {
                        $if : {
                            $gt : [{$size : "$likes"} , 0],
                        },
                        then : {$first : "$likes.owners"},
                        else : [],
                    },
                },
                dislikes : {
                    $cond : {
                        $if : {
                            $gt : [{$size : "$dislikes"} , 0],
                        },
                        then : {$first : "$dislikes.owners"},
                        else : [],
                    },
                },                
            },
        },
        //get owner details
        {
            $lookup : {
                from : "users",
                localField : "_id",
                foreignField : "owner",
                as : "owner",
                pipeline : [
                    {
                        $project : {
                            fullName : 1,
                            userName : 1,
                            avatar : 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind : "$owner",
        },
        {
            $project : {
                content : 1,
                createdAt : 1,
                updatedAt : 1,
                owner : 1,
                isOwner : {
                    $cond : {
                        if : {$eq : [req.user._id , "$owner._id"]},
                        then : true,
                        else : false,
                    },
                },
                totalLikes : {$size : "$likes"},
                totalDisLikes : {$size : "$dislikes"},
                isLiked : {
                    $cond : {
                        if : {
                            $in : [req.user._id , "$likes"],
                        },
                        then : true,
                        else : false,
                    },
                },
                isDisLiked : {
                    $cond : {
                        if : {
                            $in : [req.user._id , "$dislikes"],
                        },
                        then : true,
                        else : false,
                    },
                },                
            },
        },
    ]);
    return res.status(200)
    .json(
        new ApiResponse(200 , allTweets , "Tweet feed retrieved")
    );
});

const updateTweet = asyncHandler(async(req , res)=>{
    const {tweetId} = req.params;
    const cleanTweetId = tweetId.slice(1);
    const {tweet} = req.body;
    // console.log(tweet);
    // console.log(cleanTweetId);
    if(!isValidObjectId(cleanTweetId)) throw new ApiError(400 , "Invalid Tweet");
    if(!tweet) throw new ApiError(400 , "Tweet content required");
    const updatedTweet = await Tweet.findByIdAndUpdate(
        cleanTweetId,
        {
            $set : {
                content : tweet,
            },
        },
        {
            new : true,
        }
    );
    // console.log9u
    // console.log(updatedTweet);
    return res.status(200)
    .json(
        new ApiResponse(200 , updatedTweet , "Tweet Updated Successfully")
    );
});

const deleteTweet = asyncHandler(async(req , res)=>{
    const {tweetId} = req.params;
    const cleanTweetId = tweetId.slice(1);
    if(!isValidObjectId(cleanTweetId)) throw new ApiError(400 , "Invalid TweetId");
    const findRes = await Tweet.findByIdAndDelete(cleanTweetId);
    if(!findRes) throw new ApiError(400 , "Tweet not found");

    const deleteLikes = await Like.deleteMany({
        tweet : new mongoose.Types.ObjectId(cleanTweetId),
    });
    return  res.status(200)
    .json(
        new ApiResponse(200 , findRes , "Tweet deleted Successfully")
    );
});

export {createTweet , getUserTweets , getAllTweets , getAllUserFeedTweets , updateTweet , deleteTweet}