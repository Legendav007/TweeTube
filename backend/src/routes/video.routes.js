import { Router } from "express"
import {getAllVideosByOption , getAllVideos , publishVideo , getVideoById
    ,updateVideo , deleteVideo , togglePublishStatus , updateView,
} from "../controllers/videos.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js" 
import {checkAborted} from "../middlewares/abortedRequest.middleware.js"
import {checkUser} from "../middlewares/openRouteAuth.middleware.js"

const router = Router();

router.route("/all/option").get(getAllVideosByOption);

router
  .route("/")
  .get(getAllVideos)
  .post(
    verifyJWT,
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    checkAborted,
    publishVideo
);

router
  .route("/:videoId")
  .get(checkUser, getVideoById)
  .delete(verifyJWT, deleteVideo)
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);
router.route("/view/:videoId").patch(checkUser, updateView);

export default router;