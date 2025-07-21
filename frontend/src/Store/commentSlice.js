import { createAsyncThunk } from "@reduxjs/toolkit";
import { parseErrorMessage } from "../Helpers/parseErrMsg.helper.js";
import { axiosInstance } from "../Helpers/axios.helper.js";
import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const initialState = {
  loading: false,
  status: false,
  data: null,
};

export const getVideoComments = createAsyncThunk("comment/getVideoComments", async ({videoId , page = 1} , thunkAPI) => {
  try {
    const response = await axiosInstance.get(`/comment/get/${videoId}?page=${page}`);
    // toast.success(response.data.message);
    return response.data.data;
  } catch (error) {
    toast.error(parseErrorMessage(error.response.data));
    console.log(error);
    throw error;
  }
});

export const addComment = createAsyncThunk("comment/addComment", async ({ videoId, content }) => {
  try {
    const response = await axiosInstance.post(`/comment/add/${videoId}`, { content });
    // toast.success(response.data.message);
    // console.log(response.data.data);
    return response.data.data;
  } catch (error) {
    toast.error(parseErrorMessage(error.response.data));
    console.log(error);
    throw error;
  }
});

export const updateComment = createAsyncThunk(
  "comment/updateComment",
  async ({ commentId, data }) => {
    try {
      const response = await axiosInstance.patch(`/comment/${commentId}`, data);
      toast.success(response.data.message);
      return response.data.data;
    } catch (error) {
      toast.error(parseErrorMessage(error.response.data));
      console.log(error);
      throw error;
    }
  }
);

export const deleteComment = createAsyncThunk("comment/deleteComment", async ({ commentId }) => {
  try {
    const response = await axiosInstance.delete(`/comment/${commentId}`);
    toast.success(response.data.message);
    return response.data.data;
  } catch (error) {
    toast.error(parseErrorMessage(error.response.data));
    console.log(error);
    throw error;
  }
});

const commentSlice = createSlice({
  name: "comment",
  initialState,
  extraReducers: (builder) => {
    // get Video Comments
    builder.addCase(getVideoComments.pending, (state) => {
      state.loading = true;
      state.data = [];
    });
    builder.addCase(getVideoComments.fulfilled, (state, action) => {
      state.loading = false;
      // console.log("comment data" , action.payload)
      state.data = action.payload;
      state.status = true;
    });
    builder.addCase(getVideoComments.rejected, (state) => {
      state.loading = false;
      state.status = false;
    });
    // console.log(state.data)
    // add Comment
    builder.addCase(addComment.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(addComment.fulfilled, (state, action) => {
      state.loading = false;
      if(!state.data){
        state.data = {Comments : []}
      }
      // console.log("the data is" , state.data)
      if(!Array.isArray(state.data.Comments)) state.data.Comments = [];
      state.data.Comments.unshift(action.payload);
      state.status = true;
    });
    builder.addCase(addComment.rejected, (state) => {
      state.loading = false;
      state.status = false;
    });

    // update Comment
    builder.addCase(updateComment.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateComment.fulfilled, (state, action) => {
      state.loading = false;
      // state.data = action.payload;
      state.status = true;
    });
    builder.addCase(updateComment.rejected, (state) => {
      state.loading = false;
      state.status = false;
    });

    // delete Comment
    builder.addCase(deleteComment.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(deleteComment.fulfilled, (state, action) => {
      state.loading = false;
      // state.data = action.payload;
      state.status = true;
    });
    builder.addCase(deleteComment.rejected, (state) => {
      state.loading = false;
      state.status = false;
    });
  },
});

export default commentSlice.reducer;