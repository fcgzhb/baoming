<template>
  <div v-loading="loading">
    <el-page-header content="订单详情" @back="$router.back()" />
    <el-descriptions v-if="order" :column="2" border style="margin-top: 16px">
      <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag>{{ OrderStatusLabel[order.status as OrderStatus] }}</el-tag>
        <span v-if="order.refundStatus" style="margin-left: 8px; color: #909399">
          ({{ REFUND_STATUS_LABEL[order.refundStatus as RefundStatus] }})
        </span>
      </el-descriptions-item>
      <el-descriptions-item label="项目">{{ order.project?.title }}</el-descriptions-item>
      <el-descriptions-item label="金额">¥{{ order.amount }}</el-descriptions-item>
      <el-descriptions-item label="参团人">{{ order.participant?.name }}</el-descriptions-item>
      <el-descriptions-item label="证件">{{ order.participant?.idCardType }} {{ order.participant?.idCard }}</el-descriptions-item>
      <el-descriptions-item label="联系电话">{{ order.participant?.phone }}</el-descriptions-item>
      <el-descriptions-item label="紧急联系人">{{ order.participant?.emergencyName }} {{ order.participant?.emergencyPhone }}</el-descriptions-item>
      <el-descriptions-item label="学校/年级">{{ order.participant?.schoolGrade }}</el-descriptions-item>
      <el-descriptions-item label="报名用户">{{ order.user?.nickname }} ({{ order.user?.phone }})</el-descriptions-item>
      <el-descriptions-item label="支付时间">{{ order.paidAt || '-' }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ order.createdAt }}</el-descriptions-item>
    </el-descriptions>
    <div v-if="order && order.status === 'confirmed'" style="margin-top: 16px">
      <el-button type="warning" :loading="refunding" @click="onRefund">发起全额退款</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { OrderStatusLabel, REFUND_STATUS_LABEL, getOrder, refundOrder, type AdminOrder } from '../api/orders';
import type { OrderStatus, RefundStatus } from '@baoming/shared';

const route = useRoute();
const router = useRouter();
const order = ref<AdminOrder & { project?: any; participant?: any; user?: any } | null>(null);
const loading = ref(false);
const refunding = ref(false);

const load = async () => {
  loading.value = true;
  try {
    order.value = await getOrder(route.params.id as string);
  } finally {
    loading.value = false;
  }
};

const onRefund = () => {
  ElMessageBox.confirm('确认发起全额退款？', '退款确认', { type: 'warning' })
    .then(async () => {
      refunding.value = true;
      try {
        await refundOrder(order.value!.id);
        ElMessage.success('退款已发起，等待微信回调');
        load();
      } finally {
        refunding.value = false;
      }
    })
    .catch(() => {});
};

onMounted(load);
</script>
