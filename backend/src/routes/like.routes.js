import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  toggleLike,
  getLikedVideos,
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

// http://localhost:3000/api/v1/like/...

router.route("/").patch(toggleLike);
router.route("/comment/:commentId").patch(toggleLike);
router.route("/tweet/:tweetId").patch(toggleLike);
router.route("/video/:videoId").patch(toggleLike);
router.route("/videos").get(getLikedVideos);

export default router;