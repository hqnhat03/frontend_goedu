import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variables to handle token refresh logic
let isRefreshing = false;
interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
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

    // Handle 401 Unauthorized: Token might be expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Token expired. Attempting to refresh...');
        
        // SỬ DỤNG axios trực tiếp thay vì instance 'api' để tránh vòng lặp vô tận (interceptor loop)
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/api/auth/refresh-token`, {}, {
          headers: {
            'Authorization': `Bearer ${document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]}`,
            'Accept': 'application/json',
          },
          withCredentials: true // Đảm bảo gửi kèm cookie nếu backend yêu cầu
        });

        if (response.data.success) {
          const { access_token, user } = response.data.data;

          // Update Auth Store
          try {
            const { useAuthStore } = await import('@/store/auth-store');
            useAuthStore.getState().setAuth(user, access_token);
          } catch (storeError) {
            console.warn('Auth store not found or could not be updated.', storeError);
            document.cookie = `access_token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
          }

          // 3. Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          processQueue(null, access_token);
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Nếu refresh thất bại hoàn toàn -> Logout và về login
        if (typeof window !== 'undefined') {
          console.error('Refresh token failed:', refreshError);
          try {
            const { useAuthStore } = await import('@/store/auth-store');
            useAuthStore.getState().logout();
          } catch {
            document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          }
          window.location.href = '/login';
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
