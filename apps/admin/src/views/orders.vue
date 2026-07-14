<template>
  <div>
    <div class="toolbar">
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 130px" @change="load(1)">
        <el-option v-for="(label, k) in OrderStatusLabel" :key="k" :label="label" :value="k" />
      </el-select>
      <el-input v-model="query.orderNo" placeholder="订单号" clearable style="width: 180px" @keyup.enter="load(1)" />
      <el-input v-model="query.phone" placeholder="参团人手机号" clearable style="width: 160px" @keyup.enter="load(1)" />
      <el-input v-model="query.name" placeholder="参团人姓名" clearable style="width: 140px" @keyup.enter="load(1)" />
      <el-button type="primary" @click="load(1)">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="projectTitle" label="项目" min-width="160" />
      <el-table-column prop="participantName" label="参团人" width="100" />
      <el-table-column prop="participantPhone" label="电话" width="130" />
      <el-table-column label="金额" width="100"><template #default="{ row }">¥{{ row.amount }}</template></el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ OrderStatusLabel[row.status as OrderStatus] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="退款" width="100">
        <template #default="{ row }">
          <span v-if="row.refundStatus">{{ REFUND_STATUS_LABEL[row.refundStatus as RefundStatus] }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link @click="$router.push(`/orders/${row.id}`)">详情</el-button>
          <el-button v-if="row.status === 'confirmed'" link type="warning" @click="onRefund(row)">退款</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="pager"
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
import {
  OrderStatusLabel,
  REFUND_STATUS_LABEL,
  listOrders,
  refundOrder,
  type AdminOrder,
  type AdminOrderListQuery,
} from '../api/orders';
import type { OrderStatus, RefundStatus } from '@baoming/shared';

const list = ref<AdminOrder[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive<AdminOrderListQuery>({ page: 1, size: 20, status: undefined, orderNo: '', phone: '', name: '' });

const statusType = (s: OrderStatus) =>
  s === 'confirmed' ? 'success' : s === 'refunded' ? 'info' : s === 'cancelled' ? 'warning' : '';

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
  ElMessageBox.confirm(`确认对订单「${row.orderNo}」发起全额退款？`, '退款确认', { type: 'warning' })
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
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
