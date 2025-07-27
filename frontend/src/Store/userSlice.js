
import {createSlice} from "@reduxjs/toolkit"
import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../Helpers/axios.helper.js";
import { parseErrorMessage } from "../Helpers/parseErrMsg.helper.js";
import {toast} from "react-toastify"

const initialState = {
    loading : false,
    status : false,
    userData : {},
};

export const getCurrentUser = createAsyncThunk("auth/getCurrentUser", async () => {
    try {
      const response = await axiosInstance.get("/users/current-user");
      return response.data.data;
    } catch (error) {
      console.error("BACKEND_ERROR :: GET CURRENT USER");
      // toast.error("Not logged In...😕");
      throw error;
    }
});

export const changePassword = createAsyncThunk("auth/changePassword", async (data) => {
    try {
      const response = await axiosInstance.post("/users/change-password", data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      throw error;
    }
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (data) => {
    try {
      const response = await axiosInstance.patch("/users/update-account", data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      throw error;
    }
});

export const uploadAvatar = createAsyncThunk("user/avatar", async ({ data }) => {
    try {
      const response = await axiosInstance.patch(`/users/avatar`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
      throw error;
    }
});

export const uploadCoverImage = createAsyncThunk("user/coverImage", async ({ data }) => {
    try {
      const response = await axiosInstance.patch(`/users/cover-image`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
      throw error;
    }
});

export const watchHistory = createAsyncThunk("user/history", async () => {
    try {
      const response = await axiosInstance.get(`/users/history`);
      // toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
      throw error;
    }
});

export const clearWatchHistory = createAsyncThunk("user/clearWatchHistory", async () => {
    try {
      const response = await axiosInstance.delete(`/users/history`);
      toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
      throw error;
    }
});

export const userPlaylists = createAsyncThunk("user/userPlaylists", async (userId) => {
    try {
      const response = await axiosInstance.get(`/playlist/users/${userId}`);
      //toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
      throw error;
    }
});

export const addLink = createAsyncThunk("user/addLink", async ({ formData }) => {
    try {
      const response = await axiosInstance.post(`/about/user/link/add`, formData);
      toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
      throw error;
    }
});

export const updateLink = createAsyncThunk("user/updateLink", async ({ linkId, formData }) => {
    try {
      const response = await axiosInstance.patch(`/about/user/link/${linkId}`, formData);
      toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
      throw error;
    }
});

export const deleteLink = createAsyncThunk("user/deleteLink", async (linkId) => {
    try {
      const response = await axiosInstance.delete(`/about/user/link/${linkId}`);
      toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
      throw error;
    }
});

export const channelProfile = createAsyncThunk("user/channelprofile", async (username) => {
  // console.log("calling with : ", username);
    try {
      const response = await axiosInstance.get(`/users/c/${username}`);
      //toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
    }
});
  
export const getAboutChannel = createAsyncThunk("user/getAboutChannel", async (username) => {
    try {
      const response = await axiosInstance.get(`/about/user/${username}`);
      //toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
    }
});

const userSlice = createSlice({
    name : "user",
    initialState,
    extraReducers : (builder) => {
        //getCurrentUser
        builder.addCase(getCurrentUser.pending, (state) => {
            state.loading = true;
        });
          builder.addCase(getCurrentUser.fulfilled, (state, action) => {
            state.loading = false;
            state.userData = action.payload;
            state.status = true;
        });
          builder.addCase(getCurrentUser.rejected, (state) => {
            state.loading = false;
            state.userData = null;
            state.status = false;
        });
        //Change Password
        builder.addCase(changePassword.pending, (state) => {
            state.loading = true;
        });
          builder.addCase(changePassword.fulfilled, (state) => {
            state.loading = false;
        });
          builder.addCase(changePassword.rejected, (state) => {
            state.loading = false;
        });
        //Update Profile
        builder.addCase(updateProfile.pending, (state) => {
            state.loading = true;
        });
          builder.addCase(updateProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.userData = action.payload;
            // state.status = true;
        });
          builder.addCase(updateProfile.rejected, (state) => {
            state.loading = false;
        });
        //update avatar
        builder.addCase(uploadAvatar.pending, (state) => {
            state.loading = true;
        });
          builder.addCase(uploadAvatar.fulfilled, (state, action) => {
            state.loading = false;
            state.userData = action.payload;
        });
          builder.addCase(uploadAvatar.rejected, (state) => {
            state.loading = false;
        });
        //Update CoverImage
        builder.addCase(uploadCoverImage.pending, (state) => {
            state.loading = true;
        });
          builder.addCase(uploadCoverImage.fulfilled, (state, action) => {
            state.loading = false;
            state.userData = action.payload;
        });
          builder.addCase(uploadCoverImage.rejected, (state) => {
            state.loading = false;
        });
        // get watch history
        builder.addCase(watchHistory.pending, (state) => {
            state.loading = true;
        });
          builder.addCase(watchHistory.fulfilled, (state, action) => {
            state.loading = false;
            state.userData.watchHistory = action.payload;
        });
          builder.addCase(watchHistory.rejected, (state) => {
            state.loading = false;
        });
        //clear WatchHistory
        builder.addCase(clearWatchHistory.pending, (state) => {
            state.loading = true;
        });
          builder.addCase(clearWatchHistory.fulfilled, (state, action) => {
            state.loading = false;
            state.userData.watchHistory = [];
        });
          builder.addCase(clearWatchHistory.rejected, (state) => {
            state.loading = false;
        });
        //getPlaylist
        builder.addCase(userPlaylists.pending, (state) => {
            state.loading = true;
        });
          builder.addCase(userPlaylists.fulfilled, (state, action) => {
            state.loading = false;
            state.userData.userPlaylists = action.payload;
        });
          builder.addCase(userPlaylists.rejected, (state) => {
            state.loading = false;
        });
        //Add Link
        builder.addCase(addLink.pending, (state) => {});
        builder.addCase(addLink.fulfilled, (state, action) => {});
        builder.addCase(addLink.rejected, (state) => {});

        //Update Link
        builder.addCase(updateLink.pending, (state) => {});
        builder.addCase(updateLink.fulfilled, (state, action) => {});
        builder.addCase(updateLink.rejected, (state) => {});

        //Delete Link
        builder.addCase(deleteLink.pending, (state) => {});
        builder.addCase(deleteLink.fulfilled, (state, action) => {});
        builder.addCase(deleteLink.rejected, (state) => {});
            //get Channel Profile
        builder.addCase(channelProfile.pending, (state) => {
            state.loading = true;
            state.status = false;
            state.userData = null;
        });
        builder.addCase(channelProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.status = true;
            state.userData = action.payload;
        });
        builder.addCase(channelProfile.rejected, (state) => {
            state.loading = false;
            state.status = false;
        });
  
        //get Channel Profile
        builder.addCase(getAboutChannel.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getAboutChannel.fulfilled, (state, action) => {
            state.userData.about = action.payload;
        });
        builder.addCase(getAboutChannel.rejected, (state) => {});
    },
});

export default userSlice.reducer;