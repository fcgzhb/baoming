<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <h2 style="text-align: center">游学报名 · 后台管理</h2>
      <el-form :model="form" label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="账号">
          <el-input v-model="form.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-button type="primary" :loading="loading" style="width: 100%" @click="onSubmit">登录</el-button>
      </el-form>
      <p v-if="hint" style="color: #909399; font-size: 12px; margin-top: 8px">{{ hint }}</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { login } from '../api/auth';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);
const hint = ref('需先在后端执行 pnpm seed:admin 注入管理员账号。');
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
  background: #f5f7fa;
}
.login-card {
  width: 360px;
}
</style>
