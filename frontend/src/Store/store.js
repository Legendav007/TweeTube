import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import userSlice from "./userSlice";
import healthSlice from "./healthcheck"
import darkModeSlice from "./darkModeSlice"
import paginationSlice from "./paginationSlice"
import likeSlice from "./likeSlice"
import commentSlice from "./commentSlice"
import dashboardSlice from "./dashboardSlice"
import tweetSlice from "./tweetSlice"
import subscriptionSlice from "./subscriptionSlice"
import playlistSlice from "./playlistSlice"
import videoSlice from "./videoSlice"

export const store = configureStore({
    reducer : {
        auth : authSlice,
        user : userSlice,
        health : healthSlice,
        darkMode : darkModeSlice,
        pagingVideos : paginationSlice,
        like : likeSlice,
        comment : commentSlice,
        dashboard : dashboardSlice,
        tweet : tweetSlice,
        subscription : subscriptionSlice,
        playlist : playlistSlice,
        video : videoSlice,
    },
});