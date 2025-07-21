import moongose , {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.models.js"
import {Like} from "../models/like.models.js"
import mongoose from "mongoose"

const getVideoComments = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
  
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Not a valid video id");
  
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");
  
    const aggregationPipeline = [
      { $match: { video: new mongoose.Types.ObjectId(videoId) } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "comment",
          as: "likes",
          pipeline: [
            { $match: { liked: true } },
            { $project: { likedby: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "comment",
          as: "dislikes",
          pipeline: [
            { $match: { liked: false } },
            { $project: { likedby: 1 } },
          ],
        },
      },
      {
        $addFields: {
          likes: { $map: { input: "$likes", as: "l", in: "$$l.likedby" } },
          dislikes: { $map: { input: "$dislikes", as: "d", in: "$$d.likedby" } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            { $project: { fullName: 1, username: 1, avatar: 1 } },
          ],
        },
      },
      { $unwind: "$owner" },
      {
        $project: {
          content: 1,
          owner: 1,
          createdAt: 1,
          updatedAt: 1,
          isOwner: {
            $eq: [new mongoose.Types.ObjectId(req.user?._id), "$owner._id"]
          },
          likesCount: { $size: "$likes" },
          dislikesCount: { $size: "$dislikes" },
          isLiked: {
            $in: [new mongoose.Types.ObjectId(req.user?._id), "$likes"]
          },
          isDisliked: {
            $in: [new mongoose.Types.ObjectId(req.user?._id), "$dislikes"]
          },
          isLikedByOwner: {
            $in: [video.owner, "$likes"]
          }
        }
      }
    ];
  
    const aggregate = Comment.aggregate(aggregationPipeline);
    const options = { page: Number(page), limit: Number(limit) };
  
    Comment.aggregatePaginate(aggregate, options, (err, results) => {
      if (err) throw new ApiError(500, err.message);
  
    const { docs, ...pagination } = results;
      return res.status(200).json(
        new ApiResponse(
          200,
          { Comments: docs, ...pagination },
          "Paginated comments fetched successfully"
        )
      );
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
    const {username , fullName , avatar , _id} = req.user;
    const commentData = {
        ...comment._doc,
        owner : {username , fullName , avatar , _id},
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
    if(!isValidObjectId(commentId)) throw new ApiError(400 , "Not a valid comment id");
    const comment = await Comment.findByIdAndDelete(commentId);
    if(!comment) throw new ApiError(500 , "Error while deleting comment");
    
    const deleteLikes = Like.deleteMany({
        comment : new mongoose.Types.ObjectId(commentId),
    });

    return res.status(200).json(
        new ApiResponse(
        200,
        {isDeleted : true},
        "Comment deleted Successfully",
    ));
});

export {getVideoComments , addComment , updateComment , deleteComment};

