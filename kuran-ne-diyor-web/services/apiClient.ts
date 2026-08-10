import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = window.localStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (typeof window !== "undefined" && error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const refreshToken = window.localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const response = await axios.post<{ accessToken: string; refreshToken: string }>(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          window.localStorage.setItem("userToken", response.data.accessToken);
          window.localStorage.setItem("refreshToken", response.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError: unknown) {
          if (axios.isAxiosError(refreshError) && (refreshError.response?.status === 401 || refreshError.response?.status === 403)) {
            window.localStorage.removeItem("userToken");
            window.localStorage.removeItem("refreshToken");
            window.localStorage.removeItem("@user_profile");
          }
        }
      } else {
        window.localStorage.removeItem("userToken");
        window.localStorage.removeItem("refreshToken");
        window.localStorage.removeItem("@user_profile");
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
