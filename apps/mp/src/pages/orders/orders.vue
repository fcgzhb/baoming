<template>
  <view class="page">
    <scroll-view scroll-x class="tabs" :show-scrollbar="false">
      <view
        v-for="t in tabs"
        :key="t.value"
        class="tab"
        :class="{ active: current === t.value }"
        @click="switchTab(t.value)"
      >
        {{ t.label }}
      </view>
    </scroll-view>

    <view class="list">
      <view v-if="loading" class="state">加载中…</view>
      <view v-else-if="orders.length === 0" class="state empty">
        <text class="empty-emoji">📋</text>
        <text>暂无订单</text>
      </view>

      <view v-for="o in orders" :key="o.id" class="o-card" @click="goDetail(o.id)">
        <view class="o-head">
          <text class="o-project">{{ o.projectTitle || '游学项目' }}</text>
          <text class="tag" :class="statusTag(o.status)">{{ statusLabel(o.status) }}</text>
        </view>
        <view class="o-body">
          <view class="o-price">
            <text class="o-cur">¥</text><text class="o-num">{{ o.amount }}</text>
          </view>
          <text class="o-no muted">订单号 {{ o.orderNo }}</text>
        </view>
        <view v-if="o.status === 'pending'" class="o-foot">
          <text class="o-warn">待支付 · 名额有限请尽快</text>
        </view>
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
const statusTag = (s: OrderStatus): string => {
  switch (s) {
    case 'confirmed': return 'tag-success';
    case 'refunded': return 'tag-muted';
    case 'cancelled': return 'tag-muted';
    default: return 'tag-warning';
  }
};

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
.page { padding-bottom: 40rpx; }

.tabs { white-space: nowrap; padding: 24rpx 28rpx 12rpx; }
.tab {
  display: inline-block;
  padding: 14rpx 36rpx;
  margin-right: 16rpx;
  font-size: 27rpx;
  color: var(--text-2);
  background: #fff;
  border-radius: 999rpx;
  box-shadow: var(--shadow);
  transition: all 0.2s;
}
.tab.active {
  background: var(--primary-grad);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 6rpx 16rpx rgba(37, 99, 235, 0.3);
}

.list { padding: 12rpx 28rpx 0; }
.state { text-align: center; color: var(--muted); padding: 100rpx 0; font-size: 28rpx; }
.empty { display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.empty-emoji { font-size: 72rpx; }

.o-card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 28rpx;
  margin-bottom: 24rpx;
}
.o-head { display: flex; justify-content: space-between; align-items: center; }
.o-project { font-size: 31rpx; font-weight: 700; color: var(--text); flex: 1; margin-right: 16rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.o-body { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20rpx; }
.o-price { color: var(--accent); display: flex; align-items: baseline; }
.o-cur { font-size: 24rpx; }
.o-num { font-size: 38rpx; font-weight: 800; }
.o-no { font-size: 22rpx; }
.o-foot { margin-top: 20rpx; padding-top: 18rpx; border-top: 1rpx dashed var(--line); }
.o-warn { color: var(--warning); font-size: 24rpx; }
</style>
