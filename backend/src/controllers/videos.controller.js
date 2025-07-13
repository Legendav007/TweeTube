import mongoose , {isValidObjectId} from "mongoose"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import {
    deleteImageOnCloudinary,
    deleteVideoOnCloudinary,
    uploadImageOnCloudinary,
    uploadVideoOnCloudinary,
} from "../utils/cloudinary.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import {stopWords} from "../utils/stopWords.js"
import { Playlist } from "../models/playlist.model.js";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllVideosByOption = asyncHandler(async(req , res)=>{
    const {
        page = 1,
        limit = 1,
        search = "",
        sortBy,
        sortType = "video",
        order,
        userId,
    } = req.query;
    let filters = {isPublished : true};
    if(isValidObjectId(userId)){
        filters.owner = new mongoose.Types.ObjectId(userId);
    }
    let pipeline = [
        {
            $match : {
                ...filters,
            },
        },
    ];
    const sort = {};
    if(search){
        const queryWords = search
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .split(" ");
        const filterWords = queryWords.filter((word)=>!stopWords.includes(word));
        pipeline.push({
            $addFields : {
                titleMatchWordCount : {
                    $size : {
                        $filter : {
                            input : filterWords,
                            as : "word",
                            cond : {
                                $in : ["$$word" , {$split : [{$toLower : "$title"} , " "]}],
                            },
                        },
                    },
                },
            },
        });
        pipeline.push({
            $addFields : {
                descriptionMatchWordCount : {
                    $size : {
                        $filter : {
                            input : filterWords,
                            as : "word",
                            cond : {
                                $in : [
                                    "$$word",{$split : [{$toLower : "$description"}," "]},
                                ],
                            },
                        },
                    },
                },
            },
        });
        sort.titleMatchWordCount = -1;
    }
    if(sortBy){
        sort[sortBy] = parseInt(order);
    }
    else if(!search && !sortBy){
        sort["createdAt"] = -1;
    };
    pipeline.push({
        $sort : {
            ...sort,
        },
    });
    pipeline.push(
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
    );
    const videoAggregate = await Video.aggregate(pipeline);
    const options = {
        page : parseInt(page , 10),
        limit : parseInt(limit , 10)
    }
    const allVideos = await Video.aggregatePaginate(videoAggregate , options);
    const {docs , ...pagingInfo} = allVideos;
    return res.status(200)
    .json(
        new ApiResponse(200 , {videos : docs , pagingInfo} , "Videos sent successfully")
    );
});

const getAllVideos = asyncHandler(async(req , res)=>{
    const {userId} = req.query;
    let filters = {isPublished : true};
    if(isValidObjectId(userId)) filters.owner = new mongoose.Types.ObjectId(userId);
    let pipeline = [
        {
            $match : {
                ...filters,
            },
        },
    ];
    pipeline.push({
        $sort : {
            createdAt : -1,
        },
    });
    pipeline.push(
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
        }
    );
    const allVideos = await Video.aggregate(Array.from(pipeline));
    return res.status(200)
    .json(new ApiResponse(200 , allVideos , "All videos sent successfully"));
});

const publishVideo = asyncHandler(async(req , res)=>{
    const {title , description} = req.body;
    if(!title) throw new ApiError(400 , "Title is req to publish video");
    let videoLocalFilePath = null;
    if(req.files && req.files.videoFile && req.files.videoFile.length > 0){
        videoLocalFilePath = req.files.videoFile[0].path;
    }
    if(!videoLocalFilePath) throw new ApiError(400 , "Video file required");
    let thumbnailLocalFilePath = null;
    if(req.files && req.files.thumbnail && req.files.thumbnail.length > 0){
        thumbnailLocalFilePath = req.files.thumbnail[0].path;
    }
    if(!thumbnailLocalFilePath) throw new ApiError(400 , "Thumbnail file required");
    if(req.customConnectionClosed){
        console.log("Connection closed, aborting video and thumbnail upload...");
        console.log("All resources Cleaned up & request closed...");
        return;
    }
    const videoFile = await uploadVideoOnCloudinary(videoLocalFilePath);
    if(!videoFile) throw new ApiError(500 , "Error while uploading file");
    if(req.customConnectionClosed){
        console.log("Connection closed!!! deleting video and aborting thumbnail upload...");
        await deleteVideoOnCloudinary(videoFile.url);
        fs.unlinkSync(thumbnailLocalFilePath);
        return;
    }
    const thumbnailFile = uploadImageOnCloudinary(thumbnailLocalFilePath);
    if(!thumbnailFile) throw new ApiError(500 , "Error while uploading thumbnail");
    if(req.customConnectionClosed){
        console.log("Connection closed!!! deleting video and aborting thumbnail upload...");
        await deleteVideoOnCloudinary(videoFile.url);
        await deleteImageOnCloudinary(thumbnailFile.url);
        return;
    }
    console.log("updating db...");
    const video = await Video.create({
        videoFile : videoFile.hlsurl,
        title,
        description : description || "",
        duration : videoFile.duration,
        thumbnail : thumbnailFile.url,
        owner : req.user?._id,
    });
    if(!video) throw new ApiError(500 , "Erro while publishing video");
    if(req.customConnectionClosed){
        console.log("Connection closed!!! deleting video & thumbnail & dbEntry and aborting response...");
        await deleteVideoOnCloudinary(videoFile.url);
        await deleteImageOnCloudinary(thumbnailFile.url);
        let video = await Video.findByIdAndDelete(video._id);
        console.log("Deleted the Video from db: ", video);
        console.log("All resources Cleaned up & request closed...");
        return;       
    }
    return res.status(200)
    .json(new ApiResponse(200 , video , "Video published Successfully"));
});

const getVideoById = asyncHandler(async(req , res)=>{
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Invalid videoId");
    const video = await Video.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(videoId),
                isPublished : true,
            },
        },
        //all likes
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "video",
                as  : "likes",
                pipeline : [
                    {
                        $match : {
                            liked : true,
                        },
                    },
                    {
                        $group : {
                            _id : "$liked",
                            likeOwners : {$push : "$likedBy"},
                        },
                    },
                ],
            },
        },
        //all dislikes
        {
            $lookup : {
                from : "likes",
                localField : "id",
                foreignField : "video",
                as : "dislikes",
                pipeline : [
                    {
                        match : {
                            liked : false,
                        },
                    },
                    {
                        $group : {
                            _id : "$liked",
                            dislikeOwners : {$push : "$likedBy"},
                        },
                    },
                ],
            },
        },
        {
            $addFields : {
                likes : {
                    $cond : {
                        if : {
                            $gt : [{$size : "$likes"} , 0],
                        },
                        then : {$first : "$likes.likeOwners"},
                        else : [],
                    },
                },
                dislikes : {
                    $cond : {
                        if : {
                            $gt : [{$size : "$dislikes"} , 0],
                        },
                        then : {$first : "$dislikes.dislikeOwners"},
                        else : [],
                    },
                },                
            },
        },
        //owner detail
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
                            username : 1,
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
                videoFile: 1,
                title: 1,
                description: 1,
                duration: 1,
                thumbnail: 1,
                views: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
                totalLikes : {
                    $size : "$likes",
                },
                totalDislikes : {
                    $size : "$dislikes",
                },
                isLiked: {
                    $cond: {
                      if: {
                        $in: [req.user?._id, "$likes"],
                      },
                      then: true,
                      else: false,
                    },
                },
                isDisLiked: {
                    $cond: {
                      if: {
                        $in: [req.user?._id, "$dislikes"],
                      },
                      then: true,
                      else: false,
                    },
                },
            },
        },
    ]);
    if(!video.length > 0) throw new ApiError(400 , "No video found");
    return res.status(200)
    .json(new ApiResponse(200 , video[0] , "Video sent successfully"));
});

const updateVideo = asyncHandler(async(req , res)=>{
    const {videoId} = req.params;
    const {title , description} = req.body;
    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Not valid video id");
    const thumbnailLocalFilePath = req.file?.path;
    if(!title && !description && !thumbnailLocalFilePath){
        throw new ApiError(400 , "Atleast one field required for updation");
    }
    //owner validation
    const video = Video.findById(videoId);
    if(!video) throw new ApiError(404 , "Video not found");
    if(video.owner.toString() === req.user?._id.toString()){
        throw new ApiError(400 , "Only owner can modify video details");
    }
    let thumbnail;
    if(thumbnailLocalFilePath){
        thumbnail = uploadImageOnCloudinary(thumbnailLocalFilePath);
        if(!thumbnail){
            throw new ApiError(500 , "Error occurred while uploading thumbnail");
        }
        await deleteImageOnCloudinary(video.url);
    }
    if(title) video.title = title;
    if(description) video.description = description;
    if(thumbnail) video.thumbnail = thumbnail;

    const updateVideo = await video.save({validateBeforeSave : false});
    if(!updateVideo) throw new ApiError(500 , "Error while uploading video");
    return res.status(200)
    .json(new ApiResponse(200 , updateVideo , "Video updated successfully"));
});

const deleteVideo = asyncHandler(async(req , res)=>{
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)) throw new ApiError(404 , "Video not found");
    const findRes = await Video.findByIdAndDelete(videoId);
    if(!findRes) throw new ApiError(400 , "Video not found");
    await deleteVideoOnCloudinary(findRes.videoFile);

    const deleteVideoLikes = await Like.deleteMany({
        video : new mongoose.Types.ObjectId(videoId),
    });
    const videoComments = await Comment.find({
        video : new mongoose.Types.ObjectId(videoId)
    });
    const commentIds = videoComments.map((comment)=>comment._id);
    const deleteCommentLikes = await Like.deleteMany({
        comment : {$in : commentIds},
    });
    const deleteVideoComments = await Comment.deleteMany({
        video : new mongoose.Types.ObjectId(videoId)
    })
    const deleteVideoFromPlaylist = await Playlist.updateMany(
        {},
        {$pull : {videos : new mongoose.Types.ObjectId(videoId)}}
    );
    return res.status(200)
    .json(new ApiResponse(200 , [] , "Video deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async(req , res)=>{
    const {videoId} = req.params;
    if(!videoId) throw new ApiError(400 , "VideoID required");

    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(404 , "Video not found");
    video.isPublished = !isPublished;
    const updatedVideo = await video.save();
    if(!updateVideo) throw new ApiError(400 , "Failed to toggle publish status");
    return res.status(200).json(
        new ApiResponse(
            200,
            {isPublished : updatedVideo.isPublished},
            "Toggle publish status successfully"
        )
    );
});

const updateView = asyncHandler(async(req , res)=>{
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Not valid videoId");
    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(404 , "Video not found");
    video.views += 1;
    const updatedVideo = await video.save();
    if(!updatedVideo) throw new ApiError(400 , "Error while updating views");
    let watchHistory;
    if(req.user){
        watchHistory = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $push : {
                    watchHistory : new mongoose.Types.ObjectId(videoId),
                },
            },
            {
                new : true,
            },
        );
    }
    return res.status(200).json(
        new ApiResponse(200, {
          isSuccess: true,
          views: updatedVideo.views,
          watchHistory,
        }, "Video views updated successfully")
    );
});

export {getAllVideosByOption , getAllVideos , publishVideo , getVideoById
    ,updateVideo , deleteVideo , togglePublishStatus , updateView,
}
