import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import userSlice from "./userSlice";
import healthSlice from "./healthcheck"
import darkModeSlice from "./darkModeSlice"
import paginationSlice from "./paginationSlice"
import tweetSlice from "./tweetSlice"
import likeSlice from "./likeSlice"
import commentSlice from "./commentSlice"
import dashboardSlice from "./dashboardSlice"

export const store = configureStore({
    reducer : {
        auth : authSlice,
        user : userSlice,
        health : healthSlice,
        darkMode : darkModeSlice,
        pagingVideos : paginationSlice,
        tweet : tweetSlice,
        like : likeSlice,
        comment : commentSlice,
        dashboard : dashboardSlice,
    },
});