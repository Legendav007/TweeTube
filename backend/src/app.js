import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import morgan from "morgan";

const app  = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN_DEV,
    credentials : true
}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended : true , limit : "16kb"}));
app.use(express.static("public"))
app.use(cookieParser());
app.use(morgan("dev"));

//routes
import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import videoRouter from "./routes/video.routes.js"
import healthCheckRouter from "./routes/healthcheck.routes.js"

app.use("/api/v1/users" , userRouter)
app.use("/api/v1/tweets" , tweetRouter)
app.use("/api/v1/videos" , videoRouter)
app.use("/api/v1/healthcheck" , healthCheckRouter)

export {app}