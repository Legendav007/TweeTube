import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./Slices/authSlice";
import userSlice from "./userSlice";

export const store = configureStore({
    reducer : {
        auth : authSlice,
        user : userSlice,
    },
});