<template>
  <div v-loading="loading">
    <div class="bm-page-header">
      <h2 class="bm-page-title"><el-icon><User /></el-icon>用户详情</h2>
      <el-button plain round @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20" v-if="user">
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="profile-card">
          <div class="profile-avatar">{{ (user.nickname || '游')[0] }}</div>
          <div class="profile-name">{{ user.nickname || '游学用户' }}</div>
          <div class="profile-phone">{{ user.phone || '未绑定手机号' }}</div>
          <el-divider />
          <div class="profile-meta">
            <div class="pm-row"><span class="pm-label">用户 ID</span><span>{{ user.id }}</span></div>
            <div class="pm-row"><span class="pm-label">注册时间</span><span>{{ user.createdAt }}</span></div>
            <div class="pm-row"><span class="pm-label">订单总数</span><span class="pm-count">{{ user.orderCount }}</span></div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="16">
        <el-card shadow="never" class="block">
          <template #header><span class="block-title">最近订单</span></template>
          <el-table :data="user.orders ?? []" border size="small">
            <el-table-column prop="orderNo" label="订单号" min-width="180" show-overflow-tooltip />
            <el-table-column label="金额" width="100"><template #default="{ row }">¥{{ row.amount }}</template></el-table-column>
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column prop="createdAt" label="创建时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { User } from '@element-plus/icons-vue';
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

<style scoped>
.profile-card { text-align: center; }
.profile-avatar {
  width: 88px; height: 88px; border-radius: 50%;
  margin: 16px auto 12px;
  background: linear-gradient(135deg, #4f8bff, #2dd4bf);
  color: #fff; font-size: 40px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.profile-name { font-size: 20px; font-weight: 700; }
.profile-phone { color: #9ca3af; font-size: 14px; margin-top: 4px; }
.pm-row { display: flex; justify-content: space-between; padding: 10rpx 0; padding: 10px 0; font-size: 14px; }
.pm-label { color: #9ca3af; }
.pm-count { font-weight: 700; color: #2563eb; }
.block { margin-bottom: 20px; }
.block-title { font-weight: 600; font-size: 15px; }
</style>
