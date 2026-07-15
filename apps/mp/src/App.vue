<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';

onLaunch(() => {
  // eslint-disable-next-line no-console
  console.log('[mp] app launched');
});
</script>

<template>
  <view />
</template>

<style>
/* ============ Design system (global) ============ */
page {
  --primary: #2563eb;
  --primary-grad: linear-gradient(135deg, #4f8bff 0%, #2dd4bf 100%);
  --accent: #ff5a36;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --text: #1f2937;
  --text-2: #6b7280;
  --muted: #9ca3af;
  --bg: #f3f5f9;
  --card: #ffffff;
  --line: #eef1f6;
  --radius: 24rpx;
  --shadow: 0 6rpx 28rpx rgba(31, 41, 55, 0.06);
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
}

view, text { box-sizing: border-box; }

.page { min-height: 100vh; background: var(--bg); }

/* Cards */
.card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 28rpx;
}

/* Section title */
.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text);
  margin: 8rpx 0 20rpx;
  display: flex;
  align-items: center;
}
.section-title::before {
  content: '';
  display: inline-block;
  width: 8rpx;
  height: 30rpx;
  background: var(--primary-grad);
  border-radius: 8rpx;
  margin-right: 16rpx;
}

/* Buttons */
.btn {
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 88rpx;
  height: 88rpx;
  text-align: center;
}
.btn-primary { background: var(--primary-grad); color: #fff; box-shadow: 0 8rpx 20rpx rgba(37, 99, 235, 0.28); }
.btn-ghost { background: #fff; color: var(--text); border: 1rpx solid var(--line); }
.btn-disabled { background: #e5e7eb; color: #9ca3af; }
.btn-block { width: 100%; }

/* Tags / pills */
.tag {
  display: inline-block;
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  font-weight: 600;
}
.tag-success { background: rgba(16, 185, 129, 0.12); color: var(--success); }
.tag-warning { background: rgba(245, 158, 11, 0.14); color: var(--warning); }
.tag-info { background: rgba(37, 99, 235, 0.1); color: var(--primary); }
.tag-danger { background: rgba(239, 68, 68, 0.12); color: var(--danger); }
.tag-muted { background: #f0f2f5; color: var(--muted); }

.muted { color: var(--muted); }
.text-2 { color: var(--text-2); }

/* Sticky bottom bar */
.footer {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10rpx);
  box-shadow: 0 -4rpx 20rpx rgba(31, 41, 55, 0.06);
}
</style>
