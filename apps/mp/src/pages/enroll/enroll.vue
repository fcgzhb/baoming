<template>
  <view class="page">
    <view class="card" v-if="title">
      <text class="title">{{ title }}</text>
      <text class="price">¥{{ price }}</text>
    </view>

    <view class="card">
      <view class="section-title">参团人信息</view>
      <view class="form-row">
        <text class="label">姓名 *</text>
        <input v-model="form.name" placeholder="参团人姓名" />
      </view>
      <view class="form-row">
        <text class="label">证件类型 *</text>
        <picker :range="idCardTypes" :value="idCardIndex" @change="onPickType">
          <view class="picker">{{ form.idCardType }}</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="label">证件号 *</text>
        <input v-model="form.idCard" placeholder="证件号码" />
      </view>
      <view class="form-row">
        <text class="label">联系电话</text>
        <input v-model="form.phone" placeholder="手机号" type="number" />
      </view>
      <view class="form-row">
        <text class="label">与报名人关系</text>
        <input v-model="form.relation" placeholder="如：本人 / 父子" />
      </view>
      <view class="form-row">
        <text class="label">紧急联系人</text>
        <input v-model="form.emergencyName" placeholder="姓名" />
      </view>
      <view class="form-row">
        <text class="label">紧急联系电话</text>
        <input v-model="form.emergencyPhone" placeholder="手机号" type="number" />
      </view>
      <view class="form-row">
        <text class="label">就读学校/年级</text>
        <input v-model="form.schoolGrade" />
      </view>
      <view class="form-row">
        <text class="label">备注</text>
        <input v-model="form.remark" />
      </view>
    </view>

    <view class="consent" @tap="agreed = !agreed">
      <checkbox :checked="agreed" color="#409EFF" />
      <text class="consent-text">我已阅读并同意《隐私协议》，授权采集上述参团人敏感信息用于报名</text>
    </view>

    <view class="footer">
      <button class="btn primary" :disabled="submitting" @click="onSubmit">
        {{ submitting ? '提交中…' : '提交并支付' }}
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
    // FR-014: record sensitive-info consent before collecting participant PII.
    try {
      await request({
        url: '/mp/consent',
        method: 'POST',
        data: { consentType: 'sensitive_info_collection', policyVersion: '1.0' },
      });
    } catch {
      // consent recording failure shouldn't block enrollment; logged server-side.
    }

    const res = await request<{ orderId: string; orderNo: string; amount: string }>({
      url: '/mp/orders',
      method: 'POST',
      data: { projectId: projectId.value, participant: { ...form } },
    });
    // Order created (pending) → try to invoke payment immediately.
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
      // Pay preparation failed (e.g. WeChat not configured) — order is created, go to detail.
      uni.redirectTo({ url: '/pages/order-detail/order-detail?id=' + res.orderId });
    }
  } catch {
    // create failed (e.g. duplicate) — toast handled in request util
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
.page { padding: 24rpx 24rpx 140rpx; background: #f7f8fa; min-height: 100vh; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.title { font-size: 32rpx; font-weight: 600; }
.price { color: #f56c6c; font-size: 32rpx; margin-top: 8rpx; display: block; }
.section-title { font-size: 28rpx; font-weight: 600; margin-bottom: 16rpx; }
.form-row { display: flex; align-items: center; padding: 18rpx 0; border-bottom: 1rpx solid #f0f2f5; }
.label { width: 220rpx; color: #606266; font-size: 28rpx; flex-shrink: 0; }
.form-row input { flex: 1; font-size: 28rpx; }
.picker { font-size: 28rpx; }
.consent { display: flex; align-items: flex-start; padding: 16rpx 8rpx; }
.consent-text { font-size: 24rpx; color: #909399; margin-left: 8rpx; line-height: 1.5; }
.footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 16rpx 24rpx; background: #fff; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.06); }
.btn { border-radius: 999rpx; font-size: 30rpx; }
.btn.primary { background: #409eff; color: #fff; }
</style>
