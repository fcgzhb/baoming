<template>
  <div class="login-wrap">
    <div class="bg-blob blob-1" />
    <div class="bg-blob blob-2" />
    <el-card class="login-card">
      <div class="brand">
        <div class="brand-mark">游</div>
        <div class="brand-text">
          <div class="title">游学报名</div>
          <div class="subtitle">后台管理系统</div>
        </div>
      </div>
      <el-form :model="form" label-position="top" @submit.prevent="onSubmit" size="large">
        <el-form-item label="账号">
          <el-input v-model="form.username" placeholder="请输入账号" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :prefix-icon="Lock"
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="submit" round @click="onSubmit">登录</el-button>
      </el-form>
    </el-card>
    <div class="hint">默认账号 admin / admin123（由 seed:admin 注入，请修改）</div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Lock, User } from '@element-plus/icons-vue';
import { login } from '../api/auth';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);
const form = reactive({ username: 'admin', password: '' });

const onSubmit = async () => {
  loading.value = true;
  try {
    const res = await login(form.username, form.password);
    auth.setToken(res.token, res.admin);
    router.replace('/');
  } catch {
    // toast handled in interceptor
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-wrap {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #2563eb 140%);
  position: relative;
  overflow: hidden;
}
.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
}
.blob-1 { width: 420px; height: 420px; background: #4f8bff; top: -120px; right: -80px; }
.blob-2 { width: 360px; height: 360px; background: #2dd4bf; bottom: -100px; left: -60px; }

.login-card {
  width: 400px;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
  z-index: 1;
}
:deep(.el-card__body) { padding: 36px 32px 28px; }

.brand { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
.brand-mark {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f8bff, #2dd4bf);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 800; font-size: 26px;
}
.title { font-size: 22px; font-weight: 700; color: #1f2937; }
.subtitle { font-size: 13px; color: #9ca3af; margin-top: 2px; }

.submit { width: 100%; margin-top: 8px; height: 44px; font-weight: 600; }

.hint { color: rgba(255,255,255,0.7); font-size: 12px; margin-top: 24px; z-index: 1; }
</style>
