<template>
  <view class="page" v-if="p">
    <view class="hero">
      <image v-if="p.coverImageUrl" class="cover" :src="p.coverImageUrl" mode="aspectFill" />
      <view v-else class="cover cover-fallback"><text>游学</text></view>
      <view class="hero-mask" />
      <view class="hero-titlewrap">
        <text class="hero-title">{{ p.title }}</text>
      </view>
    </view>

    <view class="price-card">
      <view class="price">
        <text class="price-cur">¥</text>
        <text class="price-num">{{ p.price }}</text>
        <text class="price-unit">/ 人</text>
      </view>
      <view class="meta-row">
        <view class="meta-item">
          <text class="meta-label">出发</text>
          <text class="meta-val">{{ p.departureDate || '-' }}</text>
        </view>
        <view class="meta-item">
          <text class="meta-label">返回</text>
          <text class="meta-val">{{ p.returnDate || '-' }}</text>
        </view>
        <view class="meta-item">
          <text class="meta-label">余位</text>
          <text class="meta-val" :class="{ 'text-accent': p.remainingQuota > 0 }">{{ p.remainingQuota }}</text>
        </view>
      </view>
      <view class="deadline">报名截止：{{ fmt(p.enrollDeadline) }}</view>
    </view>

    <view class="section card">
      <view class="section-title">图文介绍</view>
      <rich-text class="rich" :nodes="p.description || '<p class=&quot;muted&quot;>暂无介绍</p>'" />
    </view>

    <view class="section card">
      <view class="section-title">行程安排</view>
      <text class="itinerary">{{ p.itinerary || '暂无行程信息' }}</text>
    </view>

    <view class="footer">
      <view class="footer-price">
        <text class="fp-cur">¥</text><text class="fp-num">{{ p.price }}</text>
      </view>
      <button v-if="p.enrollable" class="btn btn-primary cta" @click="onEnroll">立即报名</button>
      <button v-else class="btn btn-disabled cta" disabled>{{ disabledText }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request, getToken } from '../../utils/request';

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

const disabledText = computed(() =>
  p.value && p.value.remainingQuota <= 0 ? '名额已满' : '报名已截止',
);

const fmt = (iso?: string) => (iso ? iso.replace('T', ' ').slice(0, 16) : '-');

const onEnroll = () => {
  if (!getToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  uni.navigateTo({
    url:
      '/pages/enroll/enroll?id=' +
      p.value!.id +
      '&title=' +
      encodeURIComponent(p.value!.title) +
      '&price=' +
      p.value!.price,
  });
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
.page { padding-bottom: 160rpx; }

.hero { position: relative; height: 420rpx; }
.cover { width: 100%; height: 100%; }
.cover-fallback {
  background: linear-gradient(135deg, #93c5fd, #5eead4);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 56rpx; font-weight: 800; letter-spacing: 12rpx;
}
.hero-mask { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.55)); }
.hero-titlewrap {
  position: absolute; left: 36rpx; right: 36rpx; bottom: 40rpx;
}
.hero-title { color: #fff; font-size: 40rpx; font-weight: 800; line-height: 1.4; text-shadow: 0 2rpx 12rpx rgba(0,0,0,0.4); }

.price-card {
  margin: -36rpx 28rpx 0;
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 32rpx 28rpx 28rpx;
  position: relative;
}
.price { display: flex; align-items: baseline; }
.price-cur { color: var(--accent); font-size: 28rpx; font-weight: 700; }
.price-num { color: var(--accent); font-size: 56rpx; font-weight: 800; line-height: 1; }
.price-unit { color: var(--muted); font-size: 24rpx; margin-left: 8rpx; }

.meta-row { display: flex; margin-top: 28rpx; padding-top: 24rpx; border-top: 1rpx solid var(--line); }
.meta-item { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
.meta-label { color: var(--muted); font-size: 24rpx; }
.meta-val { color: var(--text); font-size: 28rpx; font-weight: 600; }
.text-accent { color: var(--accent); }
.deadline { margin-top: 24rpx; color: var(--text-2); font-size: 24rpx; }

.section { margin: 28rpx; }
.rich { font-size: 28rpx; line-height: 1.7; color: var(--text); }
.itinerary { font-size: 28rpx; line-height: 1.7; color: var(--text-2); white-space: pre-wrap; }

.footer { display: flex; align-items: center; gap: 24rpx; }
.footer-price { color: var(--accent); display: flex; align-items: baseline; }
.fp-cur { font-size: 26rpx; }
.fp-num { font-size: 44rpx; font-weight: 800; }
.cta { flex: 1; }
</style>
