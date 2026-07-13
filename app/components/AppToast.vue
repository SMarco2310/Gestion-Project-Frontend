<script setup lang="ts">
import { useToast } from '~/composables/useToast'

// Access the global state
const { toasts, removeToast } = useToast()

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return 'heroicons:check-circle'
    case 'error': return 'heroicons:x-circle'
    case 'warning': return 'heroicons:exclamation-triangle'
    case 'info': return 'heroicons:information-circle'
    default: return 'heroicons:information-circle'
  }
}

const getColorClass = (type: string) => {
  switch (type) {
    case 'success': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20'
    case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    case 'info': return 'text-primary dark:text-blue-500 bg-blue-500/10 border-blue-500/20'
    default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
  }
}
</script>

<template>
  <!-- Fixed container at bottom right -->
  <div class="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
    <TransitionGroup 
      name="toast" 
      tag="div" 
      class="flex flex-col gap-3 items-end"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto bg-card dark:bg-[#222224] border shadow-xl rounded-lg p-4 w-full relative overflow-hidden transition-all duration-300 transform"
        :class="getColorClass(toast.type)"
        role="alert"
      >
        <div class="flex items-start gap-3">
          <Icon :name="getIcon(toast.type)" class="w-6 h-6 shrink-0" />
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-main dark:text-gray-200">{{ toast.title }}</h4>
            <p v-if="toast.message" class="text-xs text-secondary dark:text-gray-400 mt-1">{{ toast.message }}</p>
            <div v-if="toast.action" class="mt-2.5">
              <button 
                @click="toast.action.onClick(); removeToast(toast.id)"
                class="px-3 py-1.5 text-xs font-bold bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/40 rounded transition-colors"
              >
                {{ toast.action.label }}
              </button>
            </div>
          </div>
          <button @click="removeToast(toast.id)" class="shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <Icon name="heroicons:x-mark" class="w-4 h-4 text-main dark:text-gray-400" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Vue Transition Group Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
