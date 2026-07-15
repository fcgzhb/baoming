<template>
  <div>
    <div class="bm-page-header">
      <h2 class="bm-page-title">
        <el-icon><Edit /></el-icon>{{ isEdit ? '编辑项目' : '新建项目' }}
      </h2>
      <el-button plain round @click="$router.back()">返回</el-button>
    </div>

    <el-card v-loading="loading" shadow="never" class="form-card">
      <el-form :model="form" label-width="120px" label-position="right">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" maxlength="128" show-word-limit />
        </el-form-item>

        <el-form-item label="封面图">
          <div class="cover-uploader">
            <el-upload :show-file-list="false" :before-upload="onCoverUpload" accept="image/jpeg,image/png,image/webp,image/gif">
              <img v-if="form.coverImageUrl" :src="form.coverImageUrl" class="cover-preview" />
              <div v-else class="cover-placeholder">
                <el-icon :size="28"><Plus /></el-icon>
                <span>点击上传封面</span>
              </div>
            </el-upload>
            <el-input v-model="form.coverImageUrl" placeholder="或直接填写图片 URL" style="margin-top: 12px" />
            <div class="cover-tip">支持 jpg/png/webp/gif，≤ 5MB</div>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价格(元)" required>
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总名额" required>
              <el-input-number v-model="form.totalQuota" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出发日期">
              <el-date-picker v-model="form.departureDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="返回日期">
              <el-date-picker v-model="form.returnDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="报名截止">
          <el-date-picker v-model="form.enrollDeadline" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 300px" />
        </el-form-item>

        <el-form-item label="图文介绍">
          <el-input v-model="form.description" type="textarea" :rows="6" placeholder="支持基础 HTML（将自动清洗）" />
        </el-form-item>

        <el-form-item label="行程安排">
          <el-input v-model="form.itinerary" type="textarea" :rows="6" />
        </el-form-item>

        <el-form-item label="状态">
          <el-alert type="info" :closable="false" show-icon>
            状态通过列表页的「上架/下架」操作变更，新建默认为草稿。
          </el-alert>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" round :loading="saving" @click="onSave">
            <el-icon><Check /></el-icon>保存
          </el-button>
          <el-button round @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Check, Edit, Plus } from '@element-plus/icons-vue';
import { createProject, getProject, updateProject } from '../api/projects';
import { uploadImage } from '../api/upload';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const saving = ref(false);
const uploading = ref(false);

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

const onCoverUpload = async (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 5MB');
    return false;
  }
  uploading.value = true;
  try {
    const res = await uploadImage(file);
    form.coverImageUrl = res.url;
    ElMessage.success('封面上传成功');
  } catch {
    // toast handled
  } finally {
    uploading.value = false;
  }
  return false;
};

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
.form-card { max-width: 880px; }
.cover-uploader { width: 100%; }
.cover-preview { width: 280px; height: 158px; object-fit: cover; border-radius: 12px; display: block; }
.cover-placeholder {
  width: 280px; height: 158px;
  border: 1px dashed #d1d5db; border-radius: 12px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  color: #9ca3af; cursor: pointer; transition: border-color 0.2s;
}
.cover-placeholder:hover { border-color: #2563eb; color: #2563eb; }
.cover-tip { font-size: 12px; color: #9ca3af; margin-top: 8px; }
</style>
