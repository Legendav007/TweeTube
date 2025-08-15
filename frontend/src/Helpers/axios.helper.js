import axios from "axios";

const baseURL = "https://3.108.100.156/api/v1";

export const axiosInstance = axios.create({
    baseURL,
    withCredentials : true,
});