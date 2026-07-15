<template>
  <view class="page">
    <view class="hero">
      <view class="logo-circle"><text class="logo-text">游</text></view>
      <text class="app-name">游学报名</text>
      <text class="subtitle">微信授权登录后即可报名项目</text>
    </view>

    <view class="actions">
      <button class="btn btn-primary btn-block" :disabled="loading" @click="onLogin">
        {{ loading ? '登录中…' : '微信授权登录' }}
      </button>

      <template v-if="token">
        <button v-if="!phone" class="btn btn-ghost btn-block phone-btn" open-type="getPhoneNumber" @getphonenumber="onPhone">
          授权手机号（用于联系）
        </button>
        <view v-else class="phone-bound">已绑定 {{ phone }}</view>
        <button class="btn btn-ghost btn-block" @click="goHome">进入首页</button>
      </template>

      <text class="tip">登录即代表你同意我们的服务与隐私政策</text>
    </view>
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
        setTimeout(() => {
          uni.navigateBack({ delta: 1, fail: () => uni.switchTab({ url: '/pages/index/index' }) });
        }, 600);
      } catch {
        // toast handled
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
    const data = await request<{ phone: string }>({ url: '/mp/auth/phone', method: 'POST', data: { code: e.detail.code } });
    phone.value = data.phone;
    uni.showToast({ title: '手机号已授权', icon: 'success' });
  } catch {}
};

const goHome = () => uni.switchTab({ url: '/pages/index/index' });
</script>

<style>
.page { min-height: 100vh; background: var(--bg); }

.hero {
  background: var(--primary-grad);
  padding: 140rpx 40rpx 120rpx;
  border-bottom-left-radius: 48rpx;
  border-bottom-right-radius: 48rpx;
  display: flex; flex-direction: column; align-items: center;
}
.logo-circle {
  width: 140rpx; height: 140rpx; border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.25);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(10rpx);
}
.logo-text { color: #fff; font-size: 64rpx; font-weight: 800; }
.app-name { color: #fff; font-size: 48rpx; font-weight: 800; margin-top: 32rpx; }
.subtitle { color: rgba(255, 255, 255, 0.9); font-size: 26rpx; margin-top: 12rpx; }

.actions { padding: 56rpx 48rpx; display: flex; flex-direction: column; gap: 24rpx; }
.phone-btn { color: var(--success) !important; border-color: rgba(16,185,129,0.3) !important; }
.phone-bound { text-align: center; color: var(--success); font-size: 26rpx; padding: 8rpx 0; }
.tip { text-align: center; color: var(--muted); font-size: 22rpx; margin-top: 24rpx; }
</style>
