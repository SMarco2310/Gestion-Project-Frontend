<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  totalItems: number
  itemsPerPage: number
}>()

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
}>()

const totalPages = computed(() => Math.ceil(props.totalItems / props.itemsPerPage))

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const maxVisible = 5
  
  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    let start = Math.max(1, props.currentPage - 2)
    let end = Math.min(totalPages.value, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (end < totalPages.value) {
      if (end < totalPages.value - 1) pages.push('...')
      pages.push(totalPages.value)
    }
  }
  
  return pages
})

const goToPage = (page: number | string) => {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
    emit('update:currentPage', page)
  }
}

const nextPage = () => {
  if (props.currentPage < totalPages.value) emit('update:currentPage', props.currentPage + 1)
}

const prevPage = () => {
  if (props.currentPage > 1) emit('update:currentPage', props.currentPage - 1)
}
</script>

<template>
  <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-form-border dark:border-gray-800 mt-6 w-full">
    <div class="text-sm text-secondary dark:text-gray-400">
      Affichage de <span class="font-medium text-main dark:text-white">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> à <span class="font-medium text-main dark:text-white">{{ Math.min(currentPage * itemsPerPage, totalItems) }}</span> sur <span class="font-medium text-main dark:text-white">{{ totalItems }}</span> résultats
    </div>
    
    <div class="flex items-center gap-2">
      <button 
        @click="prevPage" 
        :disabled="currentPage === 1"
        class="p-2 rounded-xl border border-form-border dark:border-gray-800 text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Icon name="heroicons:chevron-left" class="w-5 h-5" />
      </button>
      
      <div class="flex items-center gap-1">
        <template v-for="(page, index) in visiblePages" :key="index">
          <span v-if="page === '...'" class="px-2 text-secondary dark:text-gray-500">...</span>
          <button 
            v-else
            @click="goToPage(page)"
            class="w-10 h-10 flex items-center justify-center rounded-xl font-medium transition-all"
            :class="[
              currentPage === page 
                ? 'bg-cyan-600 text-white shadow-md shadow-primary/20 neo-emboss' 
                : 'text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white border border-transparent hover:border-form-border dark:hover:border-gray-800'
            ]"
          >
            {{ page }}
          </button>
        </template>
      </div>
      
      <button 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
        class="p-2 rounded-xl border border-form-border dark:border-gray-800 text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Icon name="heroicons:chevron-right" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
