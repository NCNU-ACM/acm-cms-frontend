<template>
  <div class="manager">
    <div class="header">
      <h2>全體通知管理</h2>
      <button class="btn-primary" @click="openCreateForm">新增通知</button>
    </div>

    <div v-if="loading">載入中...</div>
    <div v-else-if="items.length === 0" class="empty">目前沒有通知資料</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>日期</th>
          <th>標題</th>
          <th>顯示中</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in paginatedItems" :key="item.id">
          <td>{{ item.date }}</td>
          <td>{{ item.title }}</td>
          <td>
            <span :class="item.active ? 'badge-active' : 'badge-inactive'">
              {{ item.active ? '是' : '否' }}
            </span>
          </td>
          <td>
            <button class="btn-small" @click="openEditForm(item)">編輯</button>
            <button class="btn-small btn-danger" @click="handleDelete(item)">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <Pagination :current-page="currentPage" :total-pages="totalPages" @change="currentPage = $event" />

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <h3>{{ editingId ? '編輯通知' : '新增通知' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="field">
            <label>標題</label>
            <input v-model="form.title" required />
          </div>
          <div class="field">
            <label>日期</label>
            <input v-model="form.date" type="date" required />
          </div>
          <div class="field">
            <label>通知內容</label>
            <textarea v-model="form.content" required rows="5"></textarea>
          </div>
          <div class="field">
            <label class="checkbox-label">
              <input v-model="form.active" type="checkbox" />
              顯示在官網上
            </label>
          </div>
          <p v-if="formError" class="error">{{ formError }}</p>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeForm">取消</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? '儲存中...' : '儲存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../api/client.js';
import Pagination from './Pagination.vue';

const items = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref(null);
const submitting = ref(false);
const formError = ref('');
const currentPage = ref(1);
const pageSize = 10;

const totalPages = computed(() => Math.ceil(items.value.length / pageSize));
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return items.value.slice(start, start + pageSize);
});

const form = ref({ title: '', date: '', content: '', active: false });

const loadItems = async () => {
  loading.value = true;
  currentPage.value = 1;
  try {
    const data = await api.getAnnouncements();
    items.value = data.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const openCreateForm = () => {
  editingId.value = null;
  form.value = { title: '', date: '', content: '', active: false };
  formError.value = '';
  showForm.value = true;
};

const openEditForm = (item) => {
  editingId.value = item.id;
  form.value = { title: item.title, date: item.date, content: item.content, active: item.active };
  formError.value = '';
  showForm.value = true;
};

const closeForm = () => { showForm.value = false; };

const handleSubmit = async () => {
  submitting.value = true;
  formError.value = '';
  try {
    if (editingId.value) {
      await api.updateAnnouncement(editingId.value, form.value);
    } else {
      await api.createAnnouncement(form.value);
    }
    showForm.value = false;
    await loadItems();
  } catch (e) {
    formError.value = e.message || '儲存失敗';
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (item) => {
  if (!confirm('確定要刪除這則通知嗎？')) return;
  try {
    await api.deleteAnnouncement(item.id);
    await loadItems();
  } catch (e) {
    alert(e.message || '刪除失敗');
  }
};

onMounted(loadItems);
</script>

<style scoped>
.manager { padding: 2rem; color: white; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
h2 { font-size: 1.5rem; }
.empty { color: #94a3b8; padding: 2rem; text-align: center; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #2d3548; }
.data-table th { color: #94a3b8; font-size: 0.85rem; font-weight: 500; }
.badge-active { color: #34d399; font-size: 0.85rem; }
.badge-inactive { color: #94a3b8; font-size: 0.85rem; }
.btn-primary { background: #3b82f6; color: white; border: none; padding: 0.5rem 1.25rem; border-radius: 0.5rem; cursor: pointer; }
.btn-primary:hover { background: #2563eb; }
.btn-secondary { background: transparent; color: #94a3b8; border: 1px solid #2d3548; padding: 0.5rem 1.25rem; border-radius: 0.5rem; cursor: pointer; }
.btn-small { font-size: 0.8rem; padding: 0.3rem 0.75rem; border-radius: 0.4rem; border: 1px solid #2d3548; background: transparent; color: white; cursor: pointer; margin-right: 0.5rem; }
.btn-danger { border-color: #f87171; color: #f87171; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #161b2e; padding: 2rem; border-radius: 0.75rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal h3 { margin-bottom: 1.25rem; }
.field { margin-bottom: 1rem; }
.field label { display: block; color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.375rem; }
.field input, .field textarea { width: 100%; padding: 0.6rem 0.875rem; border-radius: 0.5rem; border: 1px solid #2d3548; background: #0f1422; color: white; font-size: 0.9rem; }
.field input:focus, .field textarea:focus { outline: none; border-color: #3b82f6; }
.checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: white; font-size: 0.95rem; }
.checkbox-label input[type="checkbox"] { width: auto; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
.error { color: #f87171; font-size: 0.85rem; }
</style>