<template>
  <div>
    <el-page-header :content="isEdit ? '编辑项目' : '新建项目'" @back="$router.back()" />
    <el-form v-loading="loading" :model="form" label-width="120px" style="max-width: 760px; margin-top: 16px">
      <el-form-item label="标题" required>
        <el-input v-model="form.title" maxlength="128" />
      </el-form-item>
      <el-form-item label="封面图 URL">
        <el-input v-model="form.coverImageUrl" placeholder="https://..." />
      </el-form-item>
      <el-form-item label="价格(元)" required>
        <el-input-number v-model="form.price" :min="0" :precision="2" />
      </el-form-item>
      <el-form-item label="总名额" required>
        <el-input-number v-model="form.totalQuota" :min="1" />
      </el-form-item>
      <el-form-item label="出发日期">
        <el-date-picker v-model="form.departureDate" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="返回日期">
        <el-date-picker v-model="form.returnDate" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="报名截止">
        <el-date-picker v-model="form.enrollDeadline" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" />
      </el-form-item>
      <el-form-item label="图文介绍">
        <el-input v-model="form.description" type="textarea" :rows="6" />
      </el-form-item>
      <el-form-item label="行程安排">
        <el-input v-model="form.itinerary" type="textarea" :rows="6" />
      </el-form-item>
      <el-form-item>
        <span class="muted">状态通过列表页的「上架/下架」操作变更，新建默认为草稿。</span>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
        <el-button @click="$router.back()">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createProject, getProject, updateProject } from '../api/projects';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const saving = ref(false);

const form = reactive({
  title: '',
  coverImageUrl: '',
  price: 0,
  totalQuota: 10,
  departureDate: '',
  returnDate: '',
  enrollDeadline: '',
  description: '',
  itinerary: '',
});

onMounted(async () => {
  if (!isEdit.value) return;
  loading.value = true;
  try {
    const p = await getProject(route.params.id as string);
    Object.assign(form, {
      title: p.title,
      coverImageUrl: p.coverImageUrl ?? '',
      price: Number(p.price),
      totalQuota: p.totalQuota,
      departureDate: p.departureDate ?? '',
      returnDate: p.returnDate ?? '',
      enrollDeadline: p.enrollDeadline ?? '',
      description: p.description ?? '',
      itinerary: p.itinerary ?? '',
    });
  } finally {
    loading.value = false;
  }
});

const onSave = async () => {
  if (!form.title) {
    ElMessage.warning('请填写标题');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      title: form.title,
      coverImageUrl: form.coverImageUrl || undefined,
      price: Number(form.price),
      totalQuota: Number(form.totalQuota),
      departureDate: form.departureDate || undefined,
      returnDate: form.returnDate || undefined,
      enrollDeadline: form.enrollDeadline || undefined,
      description: form.description || undefined,
      itinerary: form.itinerary || undefined,
    };
    if (isEdit.value) {
      await updateProject(route.params.id as string, payload);
    } else {
      await createProject(payload);
    }
    ElMessage.success('已保存');
    router.back();
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.muted { color: #909399; font-size: 13px; }
</style>
