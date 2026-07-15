<template>
  <div class="dashboard">
    <div class="bm-page-header">
      <h2 class="bm-page-title"><el-icon><HomeFilled /></el-icon>工作台</h2>
    </div>

    <el-row :gutter="20" class="stats">
      <el-col :xs="12" :sm="6">
        <div class="bm-stat">
          <div class="stat-top"><span class="bm-stat-label">游学项目</span><el-icon class="stat-ic blue"><Suitcase /></el-icon></div>
          <div class="bm-stat-val">{{ stats.projects }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="bm-stat">
          <div class="stat-top"><span class="bm-stat-label">报名订单</span><el-icon class="stat-ic green"><List /></el-icon></div>
          <div class="bm-stat-val">{{ stats.orders }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="bm-stat">
          <div class="stat-top"><span class="bm-stat-label">注册用户</span><el-icon class="stat-ic purple"><User /></el-icon></div>
          <div class="bm-stat-val">{{ stats.users }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="bm-stat">
          <div class="stat-top"><span class="bm-stat-label">待支付</span><el-icon class="stat-ic orange"><Clock /></el-icon></div>
          <div class="bm-stat-val">{{ stats.pending }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :sm="12">
        <el-card shadow="never" class="quick">
          <template #header><span class="quick-title">快捷操作</span></template>
          <div class="quick-grid">
            <div class="quick-item" @click="$router.push('/projects/new')">
              <div class="qi-ic blue"><el-icon><Plus /></el-icon></div>
              <span>新建项目</span>
            </div>
            <div class="quick-item" @click="$router.push('/projects')">
              <div class="qi-ic green"><el-icon><Suitcase /></el-icon></div>
              <span>项目管理</span>
            </div>
            <div class="quick-item" @click="$router.push('/orders')">
              <div class="qi-ic orange"><el-icon><List /></el-icon></div>
              <span>订单管理</span>
            </div>
            <div class="quick-item" @click="$router.push('/users')">
              <div class="qi-ic purple"><el-icon><User /></el-icon></div>
              <span>用户管理</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card shadow="never" class="quick">
          <template #header><span class="quick-title">系统说明</span></template>
          <ul class="info-list">
            <li>默认账号 admin / admin123（请尽快修改）</li>
            <li>项目需「上架」后小程序才可见</li>
            <li>仅「已报名」订单可发起退款（全额原路退回）</li>
            <li>微信支付/退款需配置商户号与 HTTPS 回调域名</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { Clock, HomeFilled, List, Plus, Suitcase, User } from '@element-plus/icons-vue';
import { request } from '../api/request';

const stats = reactive({ projects: 0, orders: 0, users: 0, pending: 0 });

onMounted(async () => {
  try {
    const [p, u] = await Promise.all([
      request.get<unknown, { total: number }>('/projects', { params: { size: 1 } }),
      request.get<unknown, { total: number }>('/users', { params: { size: 1 } }),
    ]);
    stats.projects = p.total;
    stats.users = u.total;
  } catch {
    // ignore - stats are best-effort
  }
});
</script>

<style scoped>
.stats { margin-bottom: 0; }
.stat-top { display: flex; justify-content: space-between; align-items: center; }
.stat-ic { font-size: 22px; padding: 8px; border-radius: 10px; }
.stat-ic.blue { background: #eff5fe; color: #2563eb; }
.stat-ic.green { background: #ecfdf5; color: #10b981; }
.stat-ic.purple { background: #f5f3ff; color: #7c3aed; }
.stat-ic.orange { background: #fff7ed; color: #f59e0b; }

.quick :deep(.el-card__header) { padding: 16px 20px; font-weight: 600; }
.quick-title { font-size: 15px; font-weight: 600; }
.quick-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.quick-item {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 20px 8px; border-radius: 12px; cursor: pointer;
  background: #f7f9fc; transition: all 0.2s;
}
.quick-item:hover { background: #eff5fe; transform: translateY(-2px); }
.qi-ic { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; color: #fff; }
.qi-ic.blue { background: linear-gradient(135deg, #2563eb, #4f8bff); }
.qi-ic.green { background: linear-gradient(135deg, #10b981, #34d399); }
.qi-ic.orange { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.qi-ic.purple { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
.quick-item span { font-size: 13px; color: #4b5563; }

.info-list { margin: 0; padding-left: 18px; color: #6b7280; font-size: 14px; line-height: 2; }
</style>
