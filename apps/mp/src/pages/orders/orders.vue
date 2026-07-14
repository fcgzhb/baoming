<template>
  <view class="page">
    <scroll-view scroll-x class="tabs">
      <text
        v-for="t in tabs"
        :key="t.value"
        class="tab"
        :class="{ active: current === t.value }"
        @click="switchTab(t.value)"
        >{{ t.label }}</text
      >
    </scroll-view>
    <view v-if="loading" class="muted">加载中…</view>
    <view v-else-if="orders.length === 0" class="muted">暂无订单</view>
    <view v-for="o in orders" :key="o.id" class="card" @click="goDetail(o.id)">
      <view class="row">
        <text class="title">{{ o.projectTitle || '游学项目' }}</text>
        <text class="status">{{ statusLabel(o.status) }}</text>
      </view>
      <view class="row">
        <text class="amount">¥{{ o.amount }}</text>
        <text class="muted">{{ o.orderNo }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { OrderStatusLabel, OrderStatus } from '@baoming/shared';

interface Order {
  id: string;
  orderNo: string;
  projectTitle: string | null;
  amount: string;
  status: OrderStatus;
}

const tabs = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待支付' },
  { value: 'confirmed', label: '已报名' },
  { value: 'refunded', label: '已退款' },
  { value: 'cancelled', label: '已取消' },
];
const current = ref('');
const orders = ref<Order[]>([]);
const loading = ref(false);

const statusLabel = (s: OrderStatus) => OrderStatusLabel[s] ?? s;

const load = async () => {
  loading.value = true;
  try {
    const url = '/mp/orders' + (current.value ? '?status=' + current.value : '');
    const data = await request<{ list: Order[] }>({ url });
    orders.value = data?.list ?? [];
  } catch {
    // toast handled in request util
  } finally {
    loading.value = false;
  }
};

const switchTab = (v: string) => {
  current.value = v;
  load();
};

const goDetail = (id: string) => uni.navigateTo({ url: '/pages/order-detail/order-detail?id=' + id });

onShow(() => load());
</script>

<style>
.page { padding: 0 0 24rpx; min-height: 100vh; background: #f7f8fa; }
.tabs { white-space: nowrap; padding: 16rpx 24rpx; background: #fff; }
.tab { display: inline-block; padding: 8rpx 24rpx; margin-right: 16rpx; font-size: 26rpx; color: #606266; border-radius: 999rpx; background: #f0f2f5; }
.tab.active { background: #409eff; color: #fff; }
.card { background: #fff; margin: 16rpx 24rpx; padding: 24rpx; border-radius: 16rpx; }
.row { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 30rpx; font-weight: 600; }
.status { font-size: 24rpx; color: #409eff; }
.amount { color: #f56c6c; font-size: 32rpx; margin-top: 12rpx; }
.muted { color: #909399; font-size: 22rpx; }
</style>
