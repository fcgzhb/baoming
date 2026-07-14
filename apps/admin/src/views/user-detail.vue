<template>
  <div v-loading="loading">
    <el-page-header content="用户详情" @back="$router.back()" />
    <el-descriptions v-if="user" :column="2" border style="margin-top: 16px">
      <el-descriptions-item label="ID">{{ user.id }}</el-descriptions-item>
      <el-descriptions-item label="昵称">{{ user.nickname || '-' }}</el-descriptions-item>
      <el-descriptions-item label="手机号">{{ user.phone || '-' }}</el-descriptions-item>
      <el-descriptions-item label="注册时间">{{ user.createdAt }}</el-descriptions-item>
    </el-descriptions>
    <h4 style="margin-top: 24px">最近订单</h4>
    <el-table :data="user?.orders ?? []" border size="small">
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="amount" label="金额" width="100" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="createdAt" label="创建时间" width="180" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getUser, type AdminUser } from '../api/users';

const route = useRoute();
const user = ref<(AdminUser & { orders: any[] }) | null>(null);
const loading = ref(false);

const load = async () => {
  loading.value = true;
  try {
    user.value = await getUser(route.params.id as string);
  } finally {
    loading.value = false;
  }
};
onMounted(load);
</script>
