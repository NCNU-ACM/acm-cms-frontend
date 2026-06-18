<template>
  <div class="manager">
    <div class="header">
      <h2>活動管理</h2>
      <button class="btn-primary" @click="openCreateForm">新增活動</button>
    </div>

    <div class="filter">
      <label>篩選學期：</label>
      <select v-model="filterSemester" @change="loadEvents">
        <option value="">全部</option>
        <option v-for="sem in semesters" :key="sem" :value="sem">{{ sem }}</option>
      </select>
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
          <th>學期</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="event in events" :key="event.id">
          <td>{{ event.date }}</td>
          <td>{{ event.title }}</td>
          <td>{{ groupName(event.group) }}</td>
          <td>{{ event.type }}</td>
          <td>{{ event.semester }}</td>
          <td>
            <button class="btn-small" @click="openEditForm(event)">編輯</button>
            <button class="btn-small btn-danger" @click="handleDelete(event)">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <h3>{{ editingId ? '編輯活動' : '新增活動' }}</h3>
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
import { ref, onMounted, computed, watch } from 'vue';
import { api } from '../api/client.js';

const currentYear = new Date().getFullYear() - 1911;
const academicYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const events = ref([]);
const groups = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref(null);
const editingSemester = ref(null);
const submitting = ref(false);
const formError = ref('');
const filterSemester = ref('');

const academicYear = ref(currentYear);
const semesterPart = ref('1');

const eventTypes = ['招募', '演講', '競賽', '工作坊', '其他'];

const semesters = computed(() => {
  const set = new Set(events.value.map(e => e.semester));
  return Array.from(set).sort().reverse();
});

const form = ref({
  semester: `${currentYear}1`,
  title: '',
  date: '',
  group: '',
  type: '',
  location: '',
  description: '',
  registration: '',
});

watch([academicYear, semesterPart], () => {
  form.value.semester = `${academicYear.value}${semesterPart.value}`;
}, { immediate: true });

const groupName = (slug) => {
  const g = groups.value.find(g => g.slug === slug);
  return g ? g.name : slug;
};

const loadEvents = async () => {
  loading.value = true;
  try {
    events.value = await api.getEvents(filterSemester.value || undefined);
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
  form.value = { semester: `${currentYear}1`, title: '', date: '', group: '', type: '', location: '', description: '', registration: '' };
  formError.value = '';
  showForm.value = true;
};

const openEditForm = (event) => {
  editingId.value = event.id;
  editingSemester.value = event.semester;

  academicYear.value = parseInt(event.semester.slice(0, -1));
  semesterPart.value = event.semester.slice(-1);

  form.value = {
    semester: event.semester,
    title: event.title,
    date: event.date,
    group: event.group,
    type: event.type,
    location: event.location || '',
    description: event.description,
    registration: event.registration || '',
  };
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
    const payload = { ...form.value };
    if (!payload.location) delete payload.location;
    if (!payload.registration) delete payload.registration;

    if (editingId.value) {
      await api.updateEvent(editingSemester.value, editingId.value, payload);
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
    await api.deleteEvent(event.semester, event.id);
    await loadEvents();
  } catch (e) {
    alert(e.message || '刪除失敗');
  }
};

onMounted(() => {
  loadEvents();
  loadGroups();
});
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
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.5rem;
}

.filter {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter label {
  color: #94a3b8;
  font-size: 0.9rem;
}

.filter select {
  padding: 0.4rem 0.75rem;
  border-radius: 0.4rem;
  border: 1px solid #2d3548;
  background: #0f1422;
  color: white;
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

.field input, .field textarea, .field select {
  width: 100%;
  padding: 0.6rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid #2d3548;
  background: #0f1422;
  color: white;
  font-size: 0.9rem;
}

.field input:focus, .field textarea:focus, .field select:focus {
  outline: none;
  border-color: #3b82f6;
}

.semester-selects {
  display: flex;
  gap: 0.5rem;
}

.semester-selects select {
  flex: 1;
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