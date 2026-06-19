<template>
  <div class="manager">
    <div class="header">
      <h2>成果展示管理</h2>
      <button class="btn-primary" @click="openCreateForm">新增項目</button>
    </div>

    <div class="filter">
      <label>篩選小組：</label>
      <select v-model="filterGroup" @change="loadShowcase">
        <option value="">全部</option>
        <option v-for="g in groups" :key="g.slug" :value="g.slug">{{ g.name }}</option>
      </select>
    </div>

    <div v-if="loading">載入中...</div>
    <div v-else-if="items.length === 0" class="empty">目前沒有成果展示資料</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>日期</th>
          <th>標題</th>
          <th>小組</th>
          <th>標籤</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in paginatedItems" :key="item.id">
          <td>{{ item.date }}</td>
          <td>{{ item.title }}</td>
          <td>{{ groupName(item.group) }}</td>
          <td>{{ (item.tags || []).join('、') || '無' }}</td>
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
        <h3>{{ editingId ? '編輯項目' : '新增成果展示項目' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="field">
            <label>項目標題</label>
            <input v-model="form.title" required />
          </div>
          <div class="field">
            <label>所屬小組</label>
            <select v-model="form.group" required>
              <option value="" disabled>請選擇</option>
              <option v-for="g in groups" :key="g.slug" :value="g.slug">{{ g.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>日期</label>
            <input v-model="form.date" type="date" required />
          </div>
          <div class="field">
            <label>簡介</label>
            <textarea v-model="form.description" required rows="3"></textarea>
          </div>
          <div class="field">
            <label>關聯活動（選填）</label>
            <select v-model="form.related_event">
              <option value="">無</option>
              <option v-for="e in events" :key="e.id" :value="e.id">
                {{ e.title }}（{{ e.date }}）
              </option>
            </select>
          </div>
          <div class="field">
            <label>封面圖網址（選填）</label>
            <input v-model="form.cover_image" placeholder="https://..." />
          </div>
          <div class="field">
            <label>圖集（選填）</label>
            <div v-for="(img, index) in form.gallery" :key="index" class="contact-row">
              <input v-model="form.gallery[index]" placeholder="圖片網址" />
              <button type="button" class="btn-remove" @click="removeGalleryImage(index)">移除</button>
            </div>
            <button type="button" class="btn-add" @click="addGalleryImage">+ 新增圖片</button>
          </div>
          <div class="field">
            <label>標籤（選填）</label>
            <div v-for="(tag, index) in form.tags" :key="index" class="contact-row">
              <input v-model="form.tags[index]" placeholder="標籤名稱" />
              <button type="button" class="btn-remove" @click="removeTag(index)">移除</button>
            </div>
            <button type="button" class="btn-add" @click="addTag">+ 新增標籤</button>
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
const groups = ref([]);
const events = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref(null);
const editingGroup = ref(null);
const submitting = ref(false);
const formError = ref('');
const filterGroup = ref('');
const currentPage = ref(1);
const pageSize = 10;

const totalPages = computed(() => Math.ceil(items.value.length / pageSize));
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return items.value.slice(start, start + pageSize);
});

const form = ref({
  title: '', group: '', date: '', description: '',
  related_event: '', cover_image: '', gallery: [], tags: [], links: [],
});

const groupName = (slug) => {
  const g = groups.value.find(g => g.slug === slug);
  return g ? g.name : slug;
};

const addTag = () => form.value.tags.push('');
const removeTag = (index) => form.value.tags.splice(index, 1);
const addLink = () => form.value.links.push({ label: '', url: '' });
const removeLink = (index) => form.value.links.splice(index, 1);
const addGalleryImage = () => form.value.gallery.push('');
const removeGalleryImage = (index) => form.value.gallery.splice(index, 1);

const loadShowcase = async () => {
  loading.value = true;
  currentPage.value = 1;
  try {
    items.value = await api.getShowcase(filterGroup.value || undefined);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadGroups = async () => {
  try { groups.value = await api.getGroups(); } catch (e) { console.error(e); }
};

const loadEvents = async () => {
  try { events.value = await api.getEvents(); } catch (e) { console.error(e); }
};

const openCreateForm = () => {
  editingId.value = null;
  editingGroup.value = null;
  form.value = { title: '', group: '', date: '', description: '', related_event: '', cover_image: '', gallery: [], tags: [], links: [] };
  formError.value = '';
  showForm.value = true;
};

const openEditForm = (item) => {
  editingId.value = item.id;
  editingGroup.value = item.group;
  form.value = {
    title: item.title, group: item.group, date: item.date, description: item.description,
    related_event: item.related_event || '', cover_image: item.cover_image || '',
    gallery: [...(item.gallery || [])], tags: [...(item.tags || [])],
    links: (item.links || []).map(l => ({ ...l })),
  };
  formError.value = '';
  showForm.value = true;
};

const closeForm = () => { showForm.value = false; };

const handleSubmit = async () => {
  submitting.value = true;
  formError.value = '';
  try {
    const payload = {
      ...form.value,
      tags: form.value.tags.filter(t => t.trim()),
      links: form.value.links.filter(l => l.label && l.url),
      gallery: form.value.gallery.filter(g => g.trim()),
    };
    if (payload.tags.length === 0) delete payload.tags;
    if (payload.links.length === 0) delete payload.links;
    if (payload.gallery.length === 0) delete payload.gallery;
    if (!payload.related_event) delete payload.related_event;
    if (!payload.cover_image) delete payload.cover_image;
    if (editingId.value) {
      await api.updateShowcase(editingGroup.value, editingId.value, payload);
    } else {
      await api.createShowcase(payload);
    }
    showForm.value = false;
    await loadShowcase();
  } catch (e) {
    formError.value = e.message || '儲存失敗';
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (item) => {
  if (!confirm('確定要刪除這個項目嗎？')) return;
  try {
    await api.deleteShowcase(item.group, item.id);
    await loadShowcase();
  } catch (e) {
    alert(e.message || '刪除失敗');
  }
};

onMounted(() => { loadShowcase(); loadGroups(); loadEvents(); });
</script>

<style scoped>
.manager { padding: 2rem; color: white; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
h2 { font-size: 1.5rem; }
.filter { margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
.filter label { color: #94a3b8; font-size: 0.9rem; }
.filter select { padding: 0.4rem 0.75rem; border-radius: 0.4rem; border: 1px solid #2d3548; background: #0f1422; color: white; }
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