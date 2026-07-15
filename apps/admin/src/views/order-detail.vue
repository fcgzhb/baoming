<template>
  <div v-loading="loading">
    <div class="bm-page-header">
      <h2 class="bm-page-title"><el-icon><Document /></el-icon>订单详情</h2>
      <el-button plain round @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20" v-if="order">
      <el-col :xs="24" :md="16">
        <el-card shadow="never" class="block">
          <template #header>
            <div class="block-head">
              <span class="block-title">订单信息</span>
              <el-tag :type="statusType" effect="light" round size="large">{{ OrderStatusLabel[order.status as OrderStatus] }}</el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="金额"><span class="price">¥{{ order.amount }}</span></el-descriptions-item>
            <el-descriptions-item label="项目">{{ order.project?.title }}</el-descriptions-item>
            <el-descriptions-item label="报名用户">{{ order.user?.nickname }} ({{ order.user?.phone }})</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ formatDateTime(order.paidAt) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(order.createdAt) }}</el-descriptions-item>
            <el-descriptions-item v-if="order.refundStatus" label="退款状态">
              {{ REFUND_STATUS_LABEL[order.refundStatus as RefundStatus] }}
            </el-descriptions-item>
            <el-descriptions-item v-if="order.refundedAt" label="退款时间">{{ formatDateTime(order.refundedAt) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card v-if="order.participant" shadow="never" class="block">
          <template #header><span class="block-title">参团人信息</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ order.participant.name }}</el-descriptions-item>
            <el-descriptions-item label="证件">{{ order.participant.idCardType }} {{ order.participant.idCard }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ order.participant.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="紧急联系人">{{ order.participant.emergencyName }} {{ order.participant.emergencyPhone }}</el-descriptions-item>
            <el-descriptions-item label="学校/年级">{{ order.participant.schoolGrade || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ order.participant.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="block actions-card">
          <template #header><span class="block-title">操作</span></template>
          <el-button
            v-if="order.status === 'confirmed'"
            type="warning"
            round
            class="action-btn"
            :loading="refunding"
            @click="onRefund"
          >
            <el-icon><RefreshLeft /></el-icon>发起全额退款
          </el-button>
          <el-alert v-else type="info" :closable="false" show-icon>
            仅「已报名(已支付)」订单可发起退款。
          </el-alert>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Document, RefreshLeft } from '@element-plus/icons-vue';
import { OrderStatusLabel, REFUND_STATUS_LABEL, getOrder, refundOrder, type AdminOrder } from '../api/orders';
import type { OrderStatus, RefundStatus } from '@baoming/shared';
import { formatDateTime } from '../utils/format';

const route = useRoute();
const order = ref<(AdminOrder & { project?: any; participant?: any; user?: any }) | null>(null);
const loading = ref(false);
const refunding = ref(false);

const statusType = computed(() =>
  order.value
    ? order.value.status === 'confirmed'
      ? 'success'
      : order.value.status === 'refunded' || order.value.status === 'cancelled'
        ? 'info'
        : 'warning'
    : '',
);

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

<style scoped>
.block { margin-bottom: 20px; }
.block-head { display: flex; justify-content: space-between; align-items: center; }
.block-title { font-weight: 600; font-size: 15px; }
.price { color: #ef4444; font-weight: 700; }
.actions-card .action-btn { width: 100%; height: 44px; font-weight: 600; }
</style>
