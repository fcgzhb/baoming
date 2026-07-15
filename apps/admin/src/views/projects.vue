<template>
  <div>
    <div class="bm-page-header">
      <h2 class="bm-page-title"><el-icon><Suitcase /></el-icon>游学项目</h2>
      <el-button type="primary" round @click="goNew"><el-icon><Plus /></el-icon>新建项目</el-button>
    </div>

    <div class="bm-toolbar">
      <el-input v-model="query.q" placeholder="搜索项目标题" clearable style="width: 220px" :prefix-icon="Search" @keyup.enter="load(1)" @clear="load(1)" />
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 140px" @change="load(1)">
        <el-option v-for="(label, k) in STATUS_LABEL" :key="k" :label="label" :value="k" />
      </el-select>
      <el-button type="primary" plain @click="load(1)">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column label="价格" width="100" align="center">
        <template #default="{ row }"><span class="price">¥{{ row.price }}</span></template>
      </el-table-column>
      <el-table-column label="名额" width="130" align="center">
        <template #default="{ row }">
          <span :class="['quota', quotaClass(row)]">{{ row.registeredCount }} / {{ row.totalQuota }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="STATUS_TAG_TYPE[row.status as ProjectStatus]" effect="light" round>
            {{ STATUS_LABEL[row.status as ProjectStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="enrollDeadline" label="报名截止" width="170" />
      <el-table-column label="操作" width="280" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="goEdit(row.id)"><el-icon><Edit /></el-icon>编辑</el-button>
          <el-button v-if="row.status !== 'published'" link type="success" @click="onPublish(row)">上架</el-button>
          <el-button v-if="row.status === 'published'" link type="warning" @click="onOffline(row)">下架</el-button>
          <el-button link type="danger" @click="onDelete(row)"><el-icon><Delete /></el-icon>删除</el-button>
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
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Edit, Plus, Search, Suitcase } from '@element-plus/icons-vue';
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

const quotaClass = (row: Project) => {
  const ratio = row.totalQuota ? row.registeredCount / row.totalQuota : 0;
  if (ratio >= 1) return 'q-full';
  if (ratio >= 0.8) return 'q-warn';
  return 'q-ok';
};

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
.price { color: #ef4444; font-weight: 600; }
.quota { font-weight: 600; }
.q-ok { color: #10b981; }
.q-warn { color: #f59e0b; }
.q-full { color: #ef4444; }
</style>
