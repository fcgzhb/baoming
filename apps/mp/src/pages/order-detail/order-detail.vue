<template>
  <view class="page" v-if="order">
    <view class="card">
      <view class="row"><text class="label">订单号</text><text>{{ order.orderNo }}</text></view>
      <view class="row"><text class="label">状态</text><text class="status">{{ statusLabel(order.status) }}</text></view>
      <view class="row"><text class="label">金额</text><text class="amount">¥{{ order.amount }}</text></view>
      <view class="row"><text class="label">项目</text><text>{{ order.project?.title }}</text></view>
    </view>
    <view class="card" v-if="order.participant">
      <view class="section-title">参团人信息</view>
      <view class="row"><text class="label">姓名</text><text>{{ order.participant.name }}</text></view>
      <view class="row"><text class="label">证件</text><text>{{ order.participant.idCardType }} {{ order.participant.idCard }}</text></view>
      <view class="row"><text class="label">电话</text><text>{{ order.participant.phone || '-' }}</text></view>
      <view class="row"><text class="label">紧急联系人</text><text>{{ order.participant.emergencyName }} {{ order.participant.emergencyPhone }}</text></view>
    </view>
    <view class="actions" v-if="order.status === 'pending'">
      <button class="btn primary" @click="onPay">继续支付</button>
      <button class="btn ghost" @click="onCancel">取消订单</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { OrderStatusLabel, OrderStatus } from '@baoming/shared';

const order = ref<any>(null);
const statusLabel = (s: OrderStatus) => OrderStatusLabel[s] ?? s;

const load = async (id: string) => {
  order.value = await request({ url: '/mp/orders/' + id });
};

const onPay = async () => {
  try {
    const res = await request<{ payParams: any }>({ url: '/mp/orders/' + order.value.id + '/pay', method: 'POST' });
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: res.payParams.timeStamp,
      nonceStr: res.payParams.nonceStr,
      package: res.payParams.package,
      signType: res.payParams.signType,
      paySign: res.payParams.paySign,
      success: () => {
        uni.showToast({ title: '支付成功', icon: 'success' });
        load(order.value.id);
      },
      fail: () => uni.showToast({ title: '支付未完成', icon: 'none' }),
    });
  } catch {
    // toast handled in request util
  }
};

const onCancel = () => {
  uni.showModal({
    title: '提示',
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
.page { padding: 24rpx; min-height: 100vh; background: #f7f8fa; }
.card { background: #fff; padding: 24rpx; border-radius: 16rpx; margin-bottom: 20rpx; }
.section-title { font-size: 28rpx; font-weight: 600; margin-bottom: 16rpx; }
.row { display: flex; justify-content: space-between; padding: 12rpx 0; font-size: 28rpx; }
.label { color: #909399; }
.status { color: #409eff; }
.amount { color: #f56c6c; font-weight: 600; }
.actions { display: flex; gap: 20rpx; margin-top: 24rpx; }
.btn { flex: 1; border-radius: 999rpx; font-size: 28rpx; }
.btn.primary { background: #409eff; color: #fff; }
.btn.ghost { background: #fff; color: #606266; border: 1rpx solid #dcdfe6; }
</style>
