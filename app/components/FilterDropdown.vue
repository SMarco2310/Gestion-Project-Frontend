<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const props = defineProps({
  showPriority: { type: Boolean, default: true },
  showProjects: { type: Boolean, default: false },
  showStatus: { type: Boolean, default: false }
})

// Placeholders for filter options based on user feedback
const priorities = ref([
  { id: 'high', label: 'Haute', checked: false },
  { id: 'medium', label: 'Moyenne', checked: false },
  { id: 'low', label: 'Basse', checked: false },
])

const projects = ref([
  { id: 'p1', label: 'Projet Refonte UI (PRJ-101)', checked: false },
  { id: 'p2', label: 'Migration BDD (PRJ-102)', checked: false },
  { id: 'p3', label: 'API Authentification (PRJ-103)', checked: false },
])

const statuses = ref([
  { id: 'todo', label: 'À faire', checked: false },
  { id: 'inprogress', label: 'En cours', checked: false },
  { id: 'done', label: 'Terminé', checked: false },
])

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = (event: MouseEvent) => {
  if (isOpen.value && dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', closeDropdown)
})
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <!-- Trigger Button -->
    <button 
      @click="toggleDropdown" 
      class="bg-card dark:bg-[#222224] text-main dark:text-gray-300 border border-form-border dark:border-gray-700 hover:bg-canvas dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center px-3 md:px-4 py-2 rounded-md whitespace-nowrap shadow-sm"
      :class="{ 'ring-2 ring-primary dark:ring-blue-500': isOpen }"
    >
      <Icon name="heroicons:adjustments-horizontal" class="w-5 h-5 text-secondary dark:text-gray-400" /> 
      <span class="px-2 hidden md:inline font-medium tracking-wide">Filtrer</span>
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="isOpen" class="absolute right-0 mt-2 w-64 bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col divide-y divide-form-border dark:divide-gray-800">
        
        <!-- Priority Filter -->
        <div v-if="showPriority" class="p-3">
          <h3 class="text-xs font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-2">Priorité</h3>
          <div class="flex flex-col gap-2">
            <label v-for="priority in priorities" :key="priority.id" class="flex items-center gap-2 cursor-pointer group">
              <div class="relative flex items-center justify-center w-4 h-4 border rounded bg-canvas dark:bg-[#2A2A2D] group-hover:border-primary transition-colors" :class="priority.checked ? 'border-primary dark:border-blue-500 bg-primary dark:bg-blue-500 text-white' : 'border-form-border dark:border-gray-600 text-transparent'">
                 <input type="checkbox" v-model="priority.checked" class="absolute opacity-0 cursor-pointer w-full h-full" />
                 <Icon name="heroicons:check" class="w-3 h-3" />
              </div>
              <span class="text-sm font-medium text-main dark:text-gray-300">{{ priority.label }}</span>
            </label>
          </div>
        </div>

        <!-- Status Filter -->
        <div v-if="showStatus" class="p-3">
          <h3 class="text-xs font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-2">Statut</h3>
          <div class="flex flex-col gap-2">
            <label v-for="status in statuses" :key="status.id" class="flex items-center gap-2 cursor-pointer group">
              <div class="relative flex items-center justify-center w-4 h-4 border rounded bg-canvas dark:bg-[#2A2A2D] group-hover:border-primary transition-colors" :class="status.checked ? 'border-primary dark:border-blue-500 bg-primary dark:bg-blue-500 text-white' : 'border-form-border dark:border-gray-600 text-transparent'">
                 <input type="checkbox" v-model="status.checked" class="absolute opacity-0 cursor-pointer w-full h-full" />
                 <Icon name="heroicons:check" class="w-3 h-3" />
              </div>
              <span class="text-sm font-medium text-main dark:text-gray-300">{{ status.label }}</span>
            </label>
          </div>
        </div>

        <!-- Project Filter -->
        <div v-if="showProjects" class="p-3">
          <h3 class="text-xs font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-2">Projets</h3>
          <div class="flex flex-col gap-2">
            <label v-for="project in projects" :key="project.id" class="flex items-center gap-2 cursor-pointer group">
              <div class="relative flex items-center justify-center w-4 h-4 border rounded bg-canvas dark:bg-[#2A2A2D] group-hover:border-primary transition-colors" :class="project.checked ? 'border-primary dark:border-blue-500 bg-primary dark:bg-blue-500 text-white' : 'border-form-border dark:border-gray-600 text-transparent'">
                 <input type="checkbox" v-model="project.checked" class="absolute opacity-0 cursor-pointer w-full h-full" />
                 <Icon name="heroicons:check" class="w-3 h-3" />
              </div>
              <span class="text-sm font-medium text-main dark:text-gray-300 truncate" :title="project.label">{{ project.label }}</span>
            </label>
          </div>
        </div>

      </div>
    </Transition>
  </div>
</template>
