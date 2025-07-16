import mongoose , {isValidObjectId} from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.models.js"

const getAboutChannel = asyncHandler(async (req , res)=>{
    const {userId} = req.params
    if(!isValidObjectId(userId)) throw new ApiError(400 , "Invalid User")
    
    const val = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(userId),
            },
        },
        //Fetching total views and videos
        {
            $lookup : {
                from : "videos",
                localField : "_id",
                foreignField : "owner",
                as : "videos",
                pipeline : [
                    {
                        $match : {
                            isPublished : true,
                        } ,
                    },
                    {
                        $group : {
                            _id : "owner",
                            totalVideos : {$count : {}},
                            totalViews : {$sum : "$views"},
                        },
                    },
                ],
            },
        },
        {
            $lookup : {
                from : "tweets",
                localField : "_id",
                foreignField : "owner",
                as : "tweets",
                pipeline : [
                    {
                        $group : {
                            _id : "owner",
                            totalTweets : {$count : {}},
                        },
                    },
                ],
            },
        },
        {
            $project : {
                username : 1,
                fullName : 1,
                email : 1,
                totalVideos : {
                    $cond : {
                        if : {$gt : [{$size : "$videos"} , 0]},
                        then : {$first : "$videos.totalVideos"},
                        else : 0,
                    },
                },
                totalViews: {
                    $cond: {
                      if: { $gt: [{ $size: "$videos" }, 0] },
                      then: { $first: "$videos.totalViews" },
                      else: 0,
                    },
                  },
                totalTweets: {
                    $cond: {
                      if: { $gt: [{ $size: "$tweets" }, 0] },
                      then: { $first: "$tweets.totalTweets" },
                      else: 0,
                    },
                },
                links : 1,
                createdAt : 1,
                description : 1,
            },
        },
    ]);
    return res.status(200)
    .json(new ApiResponse(200 , val[0] , "Channel detail sent successfully"))
});

const updateChannelDescription = asyncHandler(async(req , res)=>{
    const {content} = req.body;
    const description = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                description : content || "",
            },
        },
        {new : true},
    );
    return res.status(200).json(
        new ApiResponse(
            200,
            description,
            "Description added successfully",
        )
    );
});

const addLink = asyncHandler(async(req , res)=>{
    const {name , url} = req.body;
    if(!name || !url) throw new ApiError(400 , "All fields are required");

    const links = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $push : {
                links : {
                    name,
                    url,
                },
            },
        },
        {new : true},
    );
    if(!links) throw new ApiError(500 , "Not able to add links");
    return res.status(200).json(
        new ApiResponse(
            200,
            links,
            "Links addedd successfully"
        )
    );
});

const removeLink = asyncHandler(async(req , res)=>{
    const {linkId} = req.params;
    if(!isValidObjectId(linkId)) throw new ApiError(400 , "Not a valid link id");

    const link = await User.findByIdAndUpdate(
        {id : req.user?._id},
        {$pull : {links : {_id : linkId}}},
    );
    if(!link.links.length > 0) throw new ApiError(400 , "Link not found");
    return res.status(200),json(
        new ApiResponse(
            200,
            [],
            "Link removed successfully",
        )
    );
});

const updateLink = asyncHandler(async(req , res)=>{
    const {name , url} = req.body;
    const {linkId} = req.params;
    if(!name || !url) throw new ApiError(400 , "All fields required");
    const link = User.findByIdAndUpdate(
        {_id : req.user?._id},
        {$set : {"links.$[elem].name" : name , "links.$[elem].url" : url}},
        {arrayFilters : [{"elem._id" : linkId}]},
    );
    if(!link.modifiedCount > 0) throw new ApiError(400 , "Link not found");
    return res.status(200).json(
        new ApiResponse(
            200,
            link,
            "Link update successfully",
        )
    );
});

export {getAboutChannel , updateChannelDescription , addLink , removeLink , updateLink}



