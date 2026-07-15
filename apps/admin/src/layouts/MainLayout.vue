<template>
  <el-container class="layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="aside">
      <div class="brand">
        <div class="brand-mark">游</div>
        <transition name="fade"><span v-show="!collapsed" class="brand-text">游学报名</span></transition>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        class="side-menu"
        background-color="transparent"
        text-color="#cbd5e1"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="/projects">
          <el-icon><Suitcase /></el-icon>
          <template #title>游学项目</template>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <el-button link class="collapse-btn" @click="collapsed = !collapsed">
          <el-icon :size="20"><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
        </el-button>
        <el-breadcrumb :separator-icon="ArrowRight" class="crumb">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item v-if="crumbLabel">{{ crumbLabel }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="spacer" />
        <el-dropdown @command="onCommand">
          <div class="user-chip">
            <el-avatar :size="32" class="avatar">{{ avatarLetter }}</el-avatar>
            <span class="user-name">{{ auth.admin?.displayName || auth.admin?.username || '管理员' }}</span>
            <el-icon><CaretBottom /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout"><el-icon><SwitchButton /></el-icon>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowRight, CaretBottom, Expand, Fold, HomeFilled, List, Suitcase, SwitchButton, User } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const collapsed = ref(false);

const activeMenu = computed(() => {
  if (route.path.startsWith('/projects')) return '/projects';
  if (route.path.startsWith('/orders')) return '/orders';
  if (route.path.startsWith('/users')) return '/users';
  return route.path;
});

const crumbLabel = computed(() => {
  if (route.path.startsWith('/projects')) return '游学项目';
  if (route.path.startsWith('/orders')) return '订单管理';
  if (route.path.startsWith('/users')) return '用户管理';
  return '';
});

const avatarLetter = computed(() => (auth.admin?.displayName || auth.admin?.username || 'A')[0]);

const onCommand = (cmd: string) => {
  if (cmd === 'logout') {
    ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
      .then(() => {
        auth.clear();
        router.replace('/login');
      })
      .catch(() => {});
  }
};
</script>

<style scoped>
.layout { height: 100%; }

.aside {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  transition: width 0.25s;
  overflow: hidden;
}
.brand {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  color: #fff;
  overflow: hidden;
}
.brand-mark {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f8bff, #2dd4bf);
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 18px;
  flex-shrink: 0;
}
.brand-text { font-weight: 700; font-size: 18px; white-space: nowrap; }

.side-menu { border-right: none !important; padding: 12px 12px; }
.side-menu :deep(.el-menu-item) {
  border-radius: 10px;
  margin-bottom: 4px;
  height: 46px;
  line-height: 46px;
}
.side-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #2563eb, #4f8bff) !important;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}
.side-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
}

.header {
  background: #fff;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  height: 64px;
}
.collapse-btn { padding: 4px; }
.crumb { font-size: 14px; }
.spacer { flex: 1; }

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  transition: background 0.2s;
}
.user-chip:hover { background: #f3f5f9; }
.avatar { background: linear-gradient(135deg, #4f8bff, #2dd4bf); color: #fff; font-weight: 700; }
.user-name { color: var(--text); font-size: 14px; font-weight: 500; }

.main { padding: 24px; background: var(--bg); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
