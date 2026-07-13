<template>
  <view class="page">
    <view class="title">游学报名</view>
    <button class="btn" open-type="getUserInfo" @click="onLogin">微信授权登录</button>
    <view class="muted">登录接口 /api/mp/auth/login 将在 Phase 3 (US2) 后端联调</view>
  </view>
</template>

<script setup lang="ts">
const onLogin = async () => {
  // Placeholder: real flow uses uni.login({ provider: 'weixin' }) -> POST /mp/auth/login.
  uni.showToast({ title: '待后端联调', icon: 'none' });
};
</script>

<style>
.page { padding: 80rpx 40rpx; }
.title { font-size: 44rpx; font-weight: 700; text-align: center; margin: 80rpx 0; }
.btn { background: #07c160; color: #fff; border-radius: 999rpx; }
.muted { color: #909399; font-size: 24rpx; margin-top: 24rpx; text-align: center; }
</style>
