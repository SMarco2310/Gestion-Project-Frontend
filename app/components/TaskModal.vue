<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
  taskId?: string|any|null
}>()

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

const activeTab = ref('comments')

const isEditing = ref(false)
const taskTitle = ref('Write Sprint 3 report — goal, completed stories, velocity, retrospective notes')
const taskDescription = ref('Ajouter une description...')
const editTitle = ref('')
const editDescription = ref('')

const startEditing = () => {
  editTitle.value = taskTitle.value
  editDescription.value = taskDescription.value
  isEditing.value = true
}

const saveEdit = () => {
  taskTitle.value = editTitle.value
  taskDescription.value = editDescription.value
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}

const isStatusDropdownOpen = ref(false)
const taskStatus = ref('TERMINÉ')

const statusConfig: Record<string, { label: string; colorClass: string }> = {
  'À FAIRE': { label: 'À FAIRE', colorClass: 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
  'EN COURS': { label: 'EN COURS', colorClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-500' },
  'TERMINÉ': { label: 'TERMINÉ', colorClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-500' }
}

const updateStatus = (status: string) => {
  taskStatus.value = status
  isStatusDropdownOpen.value = false
}
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60" @click.self="close">
        <div 
          class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] w-full max-w-[1200px] h-[100dvh] md:h-[90vh] rounded-none md:rounded-xl flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          <!-- Header -->
          <header class="flex items-center justify-between px-6 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] shrink-0 z-10 relative">
            <div class="flex items-center gap-3 text-secondary dark:text-gray-400 font-medium text-sm">
              <Icon name="ph:bookmark-simple-fill" class="text-emerald-500 w-4 h-4" />
              <span class="hover:underline cursor-pointer">SAMS-80</span>
              <span>/</span>
              <Icon name="ph:bookmark-simple-fill" class="text-emerald-500 w-4 h-4" />
              <span class="hover:underline cursor-pointer">SAMS-70</span>
            </div>
            
            <div class="flex items-center gap-1 sm:gap-2 shrink-0">
              <button class="hidden sm:flex p-1.5 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded transition-colors"><Icon name="heroicons:lock-closed" class="w-5 h-5" /></button>
              <button class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-canvas dark:bg-gray-800 text-main dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-sm"><Icon name="heroicons:eye" class="w-4 h-4" /> 1</button>
              <button class="hidden sm:flex p-1.5 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded transition-colors"><Icon name="heroicons:share" class="w-5 h-5" /></button>
              <button v-if="!isEditing" @click="startEditing" class="p-1.5 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded transition-colors" title="Modifier"><Icon name="heroicons:pencil" class="w-5 h-5" /></button>
              <button v-if="!isEditing" class="p-1.5 text-secondary hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Supprimer"><Icon name="heroicons:trash" class="w-5 h-5" /></button>
              <button v-if="isEditing" @click="saveEdit" class="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white neo-emboss rounded transition-all text-xs sm:text-sm font-medium hover:brightness-110 active:neo-inset"><Icon name="heroicons:check" class="w-4 h-4" /> <span class="hidden sm:inline">Enregistrer</span></button>
              <button v-if="isEditing" @click="cancelEdit" class="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-canvas dark:bg-gray-800 text-main dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-xs sm:text-sm font-medium"><Icon name="heroicons:x-mark" class="w-4 h-4" /> <span class="hidden sm:inline">Annuler</span></button>
              <div class="hidden sm:block w-px h-6 bg-black/10 dark:bg-white/10 mx-1"></div>
              <button @click="close" class="p-1.5 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded transition-colors"><Icon name="heroicons:x-mark" class="w-6 h-6" /></button>
            </div>
          </header>

          <!-- Content Layout -->
          <div class="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden custom-scrollbar">
            <!-- Main Column (Left) -->
            <div class="flex-1 md:overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar shrink-0">
              <h1 v-if="!isEditing" class="text-2xl sm:text-3xl font-bold text-main dark:text-gray-200 mb-6 leading-tight">
                {{ taskTitle }}
              </h1>
              <input v-else v-model="editTitle" type="text" class="neo-input w-full text-2xl sm:text-3xl font-bold text-main dark:text-gray-200 mb-6 bg-transparent focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 rounded-lg py-2 px-3 -ml-3" />
              
              <div class="flex items-center gap-2 mb-8">
                <button class="p-1.5 bg-canvas dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-main dark:text-gray-300 rounded transition-colors"><Icon name="heroicons:plus" class="w-4 h-4" /></button>
                <button class="p-1.5 bg-canvas dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-main dark:text-gray-300 rounded transition-colors"><Icon name="heroicons:ellipsis-horizontal" class="w-4 h-4" /></button>
              </div>

              <div class="mb-8">
                <h3 class="text-base font-bold text-main dark:text-gray-200 mb-2">Description</h3>
                <div v-if="!isEditing" @click="startEditing" class="p-4 rounded-lg neo-input bg-[#F4F5F7] dark:bg-[#1A1A1D] text-secondary dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 cursor-text transition-colors whitespace-pre-wrap min-h-[60px]">
                  {{ taskDescription }}
                </div>
                <textarea v-else v-model="editDescription" class="w-full h-32 p-4 rounded-lg neo-input bg-[#F4F5F7] dark:bg-[#1A1A1D] text-main dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 resize-y custom-scrollbar"></textarea>
              </div>

              <!-- Subtasks -->
              <div class="mb-8">
                <h3 class="text-base font-bold text-main dark:text-gray-200 mb-2">Sous-tâches</h3>
                <div class="flex items-center justify-between mb-2">
                  <div class="w-full h-1.5 neo-input bg-[#E5E7EB] dark:bg-[#2A2A2D] rounded-full overflow-hidden mr-4">
                    <div class="bg-emerald-500 h-full w-[60%]"></div>
                  </div>
                  <span class="text-xs font-bold text-secondary dark:text-gray-500 whitespace-nowrap">60% Fait</span>
                </div>
                
                <div class="flex flex-col gap-2 mt-4">
                  <!-- Dummy Subtasks -->
                  <div class="flex items-center justify-between p-2 hover:bg-canvas dark:hover:bg-gray-800 rounded border border-transparent hover:border-form-border dark:hover:border-gray-700 transition-colors cursor-pointer group">
                    <div class="flex items-center gap-3">
                      <Icon name="ph:bookmark-simple-fill" class="text-emerald-500 w-4 h-4" />
                      <span class="text-secondary dark:text-gray-400 text-sm font-medium">SAMS-12</span>
                      <span class="text-main dark:text-gray-300 text-sm">Rédiger le résumé du sprint</span>
                    </div>
                    <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span class="px-2 py-0.5 neo-metallic bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-500 rounded text-xs font-bold">TERMINÉ</span>
                      <div class="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-bold text-white">SY</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between p-2 hover:bg-canvas dark:hover:bg-gray-800 rounded border border-transparent hover:border-form-border dark:hover:border-gray-700 transition-colors cursor-pointer group">
                    <div class="flex items-center gap-3">
                      <Icon name="ph:bookmark-simple-fill" class="text-emerald-500 w-4 h-4" />
                      <span class="text-secondary dark:text-gray-400 text-sm font-medium">SAMS-13</span>
                      <span class="text-main dark:text-gray-300 text-sm">Compiler les métriques de vélocité</span>
                    </div>
                    <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span class="px-2 py-0.5 neo-metallic bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-500 rounded text-xs font-bold">EN COURS</span>
                      <div class="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] font-bold text-white">F</div>
                    </div>
                  </div>
                </div>
                
                <button class="mt-2 text-primary dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
                  <Icon name="heroicons:plus" class="w-4 h-4" /> Ajouter une sous-tâche
                </button>
              </div>

              <!-- Linked items -->
              <div class="mb-8">
                <h3 class="text-base font-bold text-main dark:text-gray-200 mb-2">Éléments liés</h3>
                <button class="text-primary dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
                  <Icon name="heroicons:plus" class="w-4 h-4" /> Lier un élément
                </button>
              </div>

              <!-- Activity -->
              <div>
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-base font-bold text-main dark:text-gray-200">Activité</h3>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-secondary dark:text-gray-500 font-medium">Afficher:</span>
                    <button class="text-sm font-medium text-main dark:text-gray-300 bg-canvas dark:bg-gray-800 px-2 py-1 rounded">Tous</button>
                    <button class="text-sm font-medium text-white bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 neo-emboss px-3 py-1 rounded">Commentaires</button>
                    <button class="text-sm font-medium text-main dark:text-gray-300 bg-canvas dark:bg-gray-800 px-2 py-1 rounded">Historique</button>
                  </div>
                </div>

                <!-- Add Comment Input -->
                <div class="flex gap-4">
                  <div class="w-8 h-8 rounded-full bg-red-600 shrink-0 flex items-center justify-center text-xs font-bold text-white mt-1">MS</div>
                  <div class="flex-1 rounded-lg overflow-hidden neo-input bg-[#F4F5F7] dark:bg-[#1A1A1D] transition-colors focus-within:ring-1 focus-within:ring-primary dark:focus-within:ring-blue-500">
                    <textarea class="w-full bg-transparent p-3 text-sm text-main dark:text-gray-200 focus:outline-none resize-none" rows="2" placeholder="Ajouter un commentaire..."></textarea>
                    <div class="px-3 py-2 border-t border-black/5 dark:border-white/5 flex items-center gap-4 text-xs font-medium text-secondary dark:text-gray-400">
                      <button class="hover:text-main dark:hover:text-gray-200 flex items-center gap-1"><Icon name="heroicons:hand-thumb-up" class="w-4 h-4" /> Super !</button>
                      <button class="hover:text-main dark:hover:text-gray-200 flex items-center gap-1"><Icon name="heroicons:hand-raised" class="w-4 h-4" /> Besoin d'aide ?</button>
                      <button class="hover:text-main dark:hover:text-gray-200 flex items-center gap-1"><Icon name="heroicons:minus-circle" class="w-4 h-4" /> C'est bloqué</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar (Right) -->
            <div class="w-full md:w-[320px] shrink-0 shadow-none md:shadow-[-2px_0_10px_rgba(0,0,0,0.02)] md:overflow-y-auto p-4 sm:p-6 custom-scrollbar border-t md:border-t-0 border-form-border dark:border-gray-800">
              
              <!-- Status Dropdown -->
              <div class="mb-6 flex gap-2">
                <div class="relative w-full">
                  <button @click="isStatusDropdownOpen = !isStatusDropdownOpen" :class="['flex items-center justify-between gap-2 px-3 py-1.5 neo-metallic rounded font-bold text-sm w-full hover:brightness-105 transition-colors', statusConfig[taskStatus]?.colorClass || '']">
                    {{ statusConfig[taskStatus]?.label || taskStatus }} <Icon name="heroicons:chevron-down" class="w-4 h-4" />
                  </button>
                  
                  <!-- Dropdown Menu -->
                  <div v-if="isStatusDropdownOpen" @click="isStatusDropdownOpen = false" class="fixed inset-0 z-40"></div>
                  <div v-if="isStatusDropdownOpen" class="absolute left-0 top-full mt-1 w-full bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1">
                    <button @click="updateStatus(key as string)" v-for="(config, key) in statusConfig" :key="key" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', taskStatus === key ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800', config.colorClass]">
                      {{ config.label }}
                      <Icon v-if="taskStatus === key" name="heroicons:check" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button class="p-1.5 rounded neo-emboss bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] text-secondary dark:text-gray-400 hover:brightness-105 active:neo-inset transition-colors shrink-0">
                  <Icon name="heroicons:bolt" class="w-5 h-5" />
                </button>
              </div>

              <!-- Details Accordion -->
              <div class="mb-6">
                <button class="flex items-center justify-between w-full font-bold text-main dark:text-gray-200 mb-4 group">
                  <span class="flex items-center gap-2"><Icon name="heroicons:chevron-down" class="w-4 h-4 text-secondary dark:text-gray-500" /> Détails</span>
                  <Icon name="heroicons:adjustments-horizontal" class="w-4 h-4 text-secondary dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                <div class="flex flex-col gap-4 text-sm">
                  <!-- Property -->
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium pt-1">Assigné à</div>
                    <div class="col-span-2">
                      <div class="flex items-center gap-2 mb-1">
                        <div class="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-bold text-white">SY</div>
                        <span class="text-main dark:text-gray-300 font-medium">Sarah Yeung</span>
                      </div>
                      <button class="text-primary dark:text-blue-400 hover:underline text-xs">M'assigner</button>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium">Étiquettes</div>
                    <div class="col-span-2 text-main dark:text-gray-300">Aucune</div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium">Parent</div>
                    <div class="col-span-2 flex items-center gap-1.5">
                      <Icon name="heroicons:rectangle-group" class="w-4 h-4 text-purple-500" />
                      <span class="text-main dark:text-gray-300 hover:underline cursor-pointer">SAMS-80</span>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium">Échéance</div>
                    <div class="col-span-2 text-main dark:text-gray-300">Aucune</div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium">Équipe</div>
                    <div class="col-span-2 text-main dark:text-gray-300">Aucune</div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium">Début</div>
                    <div class="col-span-2 text-main dark:text-gray-300">Aucun</div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium">Sprint</div>
                    <div class="col-span-2 text-primary dark:text-blue-400 hover:underline cursor-pointer">Sprint 3 - Demo</div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium">Rapporteur</div>
                    <div class="col-span-2 flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold text-white">MS</div>
                      <span class="text-main dark:text-gray-300 font-medium">Marc-Etienne SOSSOU</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Divider -->
              <div class="w-full h-px bg-black/5 dark:bg-white/5 my-4"></div>
              
              <!-- Development -->
              <div class="mb-4">
                <button class="flex items-center gap-2 font-bold text-main dark:text-gray-200">
                  <Icon name="heroicons:chevron-right" class="w-4 h-4 text-secondary dark:text-gray-500" /> Développement
                </button>
              </div>

              <!-- Divider -->
              <div class="w-full h-px bg-black/5 dark:bg-white/5 my-4"></div>

              <!-- Timestamps -->
              <div class="text-xs text-secondary dark:text-gray-500 flex flex-col gap-1 mt-6">
                <div>Créé le 12 avril 2026 à 18:56</div>
                <div>Mis à jour il y a 2 jours</div>
                <div>Résolu il y a 2 jours</div>
              </div>

            </div>
          </div>
        </div>
      </div>
      </Transition>
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
