<template>
  <div v-if="totalPages > 1" class="pagination">
    <button class="page-btn" @click="$emit('change', currentPage - 1)" :disabled="currentPage === 1">‹</button>
    <button
      v-for="page in displayedPages"
      :key="page"
      class="page-btn"
      :class="{ active: page === currentPage, ellipsis: page === '...' }"
      :disabled="page === '...'"
      @click="typeof page === 'number' && $emit('change', page)"
    >
      {{ page }}
    </button>
    <button class="page-btn" @click="$emit('change', currentPage + 1)" :disabled="currentPage === totalPages">›</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  currentPage: number;
  totalPages: number;
}>();

defineEmits<{ change: [page: number] }>();

const displayedPages = computed(() => {
  const pages: (number | string)[] = [];
  const total = props.totalPages;
  const current = props.currentPage;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  pages.push(1);
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
});
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 1.5rem;
}

.page-btn {
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  border-radius: 0.4rem;
  border: 1px solid #2d3548;
  background: transparent;
  color: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled):not(.ellipsis) {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.page-btn.active {
  background: rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
  color: #60a5fa;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-btn.ellipsis {
  cursor: default;
  border-color: transparent;
}
</style>