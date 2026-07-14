<template>
  <div>
    <div class="toolbar">
      <el-input v-model="query.q" placeholder="搜索项目标题" clearable style="width: 220px" @keyup.enter="load(1)" @clear="load(1)" />
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 140px" @change="load(1)">
        <el-option v-for="(label, k) in STATUS_LABEL" :key="k" :label="label" :value="k" />
      </el-select>
      <el-button type="primary" @click="load(1)">查询</el-button>
      <el-button type="success" @click="goNew">新建项目</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column label="价格" width="100">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column label="名额" width="120">
        <template #default="{ row }">{{ row.registeredCount }} / {{ row.totalQuota }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="STATUS_TAG_TYPE[row.status as ProjectStatus]">{{ STATUS_LABEL[row.status as ProjectStatus] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="enrollDeadline" label="报名截止" width="170" />
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-button link @click="goEdit(row.id)">编辑</el-button>
          <el-button v-if="row.status !== 'published'" link type="success" @click="onPublish(row)">上架</el-button>
          <el-button v-if="row.status === 'published'" link type="warning" @click="onOffline(row)">下架</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
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
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  STATUS_LABEL,
  STATUS_TAG_TYPE,
  deleteProject,
  listProjects,
  offlineProject,
  publishProject,
  type Project,
  type ProjectListQuery,
} from '../api/projects';
import type { ProjectStatus } from '@baoming/shared';

const router = useRouter();
const list = ref<Project[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive<ProjectListQuery>({ page: 1, size: 10, q: '', status: undefined });

const load = async (page?: number) => {
  if (page) query.page = page;
  loading.value = true;
  try {
    const res = await listProjects(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const goNew = () => router.push('/projects/new');
const goEdit = (id: string) => router.push(`/projects/${id}`);

const onPublish = async (row: Project) => {
  await publishProject(row.id);
  ElMessage.success('已上架');
  load();
};
const onOffline = async (row: Project) => {
  await offlineProject(row.id);
  ElMessage.success('已下架');
  load();
};
const onDelete = (row: Project) => {
  ElMessageBox.confirm(`确认删除项目「${row.title}」？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteProject(row.id);
      ElMessage.success('已删除');
      load();
    })
    .catch(() => {});
};

onMounted(() => load(1));
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
