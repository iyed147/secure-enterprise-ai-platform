import axios from "axios";
import { getToken, clearToken } from "./auth";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const isAuthEndpoint =
      error?.config?.url?.includes("/auth/login") ||
      error?.config?.url?.includes("/auth/register") ||
      error?.config?.url?.includes("/auth/mock-login");

    // Auto-logout on 401 for protected endpoints only,
    // not for failed login/register attempts themselves.
    if (status === 401 && !isAuthEndpoint) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);