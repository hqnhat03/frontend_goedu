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
        
        // Call the refresh-token endpoint
        const response = await api.post('/auth/refresh-token');

        if (response.data.success) {
          const { access_token, user } = response.data.data;

          // Update Auth Store
          try {
            const { useAuthStore } = await import('@/store/auth-store');
            useAuthStore.getState().setAuth(user, access_token);
          } catch (storeError) {
            console.warn('Auth store not found or could not be updated.', storeError);
            // Fallback cookie update if store fails
            document.cookie = `access_token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
          }

          // 3. Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          processQueue(null, access_token);
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Refresh failed (likely refresh_ttl expired) -> Logout
        if (typeof window !== 'undefined') {
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

    // Handle 403 Forbidden: Permissions might have changed
    if (error.response?.status === 403) {
      console.warn('Handling 403: Permissions might have changed. Re-fetching profile...');

      if (typeof window !== 'undefined') {
        const { useAuthStore } = await import('@/store/auth-store');
        const token = useAuthStore.getState().token;

        if (token) {
          try {
            // Use axios directly to avoid interceptor loop if /auth/me itself is 403 (unlikely but safe)
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              }
            });

            if (res.data.success) {
              const newUser = res.data.data;
              useAuthStore.getState().setUser(newUser);
              console.log('Permissions updated successfully.');

              // Optional: notify user but don't block
              // if (window.confirm('Quyền hạn của bạn đã được cập nhật. Bạn có muốn tải lại trang?')) {
              //   window.location.reload();
              // }
            }
          } catch (meError) {
            console.error('Failed to sync permissions after 403', meError);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
