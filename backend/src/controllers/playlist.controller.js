import mongoose , {isValidObjectId} from "mongoose";
import {Playlist} from "../models/playlist.models.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const createPlaylist = asyncHandler(async(req , res)=>{
    const {name , description} = req.body;
    if(!name) throw new ApiError(400 , "Name is required");
    
    const playlist = await Playlist.create({
        name,
        description : description || "",
        owner : req.user?._id,
    });
    if(!playlist) throw new ApiError(400 , "Error while creating playlist");
    return res.status(200)
    .json(new ApiResponse(200 , playlist , "Playlist created succesfully"));
});

const getUserPlaylists = asyncHandler(async(req , res)=>{
    const {userId} = req.params;
    if(!isValidObjectId(userId)) throw new ApiError(400 , "Not a valid user id");

    const playlists = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId),
            },
        },
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
                            views : 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup : {
                from : "videos",
                localField : "videos",
                foreignField : "_id",
                as : "videos",
                pipeline : [
                    {
                        $project : {
                            thumbnail : 1,
                            views : 1,
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
                name : 1,
                description : 1,
                owner : 1,
                thumbnail : 1,
                videosCount : 1,
                createdAt : 1,
                updatedAt : 1,
                thumbnail : {
                    $first : "$videos.thumbnail",
                },
                videosCount : {
                    $size : "$videos",
                },
                totalViews : {
                    $sum : "$videos.views",
                },
            },
        },
    ]);
    return res.status(200)
    .json(new ApiResponse(200 , playlists , "Playlist sent successfully"));
});

const getPlaylistById = asyncHandler(async(req , res)=>{
    const {playlistId} = req.params;
    if(!isValidObjectId(playlistId)) throw new ApiError(400 , "Not a valid playlist id");

    const playlists = Playlist.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(playlistId),
            },
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "videos",
                pipeline : [
                    {
                        $match : {isPublished : true,},
                    },
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
                        $addFields : {
                            owner : {
                                $first : "$owner",
                            },
                        },
                    },
                ],
            },
        },
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
            $addFields : {
                owner : {
                    $first : "$owner",
                },
            },
        },
        {
            $project : {
                name : 1,
                description : 1,
                owner : 1,
                videos : 1,
                thumbnail : 1,
                videosCount : 1,
                createdAt : 1,
                updatedAt : 1,
                thumbnail : {
                    $first : "$videos.thumbnail",
                },
                videosCount : {
                    $size : "$videos",
                },
                totalViews : {
                    $sum : "$videos.views",
                },
            },
        },
    ]);
    return res.status(200)
    .json(new ApiResponse(200 , playlists , "Playlist sent successfully"));
});

const addVideoToPlaylist = asyncHandler(async(req , res)=>{
    const {playlistId , videoId} = req.params;
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400 , "Not a valid object id");
    }
    
    const playlists = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet : {
                videos : videoId,
            },
        },
        {
            new : true,
        },
    );
    if(!playlists) throw new ApiError(500 , "Error while adding video to playlist");
    return res.status(200)
    .json(new ApiResponse(
        200,
        playlists,
        "Video added to playlist successfully"
    ));
});

const removeVideoFromPlaylist = asyncHandler(async(req , res)=>{
    const {playlistId , videoId} = req.params;
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400 , "Not a valid object id");
    }

    const playlists = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull : {
                videos : videoId,
            },
        },
        {
            new : true,
        },
    );
    if(!playlists) throw new ApiError(500 , "Error while removing video from playlist");
    return res.status(200).json(
        new ApiResponse(
            200,
            playlists,
            "Video removed from playlist successfully",
        ),
    );
});

const deletePlaylist = asyncHandler(async(req , res)=>{
    const {playlistId} = req.params;
    if(isValidObjectId(playlistId)) throw new ApiError(400 , "Error while deleting the playlist");

    const playlist = await Playlist.findByIdAndDelete(playlistId);
    if(!playlist) throw new ApiError(500 , "Error while deleting the playlist");
    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Playlist deleted successfully",
        )
    );
});

const updatePlaylist = asyncHandler(async(req , res)=>{
    const {playlistId} = req.params;
    const {name , description} = req.body;
    if(!isValidObjectId(playlistId) || (!name && !description)){
        throw new ApiError(400 , "Fields to be filled");
    }
    const playlist = await Playlist.findById(playlistId);
    if(name) playlist.name = name.trim();
    if(description) playlist.description = description.trim();
    const updatedPlaylist = await playlist.save();

    if(!updatedPlaylist) throw new ApiError(400 , "Error while updating playlist");
    return res.status(200)
    .json(
        200,
        updatedPlaylist,
        "Playlist updated successfully"
    );
});

const getVideoSavePlaylists = asyncHandler(async(req , res)=>{
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Not a valid object video id");
    let playlists;
    try{
    playlists = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $project : {
                name : 1,
                isVideoPresent : {
                    $cond : [
                        {$in : [new mongoose.Types.ObjectId(videoId) , "$videos"]},
                        true,
                        false
                    ],
                },
            },
        },
    ]);}
    catch(error){
        throw new ApiError(500 , "Error in aggregation:" , error.message);
    }
    if(!playlists) throw new ApiError(400 , "Error while fetching");
    return res.status(200).json(
        new ApiResponse(
            200,
            playlists,
            "Playlists sent successfully",
        )
    );
});

export {createPlaylist , getUserPlaylists , getPlaylistById , addVideoToPlaylist , removeVideoFromPlaylist
    ,deletePlaylist ,updatePlaylist ,getVideoSavePlaylists
};