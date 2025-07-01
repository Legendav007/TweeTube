import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet , getAllTweets , getAllUserFeedTweets , getUserTweets,
    deleteTweet , updateTweet} from "../controllers/tweet.controller.js";
import {checkUser} from "../middlewares/openRouteAuth.middleware.js"

const router = Router();

router.route("/feed").get(checkUser , getAllUserFeedTweets);
router.route("/").get(checkUser , getAllTweets).post(verifyJWT , createTweet);
router.route("/users/:userId").get(checkUser , getUserTweets);
router.route("/:tweetId")
.patch(verifyJWT , updateTweet)
.delete(verifyJWT , deleteTweet);

export default router;