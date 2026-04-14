import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// auto refresh logic
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await axios.post(
        "http://localhost:5000/api/auth/refresh",
        {},
        { withCredentials: true }
      );
      return API(error.config);
    }
    return Promise.reject(error);
  }
);

export default API;