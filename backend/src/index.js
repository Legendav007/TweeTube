import dotenv from "dotenv";
import connectDB from "./db/db_connect.js";
import {app} from "./app.js"

dotenv.config({
    path : "../.env"
})
// console.log("MongoDB url : ", process.env.MONGODB_URI);
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Serves is running on ${process.env.PORT}`);
        // console.log("here")
    })
})
.catch((err)=>{
    console.log("Database connection failed!!" , err);
})