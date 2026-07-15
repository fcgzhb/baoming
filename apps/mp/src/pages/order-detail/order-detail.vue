<template>
  <view class="page" v-if="order">
    <!-- Status banner -->
    <view class="banner" :class="bannerClass(order.status)">
      <text class="banner-status">{{ statusLabel(order.status) }}</text>
      <text class="banner-hint">{{ bannerHint(order.status) }}</text>
    </view>

    <!-- Project summary -->
    <view class="card proj-card" @click="goProject">
      <view class="proj-title">{{ order.project?.title }}</view>
      <view class="proj-row">
        <text class="proj-amount"><text class="pa-cur">¥</text>{{ order.amount }}</text>
        <text class="proj-cta">查看项目 ›</text>
      </view>
    </view>

    <!-- Participant -->
    <view class="card">
      <view class="section-title">参团人信息</view>
      <view class="info-row"><text class="info-label">姓名</text><text class="info-val">{{ order.participant?.name }}</text></view>
      <view class="info-row"><text class="info-label">证件</text><text class="info-val">{{ order.participant?.idCardType }} {{ order.participant?.idCard }}</text></view>
      <view class="info-row"><text class="info-label">电话</text><text class="info-val">{{ order.participant?.phone || '-' }}</text></view>
      <view class="info-row"><text class="info-label">紧急联系人</text><text class="info-val">{{ order.participant?.emergencyName }} {{ order.participant?.emergencyPhone }}</text></view>
      <view class="info-row"><text class="info-label">学校/年级</text><text class="info-val">{{ order.participant?.schoolGrade || '-' }}</text></view>
    </view>

    <!-- Order meta -->
    <view class="card">
      <view class="section-title">订单信息</view>
      <view class="info-row"><text class="info-label">订单号</text><text class="info-val">{{ order.orderNo }}</text></view>
      <view class="info-row"><text class="info-label">报名用户</text><text class="info-val">{{ order.user?.nickname || '-' }} {{ order.user?.phone ? '· ' + order.user.phone : '' }}</text></view>
      <view class="info-row"><text class="info-label">支付时间</text><text class="info-val">{{ fmt(order.paidAt) }}</text></view>
      <view class="info-row"><text class="info-label">创建时间</text><text class="info-val">{{ fmt(order.createdAt) }}</text></view>
    </view>

    <view v-if="order.status === 'pending'" class="footer">
      <button class="btn btn-ghost" @click="onCancel">取消订单</button>
      <button class="btn btn-primary cta" @click="onPay">继续支付</button>
    </view>
  </view>
  <view v-else class="state">加载中…</view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { OrderStatusLabel, OrderStatus } from '@baoming/shared';

const order = ref<any>(null);
const statusLabel = (s: OrderStatus) => OrderStatusLabel[s] ?? s;
const fmt = (iso?: string | null) => (iso ? iso.replace('T', ' ').slice(0, 19) : '-');

const bannerClass = (s: OrderStatus) =>
  s === 'confirmed' ? 'banner-success' : s === 'refunded' ? 'banner-muted' : s === 'cancelled' ? 'banner-muted' : 'banner-warning';
const bannerHint = (s: OrderStatus) =>
  s === 'pending' ? '订单待支付，名额有限请尽快完成' : s === 'confirmed' ? '报名成功，等待出行通知' : s === 'refunded' ? '订单已退款' : '订单已取消';

const goProject = () => {
  if (order.value?.projectId) uni.navigateTo({ url: '/pages/detail/detail?id=' + order.value.projectId });
};

const load = async (id: string) => {
  order.value = await request({ url: '/mp/orders/' + id });
};

const onPay = async () => {
  try {
    const res = await request<{ payParams: Record<string, string> }>({
      url: '/mp/orders/' + order.value.id + '/pay',
      method: 'POST',
    });
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: res.payParams.timeStamp,
      nonceStr: res.payParams.nonceStr,
      package: res.payParams.package,
      signType: res.payParams.signType as 'RSA',
      paySign: res.payParams.paySign,
      success: () => {
        uni.showToast({ title: '支付成功', icon: 'success' });
        load(order.value.id);
      },
      fail: () => uni.showToast({ title: '支付未完成', icon: 'none' }),
    });
  } catch {
    // toast handled
  }
};

const onCancel = () => {
  uni.showModal({
    title: '取消订单',
    content: '确认取消该订单？',
    success: async (r) => {
      if (!r.confirm) return;
      await request({ url: '/mp/orders/' + order.value.id + '/cancel', method: 'POST' });
      uni.showToast({ title: '已取消', icon: 'none' });
      load(order.value.id);
    },
  });
};

onLoad((q) => {
  const id = (q as { id?: string })?.id;
  if (id) load(id);
});
</script>

<style>
.page { padding: 0 0 160rpx; }
.state { text-align: center; color: var(--muted); padding: 120rpx 0; }

.banner {
  margin: 24rpx 28rpx 0;
  padding: 28rpx 32rpx;
  border-radius: var(--radius);
  display: flex; flex-direction: column; gap: 6rpx;
}
.banner-success { background: linear-gradient(135deg, #10b981, #34d399); color: #fff; }
.banner-warning { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #fff; }
.banner-muted { background: #f0f2f5; color: var(--text-2); }
.banner-status { font-size: 34rpx; font-weight: 800; }
.banner-hint { font-size: 24rpx; opacity: 0.92; }

.card { margin: 24rpx 28rpx 0; }
.proj-card { display: flex; flex-direction: column; }
.proj-title { font-size: 32rpx; font-weight: 700; }
.proj-row { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; }
.proj-amount { color: var(--accent); font-size: 36rpx; font-weight: 800; }
.pa-cur { font-size: 24rpx; }
.proj-cta { color: var(--primary); font-size: 26rpx; font-weight: 600; }

.info-row { display: flex; justify-content: space-between; padding: 16rpx 0; border-bottom: 1rpx solid var(--line); }
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--muted); font-size: 27rpx; flex-shrink: 0; }
.info-val { color: var(--text); font-size: 27rpx; text-align: right; }

.footer { display: flex; gap: 20rpx; }
.cta { flex: 1; }
</style>
