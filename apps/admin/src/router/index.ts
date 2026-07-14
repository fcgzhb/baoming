import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import MainLayout from '../layouts/MainLayout.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/login.vue') },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'home', component: () => import('../views/home.vue') },
        { path: 'projects', name: 'projects', component: () => import('../views/projects.vue') },
        {
          path: 'projects/new',
          name: 'project-new',
          component: () => import('../views/project-edit.vue'),
        },
        {
          path: 'projects/:id',
          name: 'project-edit',
          component: () => import('../views/project-edit.vue'),
        },
        { path: 'orders', name: 'orders', component: () => import('../views/orders.vue') },
        {
          path: 'orders/:id',
          name: 'order-detail',
          component: () => import('../views/order-detail.vue'),
        },
        { path: 'users', name: 'users', component: () => import('../views/users.vue') },
        {
          path: 'users/:id',
          name: 'user-detail',
          component: () => import('../views/user-detail.vue'),
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  if (requiresAuth && !auth.token) {
    return { name: 'login' };
  }
  if (to.name === 'login' && auth.token) {
    return { name: 'home' };
  }
  return true;
});

export default router;
