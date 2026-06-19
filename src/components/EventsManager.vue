<template>
  <div class="manager">
    <div class="header">
      <h2>活動管理</h2>
      <button class="btn-primary" @click="openCreateForm">新增活動</button>
    </div>

    <div v-if="loading">載入中...</div>
    <div v-else-if="events.length === 0" class="empty">目前沒有活動資料</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>日期</th>
          <th>標題</th>
          <th>小組</th>
          <th>類型</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="event in paginatedEvents" :key="event.id">
          <td>{{ event.date }}</td>
          <td>{{ event.title }}</td>
          <td>{{ groupName(event.group) }}</td>
          <td>{{ event.type }}</td>
          <td>
            <button class="btn-small" @click="openEditForm(event)">編輯</button>
            <button class="btn-small btn-danger" @click="handleDelete(event)">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <Pagination :current-page="currentPage" :total-pages="totalPages" @change="currentPage = $event" />

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <h3>{{ editingId ? '編輯活動' : '新增活動' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="field">
            <label>活動標題</label>
            <input v-model="form.title" required />
          </div>
          <div class="field">
            <label>活動日期</label>
            <input v-model="form.date" type="date" required />
          </div>
          <div class="field">
            <label>所屬小組</label>
            <select v-model="form.group" required>
              <option value="" disabled>請選擇</option>
              <option v-for="g in groups" :key="g.slug" :value="g.slug">{{ g.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>活動類型</label>
            <select v-model="form.type" required>
              <option value="" disabled>請選擇</option>
              <option v-for="t in eventTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="field">
            <label>地點（選填）</label>
            <input v-model="form.location" />
          </div>
          <div class="field">
            <label>簡介</label>
            <textarea v-model="form.description" required rows="3"></textarea>
          </div>
          <div class="field">
            <label>詳細內容（選填）</label>
            <textarea v-model="form.content" rows="6"></textarea>
          </div>
          <div class="field">
            <label>相關連結（選填）</label>
            <div v-for="(link, index) in form.links" :key="index" class="contact-row">
              <input v-model="link.label" placeholder="連結名稱" />
              <input v-model="link.url" placeholder="連結網址" />
              <button type="button" class="btn-remove" @click="removeLink(index)">移除</button>
            </div>
            <button type="button" class="btn-add" @click="addLink">+ 新增連結</button>
          </div>
          <div class="field">
            <label>報名連結（選填）</label>
            <input v-model="form.registration" />
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

const events = ref([]);
const groups = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref(null);
const submitting = ref(false);
const formError = ref('');
const currentPage = ref(1);
const pageSize = 10;

const totalPages = computed(() => Math.ceil(events.value.length / pageSize));
const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return events.value.slice(start, start + pageSize);
});

const eventTypes = ['招募', '演講', '競賽', '工作坊', '其他'];

const form = ref({
  title: '', date: '', group: '', type: '', location: '',
  description: '', content: '', links: [], registration: '',
});

const groupName = (slug) => {
  const g = groups.value.find(g => g.slug === slug);
  return g ? g.name : slug;
};

const addLink = () => form.value.links.push({ label: '', url: '' });
const removeLink = (index) => form.value.links.splice(index, 1);

const loadEvents = async () => {
  loading.value = true;
  currentPage.value = 1;
  try {
    const data = await api.getEvents();
    events.value = data.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadGroups = async () => {
  try {
    groups.value = await api.getGroups();
  } catch (e) {
    console.error(e);
  }
};

const openCreateForm = () => {
  editingId.value = null;
  form.value = { title: '', date: '', group: '', type: '', location: '', description: '', content: '', links: [], registration: '' };
  formError.value = '';
  showForm.value = true;
};

const openEditForm = (event) => {
  editingId.value = event.id;
  form.value = {
    title: event.title, date: event.date, group: event.group, type: event.type,
    location: event.location || '', description: event.description,
    content: event.content || '', links: (event.links || []).map(l => ({ ...l })),
    registration: event.registration || '',
  };
  formError.value = '';
  showForm.value = true;
};

const closeForm = () => { showForm.value = false; };

const handleSubmit = async () => {
  submitting.value = true;
  formError.value = '';
  try {
    const payload = { ...form.value, links: form.value.links.filter(l => l.label && l.url) };
    if (!payload.location) delete payload.location;
    if (!payload.content) delete payload.content;
    if (!payload.registration) delete payload.registration;
    if (payload.links.length === 0) delete payload.links;
    if (editingId.value) {
      await api.updateEvent(editingId.value, payload);
    } else {
      await api.createEvent(payload);
    }
    showForm.value = false;
    await loadEvents();
  } catch (e) {
    formError.value = e.message || '儲存失敗';
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (event) => {
  if (!confirm('確定要刪除這個活動嗎？')) return;
  try {
    await api.deleteEvent(event.id);
    await loadEvents();
  } catch (e) {
    alert(e.message || '刪除失敗');
  }
};

onMounted(() => { loadEvents(); loadGroups(); });
</script>

<style scoped>
.manager { padding: 2rem; color: white; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
h2 { font-size: 1.5rem; }
.empty { color: #94a3b8; padding: 2rem; text-align: center; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #2d3548; }
.data-table th { color: #94a3b8; font-size: 0.85rem; font-weight: 500; }
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
.field input, .field textarea, .field select { width: 100%; padding: 0.6rem 0.875rem; border-radius: 0.5rem; border: 1px solid #2d3548; background: #0f1422; color: white; font-size: 0.9rem; }
.field input:focus, .field textarea:focus, .field select:focus { outline: none; border-color: #3b82f6; }
.contact-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.contact-row input { flex: 1; }
.btn-remove { background: transparent; border: 1px solid #2d3548; color: #f87171; padding: 0 0.75rem; border-radius: 0.4rem; cursor: pointer; font-size: 0.8rem; }
.btn-add { background: transparent; border: 1px dashed #3b82f6; color: #3b82f6; padding: 0.4rem 0.875rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.85rem; width: 100%; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
.error { color: #f87171; font-size: 0.85rem; }
</style>