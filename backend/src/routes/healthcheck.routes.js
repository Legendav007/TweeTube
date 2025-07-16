import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { healthCheck } from "../controllers/healthcheck.controller.js";

const router = Router();

// router.use(verifyJWT);

// http://localhost:3000/api/v1/healthcheck
router.route("/").get(healthCheck);

export default router;