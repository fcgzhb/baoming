<template>
  <view class="page">
    <view class="logo">游学报名</view>
    <view class="subtitle">微信授权登录后即可报名项目</view>

    <button class="btn primary" :disabled="loading" @click="onLogin">
      {{ loading ? '登录中…' : '微信授权登录' }}
    </button>

    <template v-if="token">
      <button
        v-if="!phone"
        class="btn ghost"
        open-type="getPhoneNumber"
        @getphonenumber="onPhone"
      >
        授权手机号（用于联系）
      </button>
      <view v-else class="muted">已绑定手机号 {{ phone }}</view>
      <button class="btn ghost" @click="goHome">进入首页</button>
    </template>
    <view class="muted tip">登录即代表你同意我们的服务与隐私政策</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { request, getToken, setToken } from '../../utils/request';

const loading = ref(false);
const token = ref(getToken());
const phone = ref('');

const onLogin = () => {
  loading.value = true;
  uni.login({
    provider: 'weixin',
    success: async (res) => {
      try {
        const data = await request<{ token: string; user: { phone?: string | null } }>({
          url: '/mp/auth/login',
          method: 'POST',
          data: { code: res.code },
          auth: false,
        });
        setToken(data.token);
        token.value = data.token;
        phone.value = data.user?.phone ?? '';
        uni.showToast({ title: '登录成功', icon: 'success' });
        // If redirected from another page (e.g. enroll), go back; else stay for phone.
        setTimeout(() => {
          uni.navigateBack({
            delta: 1,
            fail: () => uni.switchTab({ url: '/pages/index/index' }),
          });
        }, 600);
      } catch {
        // toast handled in request util (e.g. 微信登录失败 if creds missing)
      } finally {
        loading.value = false;
      }
    },
    fail: () => {
      loading.value = false;
      uni.showToast({ title: '登录已取消', icon: 'none' });
    },
  });
};

const onPhone = async (e: { detail: { errMsg: string; code?: string } }) => {
  if (e.detail.errMsg !== 'getPhoneNumber:ok' || !e.detail.code) return;
  try {
    const data = await request<{ phone: string }>({
      url: '/mp/auth/phone',
      method: 'POST',
      data: { code: e.detail.code },
    });
    phone.value = data.phone;
    uni.showToast({ title: '手机号已授权', icon: 'success' });
  } catch {
    // toast handled
  }
};

const goHome = () => uni.switchTab({ url: '/pages/index/index' });
</script>

<style>
.page { padding: 120rpx 48rpx; min-height: 100vh; background: #f7f8fa; }
.logo { font-size: 52rpx; font-weight: 700; text-align: center; margin-top: 80rpx; }
.subtitle { color: #909399; font-size: 26rpx; text-align: center; margin: 16rpx 0 80rpx; }
.btn { margin-top: 24rpx; border-radius: 999rpx; font-size: 30rpx; }
.btn.primary { background: #07c160; color: #fff; }
.btn.ghost { background: #fff; color: #606266; border: 1rpx solid #dcdfe6; }
.muted { color: #909399; font-size: 26rpx; text-align: center; margin-top: 24rpx; }
.tip { font-size: 22rpx; margin-top: 48rpx; }
</style>
