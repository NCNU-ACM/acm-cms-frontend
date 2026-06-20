<template>
  <div v-if="!isLoggedIn">
    <Login @login-success="handleLoginSuccess" />
  </div>

  <div v-else class="app-layout">
    <aside class="sidebar">
      <h1>NCNU ACM</h1>
      <nav>
        <button
          v-for="item in menuItems"
          :key="item.key"
          :class="{ active: currentView === item.key }"
          @click="currentView = item.key"
        >
          {{ item.label }}
        </button>
      </nav>
      <button class="logout-btn" @click="handleLogout">登出</button>
    </aside>

    <main class="content">
      <GroupsManager v-if="currentView === 'groups'" />
      <AnnouncementsManager v-else-if="currentView === 'announcements'" />
      <EventsManager v-else-if="currentView === 'events'" />
      <MembersManager v-else-if="currentView === 'members'" />
      <ShowcaseManager v-else-if="currentView === 'showcase'" />
    </main>
  </div>
</template>

<script setup>
import { api } from './api/client.js';
import { ref, onMounted, onUnmounted } from 'vue';
import Login from './components/Login.vue';
import GroupsManager from './components/GroupsManager.vue';
import EventsManager from './components/EventsManager.vue';
import MembersManager from './components/MembersManager.vue';
import ShowcaseManager from './components/ShowcaseManager.vue';
import AnnouncementsManager from './components/AnnouncementsManager.vue';
import { getToken, clearToken } from './api/client.js';

const isLoggedIn = ref(false);
const currentView = ref('groups');
let verifyInterval = null;

const menuItems = [
  { key: 'groups', label: '小組管理' },
  { key: 'events', label: '活動管理' },
  { key: 'members', label: '幹部管理' },
  { key: 'showcase', label: '成果展示管理' },
  { key: 'announcements', label: '通知管理' },
];

const handleLoginSuccess = () => {
  isLoggedIn.value = true;
};

const handleLogout = () => {
  clearToken();
  isLoggedIn.value = false;
};

const checkTokenValid = async () => {
  if (!getToken()) return;
  try {
    await api.verifyToken();
  } catch (e) {
    clearToken();
    window.location.reload();
  }
};

onMounted(() => {
  checkTokenValid();
  verifyInterval = setInterval(checkTokenValid, 5 * 60 * 1000);
});

onUnmounted(() => {
  if (verifyInterval) clearInterval(verifyInterval);
});
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, "Segoe UI", "Microsoft JhengHei", sans-serif;
}

.app-layout {
  display: flex;
  height: 100vh;
  background: #0a0e1a;
}

.sidebar {
  width: 220px;
  background: #161b2e;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
}

.sidebar h1 {
  color: #3b82f6;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  padding: 0 0.5rem;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.sidebar nav button {
  text-align: left;
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.7rem 0.875rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.sidebar nav button:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.sidebar nav button.active {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.logout-btn {
  background: transparent;
  border: 1px solid #2d3548;
  color: #94a3b8;
  padding: 0.6rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.logout-btn:hover {
  border-color: #f87171;
  color: #f87171;
}

.content {
  flex: 1;
  overflow-y: auto;
}
</style>