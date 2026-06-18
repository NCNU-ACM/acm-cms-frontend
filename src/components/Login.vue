<template>
  <div class="login-container">
    <div class="login-box">
      <h1>NCNU ACM 後台管理</h1>
      <form @submit.prevent="handleLogin">
        <div class="field">
          <label>帳號</label>
          <input v-model="username" type="text" required />
        </div>
        <div class="field">
          <label>密碼</label>
          <input v-model="password" type="password" required />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="loading">
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { api, setToken } from '../api/client.js';

const emit = defineEmits(['login-success']);

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  try {
    const result = await api.login(username.value, password.value);
    setToken(result.token);
    emit('login-success');
  } catch (e) {
    error.value = e.message || '登入失敗';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #0a0e1a;
}

.login-box {
  background: #161b2e;
  padding: 2.5rem;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
}

h1 {
  color: white;
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.field {
  margin-bottom: 1rem;
}

label {
  display: block;
  color: #94a3b8;
  font-size: 0.875rem;
  margin-bottom: 0.375rem;
}

input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid #2d3548;
  background: #0f1422;
  color: white;
  font-size: 0.95rem;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
}

button {
  width: 100%;
  padding: 0.7rem;
  border-radius: 0.5rem;
  border: none;
  background: #3b82f6;
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

button:hover:not(:disabled) {
  background: #2563eb;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #f87171;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}
</style>