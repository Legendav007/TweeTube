import axios from "axios";

const baseURL = "https://tweetube-backend.onrender.com/api/v1";

export const axiosInstance = axios.create({
    baseURL,
    withCredentials : true,
});