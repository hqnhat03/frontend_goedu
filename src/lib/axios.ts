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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.warn('Handling 401: Token might be expired.');
        if (typeof window !== 'undefined') {
          document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
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
