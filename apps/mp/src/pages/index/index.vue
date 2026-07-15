<template>
  <view class="page">
    <!-- Hero header -->
    <view class="hero">
      <view class="hero-inner">
        <text class="hero-greet">你好，同学 👋</text>
        <text class="hero-title">探索精彩游学项目</text>
        <view class="hero-search" @click="noop">
          <text class="hero-search-text">发现你的下一段旅程</text>
        </view>
      </view>
    </view>

    <view class="list">
      <view v-if="loading" class="state">加载中…</view>
      <view v-else-if="projects.length === 0" class="state empty">
        <text class="empty-emoji">🗺️</text>
        <text>暂无游学项目，敬请期待</text>
      </view>

      <view v-for="p in projects" :key="p.id" class="p-card" @click="goDetail(p.id)">
        <view class="cover-wrap">
          <image
            v-if="p.coverImageUrl"
            class="cover"
            :src="p.coverImageUrl"
            mode="aspectFill"
          />
          <view v-else class="cover cover-fallback"><text>游学</text></view>
          <view class="cover-mask" />
          <view class="quota-badge">
            <text class="qb-num">{{ p.remainingQuota }}</text>
            <text class="qb-label">余位</text>
          </view>
        </view>
        <view class="p-body">
          <text class="p-title">{{ p.title }}</text>
          <view class="p-foot">
            <view class="price">
              <text class="price-cur">¥</text>
              <text class="price-num">{{ p.price }}</text>
            </view>
            <text class="p-cta">立即查看 ›</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

interface ProjectListItem {
  id: string;
  title: string;
  coverImageUrl?: string;
  price: string;
  remainingQuota: number;
}

const projects = ref<ProjectListItem[]>([]);
const loading = ref(false);

const noop = () => {};

const load = async () => {
  loading.value = true;
  try {
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

const goDetail = (id: string) => uni.navigateTo({ url: '/pages/detail/detail?id=' + id });

onShow(() => void load());
</script>

<style>
.page { padding-bottom: 40rpx; }

.hero {
  background: var(--primary-grad);
  padding: 60rpx 40rpx 80rpx;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
}
.hero-inner { color: #fff; }
.hero-greet { font-size: 26rpx; opacity: 0.9; display: block; }
.hero-title { font-size: 44rpx; font-weight: 800; margin-top: 10rpx; display: block; }
.hero-search {
  margin-top: 28rpx;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 999rpx;
  padding: 18rpx 32rpx;
}
.hero-search-text { color: #fff; font-size: 26rpx; opacity: 0.9; }

.list { padding: 0 28rpx; margin-top: -44rpx; }

.state { text-align: center; color: var(--muted); padding: 80rpx 0; font-size: 28rpx; }
.empty { display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.empty-emoji { font-size: 72rpx; }

.p-card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  margin-bottom: 28rpx;
}
.cover-wrap { position: relative; height: 280rpx; }
.cover { width: 100%; height: 100%; }
.cover-fallback {
  background: linear-gradient(135deg, #93c5fd, #5eead4);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 44rpx; font-weight: 700; letter-spacing: 8rpx;
}
.cover-mask { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35)); }
.quota-badge {
  position: absolute; right: 20rpx; top: 20rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16rpx;
  padding: 8rpx 18rpx;
  display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.12);
}
.qb-num { color: var(--accent); font-size: 32rpx; font-weight: 800; line-height: 1; }
.qb-label { color: var(--text-2); font-size: 20rpx; }

.p-body { padding: 24rpx 28rpx 26rpx; }
.p-title { font-size: 32rpx; font-weight: 700; color: var(--text); display: block; line-height: 1.4; }
.p-foot { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 18rpx; }
.price { color: var(--accent); }
.price-cur { font-size: 24rpx; }
.price-num { font-size: 40rpx; font-weight: 800; }
.p-cta { color: var(--primary); font-size: 26rpx; font-weight: 600; }
</style>
