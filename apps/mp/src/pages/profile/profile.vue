<template>
  <view class="page">
    <view class="profile-head" :class="{ 'logged': !!token }">
      <view v-if="token" class="profile-row">
        <image v-if="user?.avatarUrl" class="avatar" :src="user.avatarUrl" />
        <view v-else class="avatar avatar-fallback"><text>{{ (user?.nickname || '游')[0] }}</text></view>
        <view class="profile-info">
          <text class="name">{{ user?.nickname || '游学用户' }}</text>
          <text class="phone">{{ user?.phone || '未绑定手机号' }}</text>
        </view>
      </view>
      <view v-else class="profile-row">
        <view class="avatar avatar-fallback"><text>游</text></view>
        <view class="profile-info">
          <text class="name">未登录</text>
          <text class="phone">登录后查看订单与个人信息</text>
        </view>
      </view>
    </view>

    <view class="menu">
      <view class="menu-item" @click="goOrders">
        <text class="menu-emoji">📋</text>
        <text class="menu-label">我的订单</text>
        <text class="menu-arrow">›</text>
      </view>
      <view v-if="token && user && !user.phone" class="menu-item menu-action" open-type="getPhoneNumber" @getphonenumber="onPhone">
        <text class="menu-emoji">📱</text>
        <text class="menu-label">绑定手机号</text>
        <text class="menu-arrow">›</text>
      </view>
      <view v-if="!token" class="menu-item" @click="goLogin">
        <text class="menu-emoji">🔐</text>
        <text class="menu-label">去登录</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view v-if="token" class="logout-wrap">
      <button class="btn btn-ghost btn-block" @click="onLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request, getToken, clearToken } from '../../utils/request';

interface Profile {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  phone: string | null;
  hasConsent: boolean;
}

const token = ref(getToken());
const user = ref<Profile | null>(null);

const load = async () => {
  token.value = getToken();
  if (!token.value) {
    user.value = null;
    return;
  }
  try {
    user.value = await request<Profile>({ url: '/mp/user/profile' });
  } catch {}
};

const onPhone = async (e: { detail: { errMsg: string; code?: string } }) => {
  if (e.detail.errMsg !== 'getPhoneNumber:ok' || !e.detail.code) return;
  try {
    const data = await request<{ phone: string }>({ url: '/mp/auth/phone', method: 'POST', data: { code: e.detail.code } });
    if (user.value) user.value.phone = data.phone;
    uni.showToast({ title: '已绑定', icon: 'success' });
  } catch {}
};

const onLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确认退出当前账号？',
    success: (r) => {
      if (!r.confirm) return;
      clearToken();
      token.value = '';
      user.value = null;
      uni.showToast({ title: '已退出', icon: 'none' });
    },
  });
};

const goOrders = () => uni.switchTab({ url: '/pages/orders/orders' });
const goLogin = () => uni.navigateTo({ url: '/pages/login/login' });

onShow(() => load());
</script>

<style>
.page { min-height: 100vh; padding-bottom: 60rpx; }

.profile-head {
  background: var(--primary-grad);
  padding: 60rpx 40rpx 80rpx;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
}
.profile-row { display: flex; align-items: center; }
.avatar { width: 120rpx; height: 120rpx; border-radius: 50%; border: 4rpx solid rgba(255,255,255,0.6); }
.avatar-fallback {
  background: rgba(255, 255, 255, 0.3);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 48rpx; font-weight: 700;
}
.profile-info { margin-left: 28rpx; display: flex; flex-direction: column; gap: 8rpx; }
.name { color: #fff; font-size: 36rpx; font-weight: 700; }
.phone { color: rgba(255, 255, 255, 0.9); font-size: 26rpx; }

.menu {
  margin: -48rpx 28rpx 0;
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.menu-item {
  display: flex; align-items: center;
  padding: 32rpx 28rpx;
  border-bottom: 1rpx solid var(--line);
}
.menu-item:last-child { border-bottom: none; }
.menu-action { position: relative; }
.menu-emoji { font-size: 36rpx; margin-right: 20rpx; }
.menu-label { flex: 1; font-size: 29rpx; color: var(--text); }
.menu-arrow { color: var(--muted); font-size: 36rpx; }

.logout-wrap { margin: 40rpx 28rpx 0; }
</style>
