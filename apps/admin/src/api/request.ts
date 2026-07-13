import axios from 'axios';
import { ElMessage } from 'element-plus';
import { ErrorCode } from '@baoming/shared';
import { useAuthStore } from '../stores/auth';
import router from '../router';

export const request = axios.create({
  baseURL: '/api/admin',
  timeout: 15000,
});

request.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === ErrorCode.OK) {
        return body.data;
      }
      ElMessage.error(body.msg || '请求失败');
      if (body.code === ErrorCode.UNAUTHORIZED) {
        const auth = useAuthStore();
        auth.clear();
        router.replace('/login');
      }
      return Promise.reject(new Error(body.msg || '请求失败'));
    }
    return body;
  },
  (error) => {
    const msg = error?.response?.data?.msg || error.message || '网络错误';
    ElMessage.error(msg);
    if (error?.response?.status === 401) {
      const auth = useAuthStore();
      auth.clear();
      router.replace('/login');
    }
    return Promise.reject(error);
  },
);
