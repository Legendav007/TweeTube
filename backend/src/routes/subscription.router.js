import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkUser } from "../middlewares/openRouteAuth.middleware.js";

import {
  toggleSubscription,
  getUserSubscribers,
  UserSubscribedChannels,
} from "../controllers/subscription.controller.js";
const router = Router();

// http://localhost:3000/api/v1/subscription/...

router
  .route("/:channelId")
  .patch(verifyJWT, toggleSubscription)
  .get(checkUser, getUserSubscribers);

router.route("/users/:subscriberId").get(checkUser, UserSubscribedChannels);

export default router;