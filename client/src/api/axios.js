import axios from "axios";

const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return `${apiUrl}/api`;
  }
  // For local dev or when served from same origin
  return "/api";
};

const api = axios.create({
  baseURL: getApiUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tf_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("tf_token");
      localStorage.removeItem("tf_user");
      if (!location.pathname.startsWith("/login")) {
        location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
