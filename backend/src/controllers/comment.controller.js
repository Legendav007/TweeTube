import moongose , {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler"
import {Video} from "../models/video.models.js"
import {Like} from "../models/like.models.js"
import mongoose from "mongoose"

const getVideoComments = asyncHandler(async(req , res)=>{
    const {videoId} = req.params;
    const {page = 1 , limit = 10} = req.query;
    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Not a valid video id");
    const video = await Video.findById(videoId);

    const comments = await Comment.aggregate([
        {
            $match : {
                video : new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $sort : {createdAt : -1},
        },
        //likes and dislikes of comment
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "comment",
                as : "likes",
                pipeline : [
                    {
                        $match : {liked : true},
                    },
                    {
                        $group : {
                            _id : "liked",
                            owners : {$push : "$likedby"},
                        },
                    },
                ],
            },
        },
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "comment",
                as : "dislikes",
                pipeline : [
                    {
                        $match : {liked : false},
                    },
                    {
                        $group : {
                            _id : "liked",
                            owner : {$push : "$likedby"},
                        },
                    },
                ],
            },
        },
        //Reshaping array
        {
            $addFields : {
                likes : {
                    $cond : {
                        if : {
                            $gt : [{$size : "$likes"} , 0],
                        },
                        then : {$first : "$likes.owners"},
                        else : [],
                    },
                },
                dislikes : {
                    $cond : {
                        if : {
                            $gt : [{$size : "$dislikes"} , 0],
                        },
                        then : {$first : "$dislikes.owners"},
                        else : [],
                    },
                },
            },
        },
        //owner details
        {
            $lookup : {
                from : "users",
                localField : "onwer",
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
        {$unwind : "$owner"},
        {
            $project : {
                content : 1,
                owner : 1,
                createdAt : 1,
                updatedAt : 1,
                isOwner : {
                    $cond : {
                        if : {$eq : [req.user?._id , "$owner.id"]},
                        then  : true,
                        else : false,
                    },
                },
                likesCount : {
                    $size : "$likes",
                },
                dislikesCount : {
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
                isDisliked : {
                    $cond : {
                        if : {
                            $in : [req.user?._id , "$dislikes"],
                        },
                        then : true,
                        else : false,
                    },
                },
                isLikedByOwner : {
                    $cond : {
                        if : {
                            $in : [video.owner , "$likes"],
                        },
                        then : true,
                        else : false,
                    },
                }
            },
        },
    ]);
    // return res.status(200).json(
    //     new ApiResponse(
    //         200,
    //         comments,
    //         "Comments fetched successfully"
    //     )
    // );
    //Paginated Comments
    const options = {page , limit};
    Comment.aggregatePaginate(comments , options , function(err , results){
        if(!err){
            const {
                docs,
                totalDocs,
                limit,
                page,
                totalPages,
                pagingCounter,
                hasPrevPage,
                hasNextPage,
                prevPage,
                nextPage,
            } = results;
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        Comments: docs,
                        totalDocs,
                        limit,
                        page,
                        totalPages,
                        pagingCounter,
                        hasPrevPage,
                        hasNextPage,
                        prevPage,
                        nextPage,
                    }, 
                    "PaginatedComment fetched successfully"                   
                )
            )
        }
        else throw new ApiError(500 , err.message);
    });
});

const addComment = asyncHandler(async(req ,res)=>{
    const {videoId} = req.params;
    const {content} = req.body;
    if(!isValidObjectId(videoId) || !content){
        throw new ApiError(400 , "Not valid videoId or content required");
    }
    const comment = await Comment.create({
        content,
        video : videoId,
        owner : req.user?._id,
    });
    if(!comment) throw new ApiError(500 , "Error while commenting");
    const {username , fullName , avatar , __id} = req.user?._id;
    const commentData = {
        ...comment._doc,
        owner : {username , fullName , avatar , __id},
        likesCount : 0,
        isOnwer : true,
    };
    return res.status(200)
    .json(
        new ApiResponse(
            200,
            commentData,
            "Comment added successfully",
        )
    );
});

const updateComment = asyncHandler(async(req , res)=>{
    const {commentId} = req.params;
    const {content} = req.body;
    if(!isValidObjectId(commentId)) throw new ApiError(400 , "Not a valid comment id");
    if(!content) throw new ApiError(400 , "Content is required");
    
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set : {
                content,
            },
        },
        {new : true},
    );
    if(!updatedComment) throw new ApiError(500 , "Error while updating the comment");
    return res.status(200).json(
        new ApiResponse(
            200,
            updatedComment,
            "Comment updated successfully"
        )
    );
});

const deleteComment = asyncHandler(async(req ,res)=>{
    const {commentId} = req.params;
    if(isValidObjectId(commentId)) throw new ApiError(400 , "Not a valid comment id");
    const comment = await Comment.findByIdAndDelete(commentId);
    if(!comment) throw new ApiError(500 , "Error while deleting comment");
    
    const deleteLikes = Like.deleteMany({
        comment : new mongoose.Types.ObjectId(commentId),
    });

    return res.statsu(200).json(
        new ApiResponse(
        200,
        {isDeleted : true},
        "Comment deleted Successfully",
    ));
});

export {getVideoComments , addComment , updateComment , deleteComment};

