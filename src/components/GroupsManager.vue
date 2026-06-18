<template>
  <div class="manager">
    <div class="header">
      <h2>小組管理</h2>
      <button class="btn-primary" @click="openCreateForm">新增小組</button>
    </div>

    <div v-if="loading">載入中...</div>
    <div v-else-if="groups.length === 0" class="empty">目前沒有小組資料</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>名稱</th>
          <th>網址代稱</th>
          <th>一句話介紹</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="group in groups" :key="group.slug">
          <td>{{ group.name }}</td>
          <td>{{ group.slug }}</td>
          <td>{{ group.tagline }}</td>
          <td>
            <button class="btn-small" @click="openEditForm(group)">編輯</button>
            <button class="btn-small btn-danger" @click="handleDelete(group.slug)">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <h3>{{ editingSlug ? '編輯小組' : '新增小組' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="field">
            <label>小組名稱</label>
            <input v-model="form.name" required />
          </div>
          <div class="field">
            <label>網址代稱（英文，例如 system）</label>
            <input v-model="form.slug" required :disabled="!!editingSlug" />
          </div>
          <div class="field">
            <label>一句話介紹</label>
            <input v-model="form.tagline" required />
          </div>
          <div class="field">
            <label>詳細說明</label>
            <textarea v-model="form.description" required rows="3"></textarea>
          </div>
          <div class="field">
            <label>主題色</label>
            <input v-model="form.color" type="color" />
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
import { ref, onMounted } from 'vue';
import { api } from '../api/client.js';

const groups = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editingSlug = ref(null);
const submitting = ref(false);
const formError = ref('');

const form = ref({
  name: '',
  slug: '',
  order: 1,
  tagline: '',
  description: '',
  color: '#3b82f6',
});

const loadGroups = async () => {
  loading.value = true;
  try {
    const data = await api.getGroups();
    groups.value = data.sort((a, b) => a.order - b.order);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const openCreateForm = () => {
  editingSlug.value = null;
  const nextOrder = groups.value.length > 0
    ? Math.max(...groups.value.map(g => g.order)) + 1
    : 1;
  form.value = { name: '', slug: '', order: nextOrder, tagline: '', description: '', color: '#3b82f6' };
  formError.value = '';
  showForm.value = true;
};

const openEditForm = (group) => {
  editingSlug.value = group.slug;
  form.value = { ...group };
  formError.value = '';
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
};

const handleSubmit = async () => {
  submitting.value = true;
  formError.value = '';
  try {
    if (editingSlug.value) {
      await api.updateGroup(editingSlug.value, form.value);
    } else {
      await api.createGroup(form.value);
    }
    showForm.value = false;
    await loadGroups();
  } catch (e) {
    formError.value = e.message || '儲存失敗';
  } finally {
    submitting.value = false;
  }
};

const reorderAfterDelete = async () => {
  const sorted = [...groups.value].sort((a, b) => a.order - b.order);
  for (let i = 0; i < sorted.length; i++) {
    const newOrder = i + 1;
    if (sorted[i].order !== newOrder) {
      await api.updateGroup(sorted[i].slug, { ...sorted[i], order: newOrder });
    }
  }
  await loadGroups();
};

const handleDelete = async (slug) => {
  if (!confirm('確定要刪除這個小組嗎？')) return;
  try {
    await api.deleteGroup(slug);
    await loadGroups();
    await reorderAfterDelete();
  } catch (e) {
    alert(e.message || '刪除失敗');
  }
};

onMounted(loadGroups);
</script>

<style scoped>
.manager {
  padding: 2rem;
  color: white;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 1.5rem;
}

.empty {
  color: #94a3b8;
  padding: 2rem;
  text-align: center;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #2d3548;
}

.data-table th {
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #2d3548;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.btn-small {
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border-radius: 0.4rem;
  border: 1px solid #2d3548;
  background: transparent;
  color: white;
  cursor: pointer;
  margin-right: 0.5rem;
}

.btn-danger {
  border-color: #f87171;
  color: #f87171;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #161b2e;
  padding: 2rem;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-bottom: 1.25rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  color: #94a3b8;
  font-size: 0.85rem;
  margin-bottom: 0.375rem;
}

.field input, .field textarea {
  width: 100%;
  padding: 0.6rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid #2d3548;
  background: #0f1422;
  color: white;
  font-size: 0.9rem;
}

.field input:focus, .field textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.field input[type="color"] {
  height: 40px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.error {
  color: #f87171;
  font-size: 0.85rem;
}
</style>