<template>
  <el-container class="layout">
    <el-header class="header">
      <div class="brand">游学报名 · 后台</div>
      <el-menu mode="horizontal" :default-active="activeMenu" router class="nav" :ellipsis="false">
        <el-menu-item index="/projects">游学项目</el-menu-item>
        <el-menu-item index="/">首页</el-menu-item>
      </el-menu>
      <div class="right">
        <span class="user">{{ auth.admin?.displayName || auth.admin?.username || '管理员' }}</span>
        <el-button link @click="onLogout">退出</el-button>
      </div>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const activeMenu = computed(() => (route.path.startsWith('/projects') ? '/projects' : route.path));

const onLogout = () => {
  auth.clear();
  router.replace('/login');
};
</script>

<style scoped>
.layout { height: 100%; }
.header { display: flex; align-items: center; gap: 24px; border-bottom: 1px solid #e4e7ed; background: #fff; }
.brand { font-weight: 700; font-size: 18px; white-space: nowrap; }
.nav { border-bottom: none !important; flex: 1; }
.right { display: flex; align-items: center; gap: 12px; }
.user { color: #606266; font-size: 14px; }
</style>
