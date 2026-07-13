import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AdminInfo } from '../api/auth';

const TOKEN_KEY = 'baoming_admin_token';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) ?? '');
  const admin = ref<AdminInfo | null>(null);

  const setToken = (t: string, info?: AdminInfo) => {
    token.value = t;
    localStorage.setItem(TOKEN_KEY, t);
    if (info) admin.value = info;
  };

  const clear = () => {
    token.value = '';
    admin.value = null;
    localStorage.removeItem(TOKEN_KEY);
  };

  return { token, admin, setToken, clear };
});
