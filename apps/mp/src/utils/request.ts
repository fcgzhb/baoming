import { ErrorCode } from '@baoming/shared';

// Mini-programs cannot use relative '/api'; set the full backend origin.
// In production replace with your HTTPS domain (must be whitelisted in mp backend).
const BASE_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'baoming_token';

export const getToken = (): string => uni.getStorageSync(TOKEN_KEY) || '';
export const setToken = (t: string) => uni.setStorageSync(TOKEN_KEY, t);
export const clearToken = () => uni.removeStorageSync(TOKEN_KEY);

interface ApiEnvelope<T> {
  code: number;
  msg: string;
  data: T;
}

export function request<T = unknown>(options: {
  url: string;
  method?: UniApp.RequestOptions['method'];
  data?: unknown;
  auth?: boolean;
}): Promise<T> {
  const { url, method = 'GET', data, auth = true } = options;
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data: data as Record<string, unknown> | undefined,
      header: auth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      success: (res) => {
        const body = res.data as ApiEnvelope<T>;
        if (body && typeof body === 'object' && 'code' in body) {
          if (body.code === ErrorCode.OK) {
            resolve(body.data);
            return;
          }
          if (body.code === ErrorCode.UNAUTHORIZED) {
            clearToken();
            uni.reLaunch({ url: '/pages/login/login' });
          }
          uni.showToast({ title: body.msg || '请求失败', icon: 'none' });
          reject(new Error(body.msg));
          return;
        }
        resolve(body as unknown as T);
      },
      fail: (err) => {
        uni.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      },
    });
  });
}
