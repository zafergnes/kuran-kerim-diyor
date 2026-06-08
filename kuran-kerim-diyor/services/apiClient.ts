import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import Constants from 'expo-constants';

const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3001/api`;
  }
  return 'https://api.kurannediyor.com.tr/api';
};

const API_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add the Authorization header
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from SecureStore', error);
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Intercept responses to handle 401 Unauthorized (Token expired)
apiClient.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried refreshing yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          // Try to get a new access token
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = res.data;

          // Store the new token
          await SecureStore.setItemAsync('userToken', accessToken);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError: any) {
        console.error('Refresh token failed', refreshError);
        // ONLY clear tokens if the error is 401 or 403 (Invalid token)
        // If it's 429 (Rate limit) or 500 (Server error), keep the tokens
        if (refreshError.response && (refreshError.response.status === 401 || refreshError.response.status === 403)) {
          await SecureStore.deleteItemAsync('userToken');
          await SecureStore.deleteItemAsync('refreshToken');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
