<template>
  <view class="page">
    <view v-if="!token" class="card">
      <text class="name">未登录</text>
      <button class="btn primary" @click="goLogin">去登录</button>
    </view>
    <view v-else class="card">
      <image v-if="user?.avatarUrl" class="avatar" :src="user.avatarUrl" />
      <view v-else class="avatar placeholder">{{ (user?.nickname || '游')[0] }}</view>
      <text class="name">{{ user?.nickname || '游学用户' }}</text>
      <text class="phone">{{ user?.phone || '未绑定手机号' }}</text>
      <button v-if="user && !user.phone" class="btn ghost" open-type="getPhoneNumber" @getphonenumber="onPhone">
        绑定手机号
      </button>
      <button class="btn ghost" @click="onLogout">退出登录</button>
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
  } catch {
    // toast handled
  }
};

const onPhone = async (e: { detail: { errMsg: string; code?: string } }) => {
  if (e.detail.errMsg !== 'getPhoneNumber:ok' || !e.detail.code) return;
  try {
    const data = await request<{ phone: string }>({
      url: '/mp/auth/phone',
      method: 'POST',
      data: { code: e.detail.code },
    });
    if (user.value) user.value.phone = data.phone;
    uni.showToast({ title: '已绑定', icon: 'success' });
  } catch {}
};

const onLogout = () => {
  clearToken();
  token.value = '';
  user.value = null;
  uni.showToast({ title: '已退出', icon: 'none' });
};

const goLogin = () => uni.navigateTo({ url: '/pages/login/login' });

onShow(() => load());
</script>

<style>
.page { padding: 24rpx; min-height: 100vh; background: #f7f8fa; }
.card { background: #fff; border-radius: 16rpx; padding: 48rpx 24rpx; text-align: center; }
.avatar { width: 120rpx; height: 120rpx; border-radius: 50%; }
.avatar.placeholder { background: #409eff; color: #fff; line-height: 120rpx; font-size: 48rpx; margin: 0 auto; }
.name { display: block; font-size: 32rpx; font-weight: 600; margin-top: 16rpx; }
.phone { display: block; color: #909399; font-size: 26rpx; margin-top: 8rpx; }
.btn { margin-top: 24rpx; border-radius: 999rpx; font-size: 28rpx; }
.btn.primary { background: #07c160; color: #fff; }
.btn.ghost { background: #fff; color: #606266; border: 1rpx solid #dcdfe6; }
</style>
