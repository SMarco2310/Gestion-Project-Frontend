<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'custom'
})

const { activeWorkspace, updateWorkspace, deleteWorkspace, setActiveWorkspace } = useWorkspaces()
const { activeOrganization } = useOrganizations()
const { addToast } = useToast()

const form = ref({
  name: '',
  description: '',
  kanban_columns: ['À faire', 'En cours', 'Terminé'] as string[],
  kanban_colors: ['#FFB78C', '#8CA8F9', '#A6C4FF'] as string[],
})

onMounted(() => {
  if (activeWorkspace.value) {
    form.value.name = activeWorkspace.value.name
    form.value.description = activeWorkspace.value.description || ''
    if (activeWorkspace.value.kanban_columns) form.value.kanban_columns = [...activeWorkspace.value.kanban_columns]
    if (activeWorkspace.value.kanban_colors) form.value.kanban_colors = [...activeWorkspace.value.kanban_colors]
  }
})

watch(activeWorkspace, (newWs) => {
  if (newWs) {
    form.value.name = newWs.name
    form.value.description = newWs.description || ''
    if (newWs.kanban_columns) form.value.kanban_columns = [...newWs.kanban_columns]
    if (newWs.kanban_colors) form.value.kanban_colors = [...newWs.kanban_colors]
  }
}, { immediate: true })

const tabs = ['general', 'kanban', 'security']
const activeTab = ref('general')
const activeTabIndex = computed(() => tabs.indexOf(activeTab.value))

const addKanbanColumn = () => {
  form.value.kanban_columns.push('Nouvelle colonne')
  form.value.kanban_colors.push('#CBD5E1')
}

const removeKanbanColumn = (index: number) => {
  if (form.value.kanban_columns.length <= 1) {
    addToast({ type: 'error', title: 'Erreur', message: 'Il doit rester au moins une colonne.' })
    return
  }
  form.value.kanban_columns.splice(index, 1)
  form.value.kanban_colors.splice(index, 1)
}

const isLoading = ref(false)

const handleSave = async () => {
  if (!activeWorkspace.value) return;
  isLoading.value = true
  try {
    const updated = await updateWorkspace(activeWorkspace.value.id, {
      name: form.value.name,
      description: form.value.description,
      kanban_columns: form.value.kanban_columns,
      kanban_colors: form.value.kanban_colors,
    })
    setActiveWorkspace(updated)
    addToast({ type: 'success', title: 'Succès', message: 'Paramètres mis à jour.' })
  } catch (err) {
    console.error('Error updating workspace', err)
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de mettre à jour.' })
  } finally {
    isLoading.value = false
  }
}

const confirmDelete = async () => {
  if (!activeWorkspace.value) return;
  if (confirm("Êtes-vous sûr de vouloir supprimer cet espace de travail ? Cette action est irréversible.")) {
    try {
      await deleteWorkspace(activeWorkspace.value.id)
      setActiveWorkspace(null)
      addToast({ type: 'success', title: 'Succès', message: 'Espace supprimé.' })
      navigateTo(`/organization/${activeOrganization.value?.id || ''}`)
    } catch (err) {
      console.error('Error deleting workspace', err)
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'espace.' })
    }
  }
}
</script>

<template>
  <div>
    <!-- Header Section -->
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <NuxtLink :to="`/organization/${activeOrganization?.id || ''}/workspace/${activeWorkspace?.id || ''}`" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          </NuxtLink>
          <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Paramètres de l'espace</h1>
        </div>
        <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1 ml-7">Modifiez les informations de l'espace de travail.</p>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left sidebar navigation for settings (optional, good for future expansion) -->
      <div class="lg:col-span-1 relative flex flex-col gap-2 p-2 -mx-2 isolate">
        <!-- Bouncy Sliding Background -->
        <div 
            class="absolute left-2 right-2 top-2 h-[48px] rounded-xl bg-[#00C2CB] neo-emboss transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] -z-10"
            :style="activeTabIndex >= 0 ? { transform: `translateY(${activeTabIndex * 56}px)`, opacity: 1 } : { opacity: 0 }"
        ></div>

        <button @click="activeTab = 'general'" class="w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-between relative group" :class="activeTab === 'general' ? 'text-white font-bold' : 'text-secondary dark:text-gray-400 hover:bg-canvas dark:hover:bg-gray-800/50 hover:text-main dark:hover:text-white'">
          <span class="flex items-center gap-2 relative z-10"><Icon name="heroicons:information-circle" class="w-5 h-5 transition-transform group-hover:scale-110" /> Informations Générales</span>
          <Icon v-if="activeTab === 'general'" name="heroicons:chevron-right" class="w-4 h-4 opacity-80 relative z-10 drop-shadow-md" />
        </button>

        <button @click="activeTab = 'kanban'" class="w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-between relative group" :class="activeTab === 'kanban' ? 'text-white font-bold' : 'text-secondary dark:text-gray-400 hover:bg-canvas dark:hover:bg-gray-800/50 hover:text-main dark:hover:text-white'">
          <span class="flex items-center gap-2 relative z-10"><Icon name="heroicons:view-columns" class="w-5 h-5 transition-transform group-hover:scale-110" /> Colonnes Kanban</span>
          <Icon v-if="activeTab === 'kanban'" name="heroicons:chevron-right" class="w-4 h-4 opacity-80 relative z-10 drop-shadow-md" />
        </button>

        <button @click="activeTab = 'security'" class="w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-between relative group" :class="activeTab === 'security' ? 'text-white font-bold' : 'text-secondary dark:text-gray-400 hover:bg-canvas dark:hover:bg-gray-800/50 hover:text-main dark:hover:text-white'">
          <span class="flex items-center gap-2 relative z-10"><Icon name="heroicons:shield-check" class="w-5 h-5 transition-transform group-hover:scale-110" /> Sécurité</span>
          <Icon v-if="activeTab === 'security'" name="heroicons:chevron-right" class="w-4 h-4 opacity-80 relative z-10 drop-shadow-md" />
        </button>
      </div>

      <!-- Main Settings Form -->
      <div class="lg:col-span-2 space-y-6">
        
        <template v-if="activeTab === 'general'">
          <!-- General Info Card -->
          <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 md:p-8 border border-form-border dark:border-gray-800 shadow-sm">
            <h2 class="text-xl font-bold text-main dark:text-white mb-6">Informations Générales</h2>
            
            <form @submit.prevent="handleSave" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Nom de l'espace</label>
                <input v-model="form.name" type="text" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div>
                <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Description</label>
                <RichTextEditor v-model="form.description" class="w-full" />
              </div>

              <div class="pt-4 flex justify-end">
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 self-end sm:self-auto neo-emboss" :disabled="isLoading">
                  <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </template>

        <template v-if="activeTab === 'kanban'">
          <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 md:p-8 border border-form-border dark:border-gray-800 shadow-sm">
            <h2 class="text-xl font-bold text-main dark:text-white mb-2">Colonnes Kanban</h2>
            <p class="text-sm text-secondary dark:text-gray-400 mb-8">Personnalisez les colonnes de vos projets Kanban pour cet espace de travail.</p>
            
            <form @submit.prevent="handleSave" class="space-y-6">
              
              <div class="space-y-3">
                <div v-for="(col, index) in form.kanban_columns" :key="index" class="flex items-center gap-3">
                  <div class="w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-lg cursor-move border border-form-border dark:border-gray-700">
                    <Icon name="heroicons:bars-2" class="w-5 h-5" />
                  </div>
                  <input type="color" v-model="form.kanban_colors[index]" class="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0" />
                  <input v-model="form.kanban_columns[index]" type="text" class="flex-1 px-4 py-2 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" placeholder="Nom de la colonne" />
                  <button type="button" @click="removeKanbanColumn(index)" class="p-2 text-gray-400 hover:text-red-500 transition-colors bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 rounded-xl" title="Supprimer">
                    <Icon name="heroicons:trash" class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <button type="button" @click="addKanbanColumn" class="text-sm font-medium text-primary hover:text-blue-600 dark:text-blue-400 transition-colors flex items-center gap-2 mt-4">
                <Icon name="heroicons:plus-circle" class="w-5 h-5" />
                Ajouter une colonne
              </button>

              <div class="pt-4 flex justify-end border-t border-form-border dark:border-gray-800">
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 neo-emboss" :disabled="isLoading">
                  <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                  Sauvegarder les colonnes
                </button>
              </div>
            </form>
          </div>
        </template>

        <template v-if="activeTab === 'security'">
          <!-- Danger Zone at the bottom of Security -->
          <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 md:p-8 border border-red-200 dark:border-red-900/30 shadow-sm">
            <h2 class="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Zone de Danger</h2>
            <p class="text-sm text-secondary dark:text-gray-400 mb-6">
              La suppression d'un espace de travail est permanente. Tous les projets et tâches associés seront supprimés.
            </p>
            <button @click="confirmDelete" class="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
              Supprimer l'espace de travail
            </button>
          </div>
        </template>

      </div>
    </div>



  </div>
</template>
