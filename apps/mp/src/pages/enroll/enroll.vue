<template>
  <view class="page">
    <view class="card summary" v-if="title">
      <text class="summary-title">{{ title }}</text>
      <text class="summary-price">¥{{ price }} / 人</text>
    </view>

    <view class="card">
      <view class="section-title">参团人信息</view>
      <view class="form-row">
        <text class="label">姓名 <text class="req">*</text></text>
        <input v-model="form.name" placeholder="参团人姓名" placeholder-class="ph" />
      </view>
      <view class="form-row">
        <text class="label">证件类型 <text class="req">*</text></text>
        <picker :range="idCardTypes" :value="idCardIndex" @change="onPickType">
          <view class="picker">{{ form.idCardType }} <text class="picker-arrow">›</text></view>
        </picker>
      </view>
      <view class="form-row">
        <text class="label">证件号 <text class="req">*</text></text>
        <input v-model="form.idCard" placeholder="证件号码" placeholder-class="ph" />
      </view>
      <view class="form-row">
        <text class="label">联系电话</text>
        <input v-model="form.phone" placeholder="手机号" type="number" placeholder-class="ph" />
      </view>
      <view class="form-row">
        <text class="label">与报名人关系</text>
        <input v-model="form.relation" placeholder="如：本人 / 父子" placeholder-class="ph" />
      </view>
      <view class="form-row">
        <text class="label">紧急联系人</text>
        <input v-model="form.emergencyName" placeholder="姓名" placeholder-class="ph" />
      </view>
      <view class="form-row">
        <text class="label">紧急联系电话</text>
        <input v-model="form.emergencyPhone" placeholder="手机号" type="number" placeholder-class="ph" />
      </view>
      <view class="form-row">
        <text class="label">就读学校/年级</text>
        <input v-model="form.schoolGrade" placeholder-class="ph" />
      </view>
      <view class="form-row">
        <text class="label">备注</text>
        <input v-model="form.remark" placeholder-class="ph" />
      </view>
    </view>

    <view class="consent" @tap="agreed = !agreed">
      <view class="checkbox" :class="{ checked: agreed }"><text v-if="agreed" class="tick">✓</text></view>
      <text class="consent-text">我已阅读并同意《隐私协议》，授权采集上述参团人敏感信息用于报名</text>
    </view>

    <view class="footer">
      <button class="btn btn-primary btn-block" :disabled="submitting" @click="onSubmit">
        {{ submitting ? '提交中…' : '提交并支付 ¥' + price }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { IdCardType } from '@baoming/shared';

const idCardTypes = [IdCardType.ID_CARD, IdCardType.PASSPORT, IdCardType.HUKOU, IdCardType.OTHER];
const idCardIndex = ref(0);

const projectId = ref('');
const title = ref('');
const price = ref('');
const submitting = ref(false);
const agreed = ref(false);

const form = reactive({
  name: '',
  idCardType: IdCardType.ID_CARD,
  idCard: '',
  phone: '',
  relation: '',
  emergencyName: '',
  emergencyPhone: '',
  schoolGrade: '',
  remark: '',
});

const onPickType = (e: { detail: { value: number } }) => {
  idCardIndex.value = e.detail.value;
  form.idCardType = idCardTypes[e.detail.value];
};

const onSubmit = async () => {
  if (!form.name || !form.idCard) {
    uni.showToast({ title: '请填写姓名和证件号', icon: 'none' });
    return;
  }
  if (!agreed.value) {
    uni.showToast({ title: '请先同意隐私协议', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    try {
      await request({
        url: '/mp/consent',
        method: 'POST',
        data: { consentType: 'sensitive_info_collection', policyVersion: '1.0' },
      });
    } catch {
      // consent failure shouldn't block enrollment
    }

    const res = await request<{ orderId: string; orderNo: string; amount: string }>({
      url: '/mp/orders',
      method: 'POST',
      data: { projectId: projectId.value, participant: { ...form } },
    });
    try {
      const pay = await request<{ payParams: Record<string, string> }>({
        url: '/mp/orders/' + res.orderId + '/pay',
        method: 'POST',
      });
      uni.requestPayment({
        provider: 'wxpay',
        timeStamp: pay.payParams.timeStamp,
        nonceStr: pay.payParams.nonceStr,
        package: pay.payParams.package,
        signType: pay.payParams.signType as 'RSA',
        paySign: pay.payParams.paySign,
        success: () => {
          uni.showToast({ title: '支付成功', icon: 'success' });
          uni.redirectTo({ url: '/pages/order-detail/order-detail?id=' + res.orderId });
        },
        fail: () => {
          uni.showToast({ title: '支付未完成，可在订单中重试', icon: 'none' });
          uni.redirectTo({ url: '/pages/order-detail/order-detail?id=' + res.orderId });
        },
      });
    } catch {
      uni.redirectTo({ url: '/pages/order-detail/order-detail?id=' + res.orderId });
    }
  } catch {
    // toast handled
  } finally {
    submitting.value = false;
  }
};

onLoad((q) => {
  const r = q as { id?: string; title?: string; price?: string };
  projectId.value = r.id ?? '';
  title.value = r.title ? decodeURIComponent(r.title) : '';
  price.value = r.price ?? '';
});
</script>

<style>
.page { padding: 24rpx 28rpx 160rpx; }

.summary { display: flex; flex-direction: column; }
.summary-title { font-size: 32rpx; font-weight: 700; }
.summary-price { color: var(--accent); font-size: 30rpx; font-weight: 700; margin-top: 8rpx; }

.card { margin-top: 24rpx; }
.form-row {
  display: flex; align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--line);
}
.form-row:last-child { border-bottom: none; }
.label { width: 220rpx; color: var(--text-2); font-size: 28rpx; flex-shrink: 0; }
.req { color: var(--danger); }
.form-row input { flex: 1; font-size: 28rpx; color: var(--text); }
.ph { color: var(--muted); }
.picker { display: flex; align-items: center; justify-content: flex-end; flex: 1; font-size: 28rpx; color: var(--text); }
.picker-arrow { color: var(--muted); margin-left: 8rpx; }

.consent { display: flex; align-items: flex-start; padding: 24rpx 8rpx 0; gap: 16rpx; }
.checkbox {
  width: 36rpx; height: 36rpx; border: 2rpx solid #d1d5db; border-radius: 8rpx;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2rpx;
}
.checkbox.checked { background: var(--primary-grad); border-color: transparent; }
.tick { color: #fff; font-size: 24rpx; font-weight: 700; }
.consent-text { font-size: 24rpx; color: var(--text-2); line-height: 1.5; }
</style>
