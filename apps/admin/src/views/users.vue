<template>
  <div>
    <div class="bm-page-header">
      <h2 class="bm-page-title"><el-icon><User /></el-icon>用户管理</h2>
    </div>

    <div class="bm-toolbar">
      <el-input v-model="query.q" placeholder="搜索昵称 / 手机号" clearable style="width: 240px" :prefix-icon="Search" @keyup.enter="load(1)" @clear="load(1)" />
      <el-button type="primary" plain @click="load(1)">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="昵称" min-width="140">
        <template #default="{ row }">{{ row.nickname || '-' }}</template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="150" />
      <el-table-column label="订单数" width="100" align="center">
        <template #default="{ row }"><el-tag type="info" effect="plain" round>{{ row.orderCount }}</el-tag></template>
      </el-table-column>
      <el-table-column label="注册时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right" align="center">
        <template #default="{ row }"><el-button link type="primary" @click="$router.push(`/users/${row.id}`)">详情</el-button></template>
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
import { Search, User } from '@element-plus/icons-vue';
import { listUsers, type AdminUser } from '../api/users';
import { formatDateTime } from '../utils/format';

const list = ref<AdminUser[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({ page: 1, size: 20, q: '' });

const load = async (page?: number) => {
  if (page) query.page = page;
  loading.value = true;
  try {
    const res = await listUsers(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};
onMounted(() => load(1));
</script>
