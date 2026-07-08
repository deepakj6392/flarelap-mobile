import axios from 'axios';
import { API_URL } from '../constants/config';

const API_BASE = API_URL || 'https://api.flarelap.com';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 600000, // 10 minutes timeout
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

// Optional: set auth token for future requests
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response ? error.response.status : null;

    // Avoid infinite loop if auth routes fail
    const isAuthRoute = originalRequest && (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/signup')
    );

    if ((status === 401 || status === 403) && originalRequest && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Dynamically require to avoid circular dependencies
        const { getTokens, saveTokens, clearTokens } = require('./token.service');
        const { refreshToken } = require('./auth.service');

        const tokens = await getTokens();
        const rToken = tokens.refreshToken;

        if (rToken && rToken !== 'null') {
          const res = await refreshToken({ refreshToken: rToken });
          
          if (res && (res.accessToken || res.token)) {
            const newAccessToken = res.accessToken || res.token;
            const newRefreshToken = res.refreshToken || res.refresh_token || rToken;

            // Save tokens to storage and update Axios defaults
            await saveTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });

            // Resolve all queued requests with the new token
            processQueue(null, newAccessToken);
            
            // Retry the original request
            originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
            return api(originalRequest);
          }
        }
        
        // If there's no refresh token or the refresh response is invalid, clear tokens and redirect to login
        await clearTokens();
        const { navigationRef } = require('../../App');
        if (navigationRef && navigationRef.isReady()) {
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
        processQueue(new Error('Refresh token invalid or missing'), null);
      } catch (refreshError) {
        processQueue(refreshError, null);
        try {
          const { clearTokens } = require('./token.service');
          await clearTokens();
          const { navigationRef } = require('../../App');
          if (navigationRef && navigationRef.isReady()) {
            navigationRef.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        } catch (e) {
          console.error('Failed to handle logout navigation:', e);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
