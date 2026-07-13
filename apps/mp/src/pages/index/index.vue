<template>
  <view class="page">
    <view class="header">游学项目</view>
    <view v-if="loading" class="muted">加载中…</view>
    <view v-else-if="projects.length === 0" class="muted">
      暂无项目（后端 US1 项目接口完成后将在此展示）
    </view>
    <view v-for="p in projects" :key="p.id" class="card">
      <image v-if="p.coverImageUrl" class="cover" :src="p.coverImageUrl" mode="aspectFill" />
      <view class="title">{{ p.title }}</view>
      <view class="price">¥{{ p.price }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { request } from '../../utils/request';

interface ProjectListItem {
  id: string;
  title: string;
  coverImageUrl?: string;
  price: string;
}

const projects = ref<ProjectListItem[]>([]);
const loading = ref(false);

const load = async () => {
  loading.value = true;
  try {
    // GET /api/mp/projects — served once Phase 5 (US1) lands.
    const data = await request<{ list: ProjectListItem[] } | ProjectListItem[]>({
      url: '/mp/projects',
      auth: false,
    });
    projects.value = Array.isArray(data) ? data : data?.list ?? [];
  } catch {
    // toast handled in request util
  } finally {
    loading.value = false;
  }
};

// uni-app lifecycle (equivalent to onLoad)
import { onShow } from '@dcloudio/uni-app';
onShow(() => void load());
</script>

<style>
.page { padding: 24rpx; background: #f7f8fa; min-height: 100vh; }
.header { font-size: 36rpx; font-weight: 600; margin-bottom: 16rpx; }
.muted { color: #909399; font-size: 26rpx; padding: 32rpx 0; text-align: center; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.cover { width: 100%; height: 280rpx; border-radius: 12rpx; }
.title { font-size: 30rpx; font-weight: 600; margin-top: 12rpx; }
.price { color: #f56c6c; font-size: 32rpx; margin-top: 8rpx; }
</style>
