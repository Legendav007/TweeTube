import moongose , {isValidObjectId, Mongoose} from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.models.js"
import {Like} from "../models/like.models.js"
import {Tweet} from "../models/tweet.models.js"

const getLikedVideos = asyncHandler(async(req , res)=>{
    const likeVideos = await Like.aggregate([
        {
            $match : {
                video : {$ne : null},
                likedBy : new Mongoose.Types.ObjectId(req._id)
            },
        },
        {
            $lookup: {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "video",
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
                                        username : 1,
                                        fullName : 1,
                                        avatar : 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $unwind : "$owner",
                    },
                ],
            },
        },
        {
            $unwind : "$video",
        },
        {
            $match : {
                "video.isPublished" : true,
            },
        },
        {
            $group : {
                _id : "likedBy",
                videos : {$push : "$video"},
            },
        },
    ])
    const videos = likeVideos[0]?.videos || [];
    return res.status(200)
    .json(new ApiResponse(200 , videos , "Liked videos sent successfully"));
})

const toggleLike = asyncHandler(async(req , res)=>{
    const {toggleLike , commentId , videoId , tweetId} = req.query
    let reqLike;
    if(!isValidObjectId(commentId) && !isValidObjectId(videoId) && !isValidObjectId(tweetId)){
        throw new ApiError(400 , "Invalid Id")
    }
    if(toggleLike === "true") reqLike = true
    else if(toggleLike === "false") reqLike = false
    else throw new ApiError(400 , "Invalid query string")

    let userLike;
    if(commentId){
        const comment = await Comment.findById(commentId)
        if(!comment) throw new ApiError(200 , "No comment found")
        userLike = await Like.find({
            comment : commentId,
            likedBy : req.user?._id,    
        })
    }
    else if(videoId){
        const video = await Video.findById(videoId)
        if(!video) throw new ApiError(400 , "Video not found")
        userLike = await Like.find({
            video : videoId,
            likedBy : req.user?._id,
        })
    }
    else if(tweetId){
        const tweet = await Tweet.findById(tweetId)
        if(!tweet) throw new ApiError(400 , "Tweet does not found")
        userLike = Tweet.find({
            tweet : tweetId,
            likedBy : req.user?._id
        })
    }
    let isLiked = false
    let isDisLiked = false
    if(userLike?.length > 0){
        //Document is present
        if(userLike[0].liked){
            //Like is present
            if(reqLike){
                await Like.findByIdAndDelete(userLike[0]._id)
                isLiked = false
                isDisLiked = false
            }
            else{
                userLike[0].liked = false
                let res = await userLike[0].save()
                if(!res) throw new ApiError(500 , "Error while updating like")
                isLiked = false
                isDisLiked = false
            }
        }
        else{
            //DisLike is present
            if(reqLike){
                userLike[0].liked = true;
                let res = userLike[0].save();
                if(!res) throw new ApiError(500 , "Error while updating dislike");
                isLiked = true;
                isDisLiked = fasle;
            }
            else{
                await Like.findByIdAndDelete(userLike[0]._id);
                isLiked = false;
                isDisLiked = false;
            }
        }
    }
    else{
        //Document is not present
        let like;
        if(commentId){
            like = Like.create({
                comment : commentId,
                likedBy : req.user?._id,
                liked : reqLike,
            });
        }
        else if(tweetId){
            like = Like.create({
                tweet : tweetId,
                likedBy : req.user?._id,
                liked : reqLike,
            });
        }
        else if(videoId){
            like = Like.create({
                video : videoId,
                likedBy : req.user?._id,
                liked : reqLike,
            });
        }
        if(!like){
            throw new ApiError(500 , `Error while {(reqLike)?liking:disliking}`);
        }
        isLiked = reqLike;
        isDisLiked = !reqLike;
    }
    let totalLikes , totalDisLikes;
    if(commentId){
        totalLikes = await Like.find({comment:commentId , liked : true});
        totalDisLikes = await Like.find({comment:commentId , liked : false});
    }
    else if(tweetId){
        totalLikes = await Like.find({tweet:tweetId , liked : true});
        totalDisLikes = await Like.find({tweet:tweetId , liked : false});
    }
    else if(videoId){
        totalLikes = await Like.find({video:videoId , liked : true});
        totalDisLikes = await Like.find({video:videoId , liked : false});
    }
    return res.status(200)
    .json(
        new ApiResponse(200 , {
            isLiked,
            totalLikes : totalLikes.length,
            isDisLiked,
            totalDisLikes : totalDisLikes.length,
        },"Toggle successfull")
    );
});

export {getLikedVideos , toggleLike}