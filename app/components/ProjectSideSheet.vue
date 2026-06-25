<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  projectId?: number|null|any
  startInEditMode?: boolean
}>()

const emit = defineEmits(['close'])

const close = () => {
  if (isEditing.value) {
    cancelEdit()
  } else {
    emit('close')
  }
}

const isEditing = ref(false)
const projectTitle = ref('Projet Refonte UI')
const projectDescription = ref(`Refonte complète de l'interface utilisateur de l'application principale. 
Ce projet inclut la mise en place du dark mode, de la nouvelle charte graphique, 
et l'optimisation des performances des composants front-end.`)
const editTitle = ref('')
const editDescription = ref('')

const startEditing = () => {
  editTitle.value = projectTitle.value
  editDescription.value = projectDescription.value
  isEditing.value = true
}

const saveEdit = () => {
  projectTitle.value = editTitle.value
  projectDescription.value = editDescription.value
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.startInEditMode) {
      startEditing()
    } else {
      isEditing.value = false
    }
  }
})

const isStatusDropdownOpen = ref(false)
const projectStatus = ref('EN COURS')

const statusConfig: Record<string, { label: string; colorClass: string }> = {
  'À FAIRE': { label: 'À FAIRE', colorClass: 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
  'EN COURS': { label: 'EN COURS', colorClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-500' },
  'TERMINÉ': { label: 'TERMINÉ', colorClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-500' }
}

const updateStatus = (status: string) => {
  projectStatus.value = status
  isStatusDropdownOpen.value = false
}
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div>
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[100] bg-black/60" @click="close"></div>
    </Transition>

    <!-- Side-sheet -->
    <Transition
      enter-active-class="transition transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div 
        v-if="isOpen" 
        class="fixed top-0 bottom-0 right-0 z-[110] w-full max-w-md md:max-w-xl bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <header class="flex items-center justify-between px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] shrink-0 z-10 relative">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-b from-blue-400 to-blue-500 neo-emboss flex items-center justify-center text-white">
              <Icon name="heroicons:briefcase" class="w-5 h-5" />
            </div>
            <div class="flex-1">
              <p class="text-xs font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">PROJ-101</p>
              <h2 v-if="!isEditing" class="text-lg font-bold text-main dark:text-gray-200 leading-tight">{{ projectTitle }}</h2>
              <input v-else v-model="editTitle" type="text" class="neo-input w-full text-lg font-bold text-main dark:text-gray-200 bg-transparent focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 rounded px-2 py-0.5 -ml-2" />
            </div>
          </div>
          
          <div class="flex items-center gap-2 shrink-0">
            <button v-if="!isEditing" @click="startEditing" class="p-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded transition-colors" title="Modifier">
              <Icon name="heroicons:pencil" class="w-6 h-6" />
            </button>
            <button v-if="!isEditing" class="p-2 text-secondary hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Supprimer">
              <Icon name="heroicons:trash" class="w-6 h-6" />
            </button>
            <button v-if="isEditing" @click="saveEdit" class="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white neo-emboss rounded transition-all text-sm font-medium hover:brightness-110 active:neo-inset"><Icon name="heroicons:check" class="w-4 h-4" /> Enregistrer</button>
            <button v-if="isEditing" @click="cancelEdit" class="flex items-center gap-1.5 px-3 py-1 bg-canvas dark:bg-gray-800 text-main dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-sm font-medium"><Icon name="heroicons:x-mark" class="w-4 h-4" /> Annuler</button>
            <button @click="close" class="p-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded transition-colors">
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
        </header>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          
          <div class="flex items-center gap-3 mb-8 relative">
            <button @click="isStatusDropdownOpen = !isStatusDropdownOpen" :class="['px-3 py-1 rounded-md neo-metallic font-bold text-sm flex items-center gap-1.5 hover:brightness-105 transition-colors', statusConfig[projectStatus]?.colorClass || '']">
              {{ statusConfig[projectStatus]?.label || projectStatus }} <Icon name="heroicons:chevron-down" class="w-4 h-4" />
            </button>
            <span class="text-sm text-secondary dark:text-gray-500 font-medium">Fin prévue: 15 Oct 2026</span>
            
            <!-- Dropdown Menu -->
            <div v-if="isStatusDropdownOpen" @click="isStatusDropdownOpen = false" class="fixed inset-0 z-40"></div>
            <div v-if="isStatusDropdownOpen" class="absolute left-0 top-8 mt-1 w-48 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1">
              <button @click="updateStatus(key as string)" v-for="(config, key) in statusConfig" :key="key" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', projectStatus === key ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800', config.colorClass]">
                {{ config.label }}
                <Icon v-if="projectStatus === key" name="heroicons:check" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-8">
            <h3 class="text-base font-bold text-main dark:text-gray-200 mb-2">Description</h3>
            <div v-if="!isEditing" @click="startEditing" class="text-secondary dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap cursor-text p-2 -ml-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              {{ projectDescription }}
            </div>
            <textarea v-else v-model="editDescription" class="w-full h-32 p-3 rounded-lg neo-input bg-[#F4F5F7] dark:bg-[#1A1A1D] text-main dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 resize-y custom-scrollbar"></textarea>
          </div>

          <!-- Progress -->
          <div class="mb-8 p-5 rounded-xl neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224]">
            <h3 class="text-sm font-bold text-main dark:text-gray-200 mb-4">Progression globale</h3>
            
            <div class="flex flex-col gap-4">
              <div>
                <div class="flex justify-between text-sm mb-1.5 font-medium">
                  <span class="text-secondary dark:text-gray-400">Tâches accomplies</span>
                  <span class="text-main dark:text-gray-200">75%</span>
                </div>
                <div class="w-full h-2 neo-input bg-[#E5E7EB] dark:bg-[#2A2A2D] rounded-lg overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-600 rounded-r-lg" style="width: 75%"></div>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between text-sm mb-1.5 font-medium">
                  <span class="text-secondary dark:text-gray-400">Tickets</span>
                  <span class="text-main dark:text-gray-200">30 total</span>
                </div>
                <div class="flex h-2 w-full gap-1 neo-input bg-[#E5E7EB] dark:bg-[#2A2A2D] rounded-lg overflow-hidden">
                  <div class="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-l-full" style="width: 40%" title="Terminés"></div>
                  <div class="bg-gradient-to-r from-blue-400 to-blue-500 h-full" style="width: 27%" title="En cours"></div>
                  <div class="bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 h-full rounded-r-full" style="width: 33%" title="À faire"></div>
                </div>
                <div class="flex justify-between text-[11px] font-bold text-secondary dark:text-gray-500 pt-2 uppercase tracking-wider">
                  <span class="text-emerald-600 dark:text-emerald-500">12 Terminés</span>
                  <span class="text-blue-600 dark:text-blue-400">8 En cours</span>
                  <span>10 À faire</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Team -->
          <div class="mb-8">
            <h3 class="text-base font-bold text-main dark:text-gray-200 mb-4">Équipe du projet</h3>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold text-white shadow">SY</div>
                <div>
                  <div class="text-sm font-bold text-main dark:text-gray-200">Sarah Yeung</div>
                  <div class="text-xs text-secondary dark:text-gray-500 font-medium">Chef de projet</div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white shadow">F</div>
                <div>
                  <div class="text-sm font-bold text-main dark:text-gray-200">François</div>
                  <div class="text-xs text-secondary dark:text-gray-500 font-medium">Développeur Backend</div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold text-white shadow">MS</div>
                <div>
                  <div class="text-sm font-bold text-main dark:text-gray-200">Marc-Etienne</div>
                  <div class="text-xs text-secondary dark:text-gray-500 font-medium">Développeur Frontend</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Activity / Comments (Placeholder) -->
          <div>
            <h3 class="text-base font-bold text-main dark:text-gray-200 mb-4">Activité récente</h3>
            <div class="border-l-2 border-form-border dark:border-gray-800 ml-3 pl-4 flex flex-col gap-5 py-2">
              <div class="relative">
                <div class="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-primary dark:bg-blue-600 ring-4 ring-card dark:ring-[#1D1D1D]"></div>
                <div class="text-sm font-medium text-main dark:text-gray-200">Mise en production Sprint 2</div>
                <div class="text-xs text-secondary dark:text-gray-500 mt-0.5">Il y a 2 jours par Sarah Yeung</div>
              </div>
              <div class="relative">
                <div class="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-card dark:ring-[#1D1D1D]"></div>
                <div class="text-sm font-medium text-main dark:text-gray-200">Validation des maquettes</div>
                <div class="text-xs text-secondary dark:text-gray-500 mt-0.5">Il y a 1 semaine par Marc-Etienne</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </Transition>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #52525b;
}
</style>
