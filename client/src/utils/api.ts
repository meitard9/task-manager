// // /utils/api.ts
//TODO: can be DELETE - unused - using localStorage instead of context
// import axios from 'axios';
// import { redirect } from 'next/navigation'; // Use next/navigation for server-side redirects

// const api = axios.create({
//   baseURL: 'http://localhost:4000',
//   withCredentials: true,
// });

// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach(prom => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });
//   failedQueue = [];
// };

// api.interceptors.request.use(
//   config => {
//     // Note: In a real app, store this in a state management library, not localStorage,
//     // to prevent XSS. For this example, localStorage is used for clarity.
//     const accessToken = localStorage.getItem('accessToken');
//     if (accessToken) {
//       config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
//   },
//   error => {
//     return Promise.reject(error);
//   }
// );

// api.interceptors.response.use(
//   response => response,
//   async error => {
//     const originalRequest = error.config;
//     if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
//       originalRequest._retry = true;

//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//         .then(token => {
//           originalRequest.headers.Authorization = `Bearer ${token}`;
//           return api(originalRequest);
//         })
//         .catch(err => {
//           return Promise.reject(err);
//         });
//       }

//       isRefreshing = true;

//       try {
//         const response = await api.post('/auth/refresh');
//         const { accessToken } = response.data;
//         localStorage.setItem('accessToken', accessToken);
//         api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
//         processQueue(null, accessToken);
//         return api(originalRequest);
//       } catch (refreshError) {
//         processQueue(refreshError, null);
//         localStorage.removeItem('accessToken');
//         redirect('/login'); // Redirect to login on refresh failure
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;
