<template>
  <div class="manager">
    <div class="header">
      <h2>幹部管理</h2>
      <button class="btn-primary" @click="openCreateForm">新增幹部</button>
    </div>

    <div class="filter">
      <label>篩選學期：</label>
      <select v-model="filterSemester" @change="loadMembers">
        <option value="">全部</option>
        <option v-for="sem in semesters" :key="sem" :value="sem">{{ sem }}</option>
      </select>
    </div>

    <div v-if="loading">載入中...</div>
    <div v-else-if="members.length === 0" class="empty">目前沒有幹部資料</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>姓名</th>
          <th>小組</th>
          <th>職稱</th>
          <th>聯絡方式</th>
          <th>學期</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in paginatedMembers" :key="member.id">
          <td>{{ member.name }}</td>
          <td>{{ groupName(member.group) }}</td>
          <td>{{ member.role }}</td>
          <td>{{ (member.contact || []).map(c => c.label).join('、') || '無' }}</td>
          <td>{{ member.semester }}</td>
          <td>
            <button class="btn-small" @click="openEditForm(member)">編輯</button>
            <button class="btn-small btn-danger" @click="handleDelete(member)">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <Pagination :current-page="currentPage" :total-pages="totalPages" @change="currentPage = $event" />

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <h3>{{ editingId ? '編輯幹部' : '新增幹部' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="field">
            <label>學期</label>
            <div class="semester-selects">
              <select v-model="academicYear" :disabled="!!editingId">
                <option v-for="y in academicYears" :key="y" :value="y">{{ y }} 學年</option>
              </select>
              <select v-model="semesterPart" :disabled="!!editingId">
                <option value="1">上學期</option>
                <option value="2">下學期</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label>姓名</label>
            <input v-model="form.name" required />
          </div>
          <div class="field">
            <label>所屬小組</label>
            <select v-model="form.group">
              <option value="">無</option>
              <option v-for="g in groups" :key="g.slug" :value="g.slug">{{ g.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>職稱</label>
            <input v-model="form.role" required placeholder="例如：組長、副組長等" />
          </div>
          <div class="field">
            <label>自我介紹（選填）</label>
            <textarea v-model="form.bio" rows="3" placeholder="簡短的自我介紹"></textarea>
          </div>
          <div class="field">
            <label>頭像圖片網址（選填）</label>
            <input v-model="form.avatar" placeholder="https://..." />
          </div>
          <div class="field">
            <label>聯絡方式</label>
            <div v-for="(item, index) in form.contact" :key="index" class="contact-row">
              <input v-model="item.label" placeholder="平台名稱，例如 GitHub" />
              <input v-model="item.url" placeholder="連結網址" />
              <button type="button" class="btn-remove" @click="removeContact(index)">移除</button>
            </div>
            <button type="button" class="btn-add" @click="addContact">+ 新增聯絡方式</button>
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
import { ref, computed, onMounted, watch } from 'vue';
import { api } from '../api/client.js';
import Pagination from './Pagination.vue';

const currentYear = new Date().getFullYear() - 1911;
const academicYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const members = ref([]);
const groups = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref(null);
const editingSemester = ref(null);
const submitting = ref(false);
const formError = ref('');
const filterSemester = ref('');
const currentPage = ref(1);
const pageSize = 10;

const academicYear = ref(currentYear);
const semesterPart = ref('1');

const semesters = computed(() => {
  const set = new Set(members.value.map(m => m.semester));
  return Array.from(set).sort().reverse();
});

const totalPages = computed(() => Math.ceil(members.value.length / pageSize));
const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return members.value.slice(start, start + pageSize);
});

const form = ref({
  semester: `${currentYear}1`, name: '', group: '', role: '', bio: '', avatar: '', contact: [],
});

watch([academicYear, semesterPart], () => {
  form.value.semester = `${academicYear.value}${semesterPart.value}`;
}, { immediate: true });

const groupName = (slug) => {
  if (!slug) return '社團整體';
  const g = groups.value.find(g => g.slug === slug);
  return g ? g.name : slug;
};

const addContact = () => form.value.contact.push({ label: '', url: '' });
const removeContact = (index) => form.value.contact.splice(index, 1);

const loadMembers = async () => {
  loading.value = true;
  currentPage.value = 1;
  try {
    members.value = await api.getMembers(filterSemester.value || undefined);
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
  editingSemester.value = null;
  academicYear.value = currentYear;
  semesterPart.value = '1';
  form.value = { semester: `${currentYear}1`, name: '', group: '', role: '', bio: '', avatar: '', contact: [] };
  formError.value = '';
  showForm.value = true;
};

const openEditForm = (member) => {
  editingId.value = member.id;
  editingSemester.value = member.semester;
  academicYear.value = parseInt(member.semester.slice(0, -1));
  semesterPart.value = member.semester.slice(-1);
  form.value = {
    semester: member.semester, name: member.name, group: member.group || '',
    role: member.role, bio: member.bio || '', avatar: member.avatar || '',
    contact: (member.contact || []).map(c => ({ ...c })),
  };
  formError.value = '';
  showForm.value = true;
};

const closeForm = () => { showForm.value = false; };

const handleSubmit = async () => {
  submitting.value = true;
  formError.value = '';
  try {
    const payload = { ...form.value, contact: form.value.contact.filter(c => c.label && c.url) };
    if (!payload.group) delete payload.group;
    if (!payload.bio) delete payload.bio;
    if (!payload.avatar) delete payload.avatar;
    if (editingId.value) {
      await api.updateMember(editingSemester.value, editingId.value, payload);
    } else {
      await api.createMember(payload);
    }
    showForm.value = false;
    await loadMembers();
  } catch (e) {
    formError.value = e.message || '儲存失敗';
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (member) => {
  if (!confirm('確定要刪除這位幹部嗎？')) return;
  try {
    await api.deleteMember(member.semester, member.id);
    await loadMembers();
  } catch (e) {
    alert(e.message || '刪除失敗');
  }
};

onMounted(() => { loadMembers(); loadGroups(); });
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
.semester-selects { display: flex; gap: 0.5rem; }
.semester-selects select { flex: 1; }
.contact-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.contact-row input { flex: 1; }
.btn-remove { background: transparent; border: 1px solid #2d3548; color: #f87171; padding: 0 0.75rem; border-radius: 0.4rem; cursor: pointer; font-size: 0.8rem; }
.btn-add { background: transparent; border: 1px dashed #3b82f6; color: #3b82f6; padding: 0.4rem 0.875rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.85rem; width: 100%; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
.error { color: #f87171; font-size: 0.85rem; }
</style>