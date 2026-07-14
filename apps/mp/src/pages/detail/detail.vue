<template>
  <view class="page" v-if="p">
    <image v-if="p.coverImageUrl" class="cover" :src="p.coverImageUrl" mode="aspectFill" />
    <view class="info">
      <text class="title">{{ p.title }}</text>
      <view class="row">
        <text class="price">¥{{ p.price }}</text>
        <text class="quota">余 {{ p.remainingQuota }} 名额</text>
      </view>
      <view class="meta">出发 {{ p.departureDate || '-' }} ~ 返回 {{ p.returnDate || '-' }}</view>
      <view class="meta">报名截止：{{ fmt(p.enrollDeadline) }}</view>

      <view class="section-title">图文介绍</view>
      <rich-text class="rich" :nodes="p.description || '<暂无介绍>'" />

      <view class="section-title">行程安排</view>
      <text class="content">{{ p.itinerary || '暂无' }}</text>
    </view>

    <view class="footer">
      <button v-if="p.enrollable" class="btn primary" @click="onEnroll">立即报名</button>
      <button v-else class="btn disabled" disabled>{{ disabledText }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { getToken } from '../../utils/request';

interface ProjectDetail {
  id: string;
  title: string;
  coverImageUrl?: string;
  description?: string;
  itinerary?: string;
  departureDate?: string;
  returnDate?: string;
  price: string;
  remainingQuota: number;
  enrollDeadline?: string;
  enrollable: boolean;
}

const p = ref<ProjectDetail | null>(null);

const disabledText = computed(() => {
  if (!p.value) return '';
  if (p.value.remainingQuota <= 0) return '名额已满';
  return '报名已截止';
});

const fmt = (iso?: string) => (iso ? iso.replace('T', ' ').slice(0, 16) : '-');

const onEnroll = () => {
  if (!getToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  uni.navigateTo({ url: '/pages/enroll/enroll?id=' + p.value!.id + '&title=' + encodeURIComponent(p.value!.title) + '&price=' + p.value!.price });
};

onLoad(async (q) => {
  const id = (q as { id?: string })?.id;
  if (!id) return;
  try {
    p.value = await request<ProjectDetail>({ url: '/mp/projects/' + id, auth: false });
  } catch {
    // toast handled
  }
});
</script>

<style>
.page { padding-bottom: 140rpx; background: #f7f8fa; min-height: 100vh; }
.cover { width: 100%; height: 380rpx; }
.info { background: #fff; padding: 24rpx; }
.title { font-size: 34rpx; font-weight: 700; }
.row { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.price { color: #f56c6c; font-size: 36rpx; font-weight: 600; }
.quota { color: #909399; font-size: 24rpx; }
.meta { color: #606266; font-size: 26rpx; margin-top: 12rpx; }
.section-title { font-size: 30rpx; font-weight: 600; margin: 28rpx 0 12rpx; }
.rich { font-size: 28rpx; color: #333; }
.content { font-size: 28rpx; color: #606266; white-space: pre-wrap; }
.footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 16rpx 24rpx; background: #fff; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.06); }
.btn { border-radius: 999rpx; font-size: 30rpx; }
.btn.primary { background: #409eff; color: #fff; }
.btn.disabled { background: #dcdfe6; color: #909399; }
</style>
