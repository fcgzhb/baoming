import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/login.vue') },
    { path: '/', name: 'home', component: () => import('../views/home.vue'), meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.token) {
    return { name: 'login' };
  }
  if (to.name === 'login' && auth.token) {
    return { name: 'home' };
  }
  return true;
});

export default router;
