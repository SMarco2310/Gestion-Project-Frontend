<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'custom'
})

const { activeOrganization, updateOrganization, deleteOrganization, setActiveOrganization, uploadLogo } = useOrganizations()
const { addToast } = useToast()
const { tags: orgTags, getTags, createTag, updateTag, deleteTag } = useTags()

const form = ref({
  name: '',
  description: '',
  reminder_days_before_start: 2,
  reminder_time_start: '08:00',
  reminder_days_before_end: 2,
  reminder_time_end: '08:00',
})

const formatTime = (timeStr?: string) => timeStr ? timeStr.substring(0, 5) : '08:00'

onMounted(() => {
  if (activeOrganization.value) {
    form.value.name = activeOrganization.value.name
    form.value.description = activeOrganization.value.description || ''
    form.value.reminder_days_before_start = activeOrganization.value.reminder_days_before_start || 2
    form.value.reminder_time_start = formatTime(activeOrganization.value.reminder_time_start)
    form.value.reminder_days_before_end = activeOrganization.value.reminder_days_before_end || 2
    form.value.reminder_time_end = formatTime(activeOrganization.value.reminder_time_end)
  }
})

watch(activeOrganization, (newOrg) => {
  if (newOrg) {
    form.value.name = newOrg.name
    form.value.description = newOrg.description || ''
    form.value.reminder_days_before_start = newOrg.reminder_days_before_start || 2
    form.value.reminder_time_start = formatTime(newOrg.reminder_time_start)
    form.value.reminder_days_before_end = newOrg.reminder_days_before_end || 2
    form.value.reminder_time_end = formatTime(newOrg.reminder_time_end)
  }
}, { immediate: true })

const activeTab = ref('general')

const loadTags = async () => {
  try {
    await getTags()
  } catch (error) {
    // Error handled in composable
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'tags') {
    loadTags()
  }
})

// Tags logic
const isTagModalOpen = ref(false)
const editingTag = ref<any>(null)
const tagForm = ref({ name: '', color: '#3B82F6' })

const openCreateTagModal = () => {
  editingTag.value = null
  tagForm.value = { name: '', color: '#3B82F6' }
  isTagModalOpen.value = true
}

const openEditTagModal = (tag: any) => {
  editingTag.value = tag
  tagForm.value = { name: tag.name, color: tag.color || '#3B82F6' }
  isTagModalOpen.value = true
}

const handleSaveTag = async () => {
  if (!activeOrganization.value) return;
  try {
    if (editingTag.value) {
      await updateTag(editingTag.value.id, {
        name: tagForm.value.name,
        color: tagForm.value.color,
      });
      addToast({ type: 'success', title: 'Succès', message: 'Étiquette modifiée.' });
    } else {
      await createTag({
        name: tagForm.value.name,
        color: tagForm.value.color,
        organization_id: activeOrganization.value.id
      } as any);
      addToast({ type: 'success', title: 'Succès', message: 'Étiquette créée.' });
    }
    isTagModalOpen.value = false;
  } catch (err) {
    addToast({ type: 'error', title: 'Erreur', message: 'Opération échouée.' });
  }
}

const handleDeleteTag = async (tag: any) => {
  if (confirm(`Voulez-vous supprimer l'étiquette "${tag.name}" ?`)) {
    try {
      await deleteTag(tag.id)
      addToast({ type: 'success', title: 'Succès', message: 'Étiquette supprimée.' })
    } catch (err) {
      addToast({ type: 'error', title: 'Erreur', message: 'Suppression échouée.' })
    }
  }
}

const fileInput = ref<HTMLInputElement | null>(null)
const triggerFileInput = () => fileInput.value?.click()

const handleFileUpload = async (event: Event) => {
  if (!activeOrganization.value) return;
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0] as File
    try {
      const updated = await uploadLogo(activeOrganization.value.id, file)
      setActiveOrganization(updated)
      addToast({ type: 'success', title: 'Succès', message: 'Logo mis à jour.' })
    } catch (e) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de télécharger le logo.' })
    }
  }
}

const isLoading = ref(false)

const handleSave = async () => {
  if (!activeOrganization.value) return;
  isLoading.value = true
  try {
    const updated = await updateOrganization(activeOrganization.value.id, {
      name: form.value.name,
      description: form.value.description
    })
    setActiveOrganization(updated)
    addToast({ type: 'success', title: 'Succès', message: 'Paramètres mis à jour.' })
  } catch (err) {
    console.error('Error updating org', err)
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de mettre à jour l\'organisation.' })
  } finally {
    isLoading.value = false
  }
}

const handleSaveReminders = async () => {
  if (!activeOrganization.value) return;
  isLoading.value = true
  try {
    const updated = await updateOrganization(activeOrganization.value.id, {
      reminder_days_before_start: form.value.reminder_days_before_start,
      reminder_time_start: form.value.reminder_time_start,
      reminder_days_before_end: form.value.reminder_days_before_end,
      reminder_time_end: form.value.reminder_time_end,
    })
    setActiveOrganization(updated)
    addToast({ type: 'success', title: 'Succès', message: 'Rappels mis à jour.' })
  } catch (err) {
    console.error('Error saving reminders', err)
    addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la sauvegarde.' })
  } finally {
    isLoading.value = false
  }
}

const confirmDelete = async () => {
  if (!activeOrganization.value) return;
  if (confirm("Êtes-vous sûr de vouloir supprimer cette organisation ? Cette action est irréversible.")) {
    try {
      await deleteOrganization(activeOrganization.value.id)
      setActiveOrganization(null)
      addToast({ type: 'success', title: 'Succès', message: 'Organisation supprimée.' })
      navigateTo('/organizations')
    } catch (err) {
      console.error('Error deleting org', err)
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'organisation.' })
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
          <NuxtLink to="/organization" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          </NuxtLink>
          <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Paramètres de l'Organisation</h1>
        </div>
        <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1 ml-7">Modifiez les informations de votre organisation.</p>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left sidebar navigation for settings (optional, good for future expansion) -->
      <div class="lg:col-span-1 space-y-2">
        <button @click="activeTab = 'general'" class="w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-between border" :class="activeTab === 'general' ? 'bg-canvas dark:bg-gray-800 text-main dark:text-white border-form-border dark:border-gray-700 shadow-sm' : 'border-transparent text-secondary dark:text-gray-400 hover:bg-canvas dark:hover:bg-gray-800/50'">
          <span class="flex items-center gap-2"><Icon name="heroicons:information-circle" class="w-5 h-5" /> Informations Générales</span>
          <Icon v-if="activeTab === 'general'" name="heroicons:chevron-right" class="w-4 h-4 opacity-50" />
        </button>

        <button @click="activeTab = 'reminders'" class="w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-between border" :class="activeTab === 'reminders' ? 'bg-canvas dark:bg-gray-800 text-main dark:text-white border-form-border dark:border-gray-700 shadow-sm' : 'border-transparent text-secondary dark:text-gray-400 hover:bg-canvas dark:hover:bg-gray-800/50'">
          <span class="flex items-center gap-2"><Icon name="heroicons:bell" class="w-5 h-5" /> Rappels Automatiques</span>
          <Icon v-if="activeTab === 'reminders'" name="heroicons:chevron-right" class="w-4 h-4 opacity-50" />
        </button>

        <button @click="activeTab = 'tags'" class="w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-between border" :class="activeTab === 'tags' ? 'bg-canvas dark:bg-gray-800 text-main dark:text-white border-form-border dark:border-gray-700 shadow-sm' : 'border-transparent text-secondary dark:text-gray-400 hover:bg-canvas dark:hover:bg-gray-800/50'">
          <span class="flex items-center gap-2"><Icon name="heroicons:tag" class="w-5 h-5" /> Étiquettes</span>
          <Icon v-if="activeTab === 'tags'" name="heroicons:chevron-right" class="w-4 h-4 opacity-50" />
        </button>

        <button @click="activeTab = 'security'" class="w-full text-left px-4 py-3 rounded-xl border font-medium transition-colors flex items-center justify-between" :class="activeTab === 'security' ? 'bg-canvas dark:bg-gray-800 text-main dark:text-white border-form-border dark:border-gray-700 shadow-sm' : 'border-transparent text-secondary dark:text-gray-400 hover:bg-canvas dark:hover:bg-gray-800/50'">
          <span class="flex items-center gap-2"><Icon name="heroicons:shield-check" class="w-5 h-5" /> Sécurité</span>
          <Icon v-if="activeTab === 'security'" name="heroicons:chevron-right" class="w-4 h-4 opacity-50" />
        </button>
      </div>

      <!-- Main Settings Form -->
      <div class="lg:col-span-2 space-y-6">
        
        <template v-if="activeTab === 'general'">
          <!-- General Info Card -->
          <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 md:p-8 border border-form-border dark:border-gray-800 shadow-sm">
            <h2 class="text-xl font-bold text-main dark:text-white mb-6">Informations Générales</h2>
            
            <div class="mb-6 flex items-center gap-6">
              <div class="relative group">
                <div class="w-20 h-20 rounded-2xl overflow-hidden bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-200 dark:border-blue-800 flex items-center justify-center">
                  <img v-if="activeOrganization?.logo" :src="activeOrganization.logo.startsWith('http') ? activeOrganization.logo : 'http://localhost:8000' + activeOrganization.logo" class="w-full h-full object-cover" />
                  <span v-else class="text-2xl font-bold text-blue-500">{{ activeOrganization?.name?.substring(0, 2).toUpperCase() }}</span>
                </div>
                <button @click="triggerFileInput" type="button" class="absolute -bottom-2 -right-2 p-1.5 bg-primary text-white rounded-lg shadow-sm hover:bg-blue-600 transition-colors">
                  <Icon name="heroicons:camera" class="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 class="font-bold text-main dark:text-white">Logo de l'organisation</h3>
                <p class="text-xs text-secondary dark:text-gray-400 mt-1">JPEG, PNG ou GIF. 5MB max.</p>
                <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />
              </div>
            </div>

            <form @submit.prevent="handleSave" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Nom de l'organisation</label>
                <input v-model="form.name" type="text" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div>
                <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Description</label>
                <textarea v-model="form.description" rows="4" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"></textarea>
              </div>

              <div class="pt-4 flex justify-end">
                <button type="submit" class="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2" :disabled="isLoading">
                  <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </template>

        <template v-if="activeTab === 'reminders'">
          <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 md:p-8 border border-form-border dark:border-gray-800 shadow-sm">
            <h2 class="text-xl font-bold text-main dark:text-white mb-2">Paramètres des rappels</h2>
            <p class="text-sm text-secondary dark:text-gray-400 mb-8">Configurez les moments où des rappels automatiques sont envoyés aux membres de l'équipe pour les projets et tâches approchant de leur échéance.</p>
            
            <form @submit.prevent="handleSaveReminders" class="space-y-6">
              
              <div class="space-y-4">
                
                <!-- Reminder Before Start -->
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-form-border dark:border-gray-800 bg-canvas dark:bg-[#151515] transition-colors relative group shadow-sm">
                  <div class="flex-1 flex items-center gap-3">
                    <input type="number" min="0" v-model="form.reminder_days_before_start" class="w-16 px-3 py-2 rounded-lg bg-white dark:bg-[#2D2D2F] border border-form-border dark:border-gray-700 text-main dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner" />
                    <span class="text-sm font-bold text-main dark:text-gray-200">jours avant le début du projet</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="flex flex-col">
                      <span class="text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-1">Heure d'envoi</span>
                      <input type="time" v-model="form.reminder_time_start" class="px-3 py-2 rounded-lg bg-white dark:bg-[#2D2D2F] border border-form-border dark:border-gray-700 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner" />
                    </div>
                  </div>
                </div>

                <!-- Reminder Before End -->
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-form-border dark:border-gray-800 bg-canvas dark:bg-[#151515] transition-colors relative group shadow-sm">
                  <div class="flex-1 flex items-center gap-3">
                    <input type="number" min="0" v-model="form.reminder_days_before_end" class="w-16 px-3 py-2 rounded-lg bg-white dark:bg-[#2D2D2F] border border-form-border dark:border-gray-700 text-main dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner" />
                    <span class="text-sm font-bold text-main dark:text-gray-200">jours avant la fin du projet</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="flex flex-col">
                      <span class="text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-1">Heure d'envoi</span>
                      <input type="time" v-model="form.reminder_time_end" class="px-3 py-2 rounded-lg bg-white dark:bg-[#2D2D2F] border border-form-border dark:border-gray-700 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner" />
                    </div>
                  </div>
                </div>

              </div>

              <div class="pt-4 flex justify-end">
                <button type="submit" class="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2" :disabled="isLoading">
                  <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                  Sauvegarder les rappels
                </button>
              </div>
            </form>
          </div>
        </template>

        <template v-if="activeTab === 'tags'">
          <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl border border-form-border dark:border-gray-800 shadow-sm overflow-hidden">
            <div class="p-6 border-b border-form-border dark:border-gray-800 flex justify-between items-center">
              <div>
                <h2 class="text-xl font-bold text-main dark:text-white">Étiquettes</h2>
                <p class="text-sm text-secondary dark:text-gray-400 mt-1">Gérez les étiquettes personnalisées pour cette organisation.</p>
              </div>
              <button @click="openCreateTagModal" class="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm text-sm">
                <Icon name="heroicons:plus" class="w-4 h-4" />
                Créer une étiquette
              </button>
            </div>
            
            <div class="p-6">
              <div v-if="orgTags.length === 0" class="text-center py-8 text-secondary dark:text-gray-500">
                Aucune étiquette trouvée. Créez-en une pour commencer à organiser vos tâches.
              </div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div v-for="tag in orgTags" :key="tag.id" class="flex items-center justify-between p-3 rounded-xl border border-form-border dark:border-gray-800 bg-canvas dark:bg-[#151515]">
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 rounded-full shadow-sm" :style="{ backgroundColor: tag.color || '#9CA3AF' }"></div>
                    <span class="font-medium text-main dark:text-gray-200 text-sm truncate max-w-[120px]">{{ tag.name }}</span>
                    <span v-if="tag.is_default" class="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">Défaut</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button v-if="!tag.is_default" @click="openEditTagModal(tag)" class="p-1.5 text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Modifier">
                      <Icon name="heroicons:pencil" class="w-4 h-4" />
                    </button>
                    <button v-if="!tag.is_default" @click="handleDeleteTag(tag)" class="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Supprimer">
                      <Icon name="heroicons:trash" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeTab === 'security'">
          <!-- Danger Zone at the bottom of Security -->
          <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 md:p-8 border border-red-200 dark:border-red-900/30 shadow-sm">
            <h2 class="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Zone de Danger</h2>
            <p class="text-sm text-secondary dark:text-gray-400 mb-6">
              La suppression d'une organisation est permanente. Tous les projets, tâches et équipes associés seront supprimés.
            </p>
            <button @click="confirmDelete" class="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
              Supprimer l'organisation
            </button>
          </div>
        </template>

      </div>
    </div>

    <!-- Tag Create/Edit Modal -->
    <div v-if="isTagModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xl font-bold text-main dark:text-white">{{ editingTag ? 'Modifier l\'étiquette' : 'Nouvelle étiquette' }}</h3>
          <button @click="isTagModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <form @submit.prevent="handleSaveTag">
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Nom de l'étiquette</label>
              <input v-model="tagForm.name" required type="text" placeholder="Ex: Bug, Feature..." class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Couleur</label>
              <div class="flex items-center gap-4">
                <input v-model="tagForm.color" type="color" class="w-12 h-12 rounded cursor-pointer border-0 p-0 bg-transparent" />
                <input v-model="tagForm.color" type="text" class="flex-1 px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white uppercase font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
          </div>
          <div class="p-6 border-t border-form-border dark:border-gray-800 flex justify-end gap-3">
            <button type="button" @click="isTagModalOpen = false" class="px-4 py-2 font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
              Annuler
            </button>
            <button type="submit" class="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors">
              {{ editingTag ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
