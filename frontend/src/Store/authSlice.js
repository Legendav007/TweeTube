import {createSlice} from "@reduxjs/toolkit"
import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../Helpers/axiox.helper.js";
import { parseErrorMessage } from "../Helpers/parseErrMsg.helper.js";
import {toast} from "react-toastify"

const initialState = {
    loading : false,
    status : false,
    userData : {},
};

export const login = createAsyncThunk("auth/login" , async(data)=>{
    try {
        const response = await axiosInstance.post("/users/login" , data);
        toast.success(response.data.message + "🤩");
        return response.data.data.user;
    } catch (error) {
        toast.error(error.response.data.message || parseErrorMessage(error.response.data));
        console.log(error);
        throw error;
    }
});


export const register = createAsyncThunk("user/register", async (data) => {
    try {
      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }
      formData.append("avatar", data.avatar[0]);
      if (data.coverImage) {
        formData.append("coverImage", data.coverImage[0]);
      }
      const response = await axiosInstance.post("/users/register", formData);
      toast.success("Account Created successfully 🥳");
      return response.data.data;
    } catch (error) {
      toast.error(error.response.data.message || parseErrorMessage(error.response.data));
      console.log(error);
    }
});

export const logout = createAsyncThunk("auth/logout", async () => {
    try {
      await axiosInstance.post("/users/logout");
      toast.success("Logged out successfully...");
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
      throw error;
    }
});


const authSlice = createSlice({
    name : "auth",
    initialState,
    extraReducers : (builder) => {
        //login
        builder.addCase(login.pending , (state)=>{
            state.loading = true;
        });
        builder.addCase(login.fulfilled , (state , action)=>{
            state.loading = false,
            state.status = false,
            state.userData = action.payload;
        });
        builder.addCase(login.rejected , (state , action)=>{
            state.loading = false,
            state.status = false,
            state.userData = null;
        });
        //logout
        builder.addCase(logout.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(logout.fulfilled, (state) => {
            state.loading = false;
            state.status = false;
            state.userData = null;
        });
        builder.addCase(logout.rejected, (state) => {
            state.loading = false;
            state.status = false;
        });
        //register
        builder.addCase(register.pending, (state) => {
            state.loading = true;
            state.status = false;
            state.userData = null;
        });
        builder.addCase(register.fulfilled, (state, action) => {
            state.loading = false;
            state.status = true;
            state.userData = action.payload;
        });
        builder.addCase(register.rejected, (state) => {
            state.loading = false;
            state.status = false;
        });
    },
});

export default authSlice.reducer;