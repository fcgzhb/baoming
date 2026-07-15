<template>
  <div>
    <div class="bm-page-header">
      <h2 class="bm-page-title"><el-icon><List /></el-icon>订单管理</h2>
    </div>

    <div class="bm-toolbar">
      <el-input v-model="query.orderNo" placeholder="订单号" clearable style="width: 180px" :prefix-icon="Search" @keyup.enter="load(1)" />
      <el-input v-model="query.phone" placeholder="参团人手机号" clearable style="width: 160px" @keyup.enter="load(1)" />
      <el-input v-model="query.name" placeholder="参团人姓名" clearable style="width: 140px" @keyup.enter="load(1)" />
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 130px" @change="load(1)">
        <el-option v-for="(label, k) in OrderStatusLabel" :key="k" :label="label" :value="k" />
      </el-select>
      <el-button type="primary" plain @click="load(1)">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="orderNo" label="订单号" min-width="180" show-overflow-tooltip />
      <el-table-column prop="projectTitle" label="项目" min-width="160" show-overflow-tooltip />
      <el-table-column prop="participantName" label="参团人" width="100" />
      <el-table-column prop="participantPhone" label="电话" width="130" />
      <el-table-column label="金额" width="100" align="center">
        <template #default="{ row }"><span class="price">¥{{ row.amount }}</span></template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" effect="light" round>{{ OrderStatusLabel[row.status as OrderStatus] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="退款" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.refundStatus" size="small" :type="refundTagType(row.refundStatus)" effect="plain">
            {{ REFUND_STATUS_LABEL[row.refundStatus as RefundStatus] }}
          </el-tag>
          <span v-else class="muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push(`/orders/${row.id}`)">详情</el-button>
          <el-button v-if="row.status === 'confirmed'" link type="warning" @click="onRefund(row)">退款</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="bm-pager"
      background
      layout="total, prev, pager, next"
      :total="total"
      :page-size="query.size!"
      :current-page="query.page!"
      @current-change="(p: number) => load(p)"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { List, Search } from '@element-plus/icons-vue';
import {
  OrderStatusLabel,
  REFUND_STATUS_LABEL,
  listOrders,
  refundOrder,
  type AdminOrder,
  type AdminOrderListQuery,
} from '../api/orders';
import type { OrderStatus, RefundStatus } from '@baoming/shared';
import { formatDateTime } from '../utils/format';

const list = ref<AdminOrder[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive<AdminOrderListQuery>({ page: 1, size: 20, status: undefined, orderNo: '', phone: '', name: '' });

const statusTag = (s: OrderStatus) =>
  s === 'confirmed' ? 'success' : s === 'refunded' ? 'info' : s === 'cancelled' ? 'info' : 'warning';
const refundTagType = (r: RefundStatus) =>
  r === 'success' ? 'success' : r === 'failed' ? 'danger' : 'warning';

const load = async (page?: number) => {
  if (page) query.page = page;
  loading.value = true;
  try {
    const res = await listOrders(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const onRefund = (row: AdminOrder) => {
  ElMessageBox.confirm(`确认对订单「${row.orderNo}」发起全额退款？`, '退款确认', {
    type: 'warning',
    confirmButtonText: '确认退款',
    cancelButtonText: '取消',
  })
    .then(async () => {
      await refundOrder(row.id);
      ElMessage.success('退款已发起，等待微信回调');
      load();
    })
    .catch(() => {});
};

onMounted(() => load(1));
</script>

<style scoped>
.price { color: #ef4444; font-weight: 600; }
.muted { color: #9ca3af; }
</style>
