<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

export interface FilterOption {
  id: string | number;
  label: string;
}

const props = defineProps({
  showPriority: { type: Boolean, default: true },
  showProjects: { type: Boolean, default: false },
  showStatus: { type: Boolean, default: false },
  priorityOptions: { type: Array as PropType<FilterOption[]>, default: () => [
    { id: 'faible', label: 'Faible' },
    { id: 'moyen', label: 'Moyen' },
    { id: 'élevé', label: 'Élevé' }
  ]},
  projectOptions: { type: Array as PropType<FilterOption[]>, default: () => [] },
  statusOptions: { type: Array as PropType<FilterOption[]>, default: () => [
    { id: 'à faire', label: 'À faire' },
    { id: 'en cours', label: 'En cours' },
    { id: 'terminé', label: 'Terminé' }
  ]},
  showTags: { type: Boolean, default: false },
  tagOptions: { type: Array as PropType<FilterOption[]>, default: () => [
    { id: 'bug', label: 'Bug' },
    { id: 'feature', label: 'Feature' },
    { id: 'improvement', label: 'Improvement' },
    { id: 'documentation', label: 'Documentation' },
    { id: 'design', label: 'Design' },
    { id: 'testing', label: 'Testing' },
    { id: 'deployment', label: 'Deployment' }
  ]}
})

const emit = defineEmits<{
  (e: 'update:filters', filters: { priorities: (string | number)[], projects: (string | number)[], statuses: (string | number)[], tags: (string | number)[] }): void
}>()

const selectedPriorities = ref<(string | number)[]>([])
const selectedProjects = ref<(string | number)[]>([])
const selectedStatuses = ref<(string | number)[]>([])
const selectedTags = ref<(string | number)[]>([])

const togglePriority = (id: string | number) => {
  const index = selectedPriorities.value.indexOf(id)
  if (index === -1) selectedPriorities.value.push(id)
  else selectedPriorities.value.splice(index, 1)
  emitFilters()
}

const toggleProject = (id: string | number) => {
  const index = selectedProjects.value.indexOf(id)
  if (index === -1) selectedProjects.value.push(id)
  else selectedProjects.value.splice(index, 1)
  emitFilters()
}

const toggleStatus = (id: string | number) => {
  const index = selectedStatuses.value.indexOf(id)
  if (index === -1) selectedStatuses.value.push(id)
  else selectedStatuses.value.splice(index, 1)
  emitFilters()
}

const toggleTag = (id: string | number) => {
  const index = selectedTags.value.indexOf(id)
  if (index === -1) selectedTags.value.push(id)
  else selectedTags.value.splice(index, 1)
  emitFilters()
}

const emitFilters = () => {
  emit('update:filters', {
    priorities: selectedPriorities.value,
    projects: selectedProjects.value,
    statuses: selectedStatuses.value,
    tags: selectedTags.value
  })
}

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
    <button 
      @click="toggleDropdown" 
      class="bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] text-main dark:text-gray-300 transition-all cursor-pointer flex items-center justify-center px-3 md:px-4 py-2 rounded-md whitespace-nowrap neo-emboss active:neo-inset hover:brightness-105"
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
      <div v-if="isOpen" class="neo-card absolute right-0 mt-2 w-64 max-h-96 overflow-y-auto custom-scrollbar bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-lg z-50 flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
        
        <!-- Priority Filter -->
        <div v-if="showPriority" class="p-3">
          <h3 class="text-xs font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-2">Priorité</h3>
          <div class="flex flex-col gap-2">
            <label v-for="priority in priorityOptions" :key="priority.id" class="flex items-center gap-2 cursor-pointer group" @click.prevent="togglePriority(priority.id)">
              <div class="relative flex items-center justify-center w-4 h-4 border rounded bg-canvas dark:bg-[#2A2A2D] group-hover:border-primary transition-colors" :class="selectedPriorities.includes(priority.id) ? 'border-primary dark:border-blue-500 bg-primary dark:bg-blue-500 text-white' : 'border-form-border dark:border-gray-600 text-transparent'">
                 <Icon name="heroicons:check" class="w-3 h-3" />
              </div>
              <span class="text-sm font-medium text-main dark:text-gray-300">{{ priority.label }}</span>
            </label>
            <div v-if="priorityOptions.length === 0" class="text-sm text-gray-400">Aucune option</div>
          </div>
        </div>

        <!-- Status Filter -->
        <div v-if="showStatus" class="p-3">
          <h3 class="text-xs font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-2">Statut</h3>
          <div class="flex flex-col gap-2">
            <label v-for="status in statusOptions" :key="status.id" class="flex items-center gap-2 cursor-pointer group" @click.prevent="toggleStatus(status.id)">
              <div class="relative flex items-center justify-center w-4 h-4 border rounded bg-canvas dark:bg-[#2A2A2D] group-hover:border-primary transition-colors" :class="selectedStatuses.includes(status.id) ? 'border-primary dark:border-blue-500 bg-primary dark:bg-blue-500 text-white' : 'border-form-border dark:border-gray-600 text-transparent'">
                 <Icon name="heroicons:check" class="w-3 h-3" />
              </div>
              <span class="text-sm font-medium text-main dark:text-gray-300">{{ status.label }}</span>
            </label>
            <div v-if="statusOptions.length === 0" class="text-sm text-gray-400">Aucune option</div>
          </div>
        </div>

        <!-- Tag Filter -->
        <div v-if="showTags" class="p-3">
          <h3 class="text-xs font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-2">Tags</h3>
          <div class="flex flex-col gap-2">
            <label v-for="tag in tagOptions" :key="tag.id" class="flex items-center gap-2 cursor-pointer group" @click.prevent="toggleTag(tag.id)">
              <div class="relative flex items-center justify-center w-4 h-4 border rounded bg-canvas dark:bg-[#2A2A2D] group-hover:border-primary transition-colors" :class="selectedTags.includes(tag.id) ? 'border-primary dark:border-blue-500 bg-primary dark:bg-blue-500 text-white' : 'border-form-border dark:border-gray-600 text-transparent'">
                 <Icon name="heroicons:check" class="w-3 h-3" />
              </div>
              <span class="text-sm font-medium text-main dark:text-gray-300">{{ tag.label }}</span>
            </label>
            <div v-if="tagOptions.length === 0" class="text-sm text-gray-400">Aucune option</div>
          </div>
        </div>

        <!-- Project Filter -->
        <div v-if="showProjects" class="p-3">
          <h3 class="text-xs font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-2">Projets</h3>
          <div class="flex flex-col gap-2">
            <label v-for="project in projectOptions" :key="project.id" class="flex items-center gap-2 cursor-pointer group" @click.prevent="toggleProject(project.id)">
              <div class="relative flex items-center justify-center w-4 h-4 border rounded bg-canvas dark:bg-[#2A2A2D] group-hover:border-primary transition-colors" :class="selectedProjects.includes(project.id) ? 'border-primary dark:border-blue-500 bg-primary dark:bg-blue-500 text-white' : 'border-form-border dark:border-gray-600 text-transparent'">
                 <Icon name="heroicons:check" class="w-3 h-3" />
              </div>
              <span class="text-sm font-medium text-main dark:text-gray-300 truncate" :title="project.label">{{ project.label }}</span>
            </label>
            <div v-if="projectOptions.length === 0" class="text-sm text-gray-400">Aucune option</div>
          </div>
        </div>

      </div>
    </Transition>
  </div>
</template>
