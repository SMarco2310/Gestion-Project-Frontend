<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}>()

const emit = defineEmits(['close', 'confirm'])

const close = () => {
  emit('close')
}

const confirm = () => {
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" @click.self="close">
        <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] w-full max-w-md max-h-full rounded-xl flex flex-col overflow-hidden shadow-2xl" role="dialog" aria-modal="true">
          
          <!-- Header -->
          <div class="px-6 py-4 flex justify-between items-center shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] z-10 relative shrink-0">
            <div class="flex items-center gap-2 text-primary dark:text-primary">
              <Icon name="heroicons:information-circle" class="w-6 h-6" />
              <h2 class="text-xl font-bold">{{ title }}</h2>
            </div>
            <button @click="close" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5">
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6">
            <p class="text-sm text-secondary dark:text-gray-300 leading-relaxed whitespace-pre-line">{{ message }}</p>
          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)] flex justify-end gap-3 bg-gray-50 dark:bg-[#222224] z-10 relative shrink-0">
            <button @click="close" class="px-4 py-2 rounded-lg text-sm font-bold text-secondary dark:text-gray-300 hover:text-main dark:hover:text-white transition-colors">
              {{ cancelText || 'Annuler' }}
            </button>
            <button 
              @click="confirm" 
              class="px-5 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Icon name="heroicons:trash" class="w-4 h-4" />
              {{ confirmText || 'Confirmer' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
