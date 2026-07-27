<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  isOpen: boolean
  projectName: string
}>()

const emit = defineEmits(['close', 'confirm'])

const confirmationInput = ref('')

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    confirmationInput.value = ''
  }
})

const isMatch = computed(() => confirmationInput.value === props.projectName)

const close = () => {
  emit('close')
}

const confirm = () => {
  if (isMatch.value) {
    emit('confirm')
  }
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
        <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] w-full max-w-md max-h-full rounded-xl flex flex-col overflow-hidden shadow-2xl border border-red-500/20" role="dialog" aria-modal="true">
          
          <!-- Header -->
          <div class="px-6 py-4 flex justify-between items-center shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
            <div class="flex items-center gap-2 text-red-600 dark:text-red-500">
              <Icon name="heroicons:exclamation-triangle" class="w-6 h-6" />
              <h2 class="text-xl font-bold">Supprimer le projet</h2>
            </div>
            <button @click="close" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5">
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>

          <!-- Body / Form -->
          <div class="p-6 overflow-y-auto custom-scrollbar">
            <p class="text-sm text-secondary dark:text-gray-300 mb-4 leading-relaxed">
              Cette action est <span class="font-bold text-main dark:text-white">irréversible</span>. 
              Cela supprimera définitivement le projet <span class="font-bold text-main dark:text-white">{{ projectName }}</span> ainsi que toutes les tâches et données associées.
            </p>
            
            <div class="mb-2">
              <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">
                Veuillez taper <span class="font-bold font-mono bg-[#E5E7EB] dark:bg-[#1A1A1D] px-1.5 py-0.5 rounded text-red-500 border border-gray-300 dark:border-gray-700 select-all">{{ projectName }}</span> pour confirmer.
              </label>
              <input 
                v-model="confirmationInput" 
                type="text" 
                class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white placeholder-secondary dark:placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 transition-all"
                :class="isMatch ? 'focus:ring-emerald-500/50 border-emerald-500/50' : 'focus:ring-red-500/50'"
                :placeholder="projectName"
              />
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)] flex justify-end gap-3 bg-gray-50 dark:bg-[#222224] z-10 relative">
            <button @click="close" class="px-4 py-2 rounded-lg text-sm font-bold text-secondary dark:text-gray-300 hover:text-main dark:hover:text-white transition-colors">
              Annuler
            </button>
            <button 
              @click="confirm" 
              :disabled="!isMatch"
              class="px-5 py-2 rounded-lg text-sm font-bold text-white transition-all flex items-center gap-2"
              :class="isMatch ? 'bg-red-600 hover:bg-red-700 shadow-md cursor-pointer' : 'bg-red-400 dark:bg-red-900/50 cursor-not-allowed opacity-70'"
            >
              <Icon name="heroicons:trash" class="w-4 h-4" />
              Supprimer ce projet
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
