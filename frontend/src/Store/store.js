import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import userSlice from "./userSlice";
import healthSlice from "./healthcheck"
import darkModeSlice from "./darkModeSlice"
import paginationSlice from "./paginationSlice"

export const store = configureStore({
    reducer : {
        auth : authSlice,
        user : userSlice,
        health : healthSlice,
        darkMode : darkModeSlice,
        pagingVideos : paginationSlice,
    },
});