<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useToast } from '~/composables/useToast'
import useAuth from '~/composables/useAuth'
import { useTour } from '~/composables/useTour'

definePageMeta({
  layout: 'custom'
})

const { user } = useAuth()
const { activeOrganization, updateOrganization, deleteOrganization, setActiveOrganization, uploadLogo, getMembers, removeMember, updateMemberRole } = useOrganizations()
const { addToast } = useToast()
const { $api } = useNuxtApp()
const { goBack: smartBack } = useSmartBack()
const goBack = () => {
  smartBack(`/organization/${activeOrganization.value?.id || ''}/`)
}
const { tags: orgTags, getTags, createTag, updateTag, deleteTag } = useTags()
const { continueTourIfPending } = useTour()

const form = ref({
  name: '',
  description: '',
  primary_color: '#0B0E11',
  reminder_days_before_start: 2,
  reminder_time_start: '08:00',
  reminder_days_before_end: 2,
  reminder_time_end: '08:00',
})

const extractedColors = ref<string[]>([])
const isAnalyzingLogo = ref(false)

const analyzeLogoColors = async (fileOrUrl: File | string) => {
  isAnalyzingLogo.value = true
  try {
    const palette = await getPaletteFromImage(fileOrUrl, 6)
    extractedColors.value = palette
  } catch (err) {
    console.error('Error extracting color palette:', err)
  } finally {
    isAnalyzingLogo.value = false
  }
}

const formatTime = (timeStr?: string) => timeStr ? timeStr.substring(0, 5) : '08:00'

const getLogoUrl = (path?: string) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path
  const cleanPath = path.startsWith('/') ? path : '/' + path
  return 'http://localhost:8000' + cleanPath
}

onMounted(() => {
  if (activeOrganization.value) {
    form.value.name = activeOrganization.value.name
    form.value.description = activeOrganization.value.description || ''
    form.value.primary_color = activeOrganization.value.primary_color || '#0B0E11'
    form.value.reminder_days_before_start = activeOrganization.value.reminder_days_before_start || 2
    form.value.reminder_time_start = formatTime(activeOrganization.value.reminder_time_start)
    form.value.reminder_days_before_end = activeOrganization.value.reminder_days_before_end || 2
    form.value.reminder_time_end = formatTime(activeOrganization.value.reminder_time_end)

    if (activeOrganization.value.logo) {
      analyzeLogoColors(getLogoUrl(activeOrganization.value.logo))
    }
  }
  
  // Resume the onboarding tour if it was navigated here during Phase 1.5
  continueTourIfPending('settings')
})

watch(activeOrganization, (newOrg) => {
  if (newOrg) {
    form.value.name = newOrg.name
    form.value.description = newOrg.description || ''
    form.value.primary_color = newOrg.primary_color || '#0B0E11'
    form.value.reminder_days_before_start = newOrg.reminder_days_before_start || 2
    form.value.reminder_time_start = formatTime(newOrg.reminder_time_start)
    form.value.reminder_days_before_end = newOrg.reminder_days_before_end || 2
    form.value.reminder_time_end = formatTime(newOrg.reminder_time_end)

    if (newOrg.logo && extractedColors.value.length === 0) {
      analyzeLogoColors(getLogoUrl(newOrg.logo))
    }
  }
}, { immediate: true })

const tabs = ['general', 'members', 'reminders', 'tags', 'security']
const activeTab = ref('general')

const orgMembers = ref<any[]>([])
const isLoadingMembers = ref(false)

const loadMembers = async () => {
  if (!activeOrganization.value) return;
  isLoadingMembers.value = true
  try {
    orgMembers.value = await getMembers(activeOrganization.value.id)
  } catch (error) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de charger les membres.' })
  } finally {
    isLoadingMembers.value = false
  }
}

const currentUserRole = computed(() => {
  const me = orgMembers.value.find(m => String(m.id) === String(user.value?.id))
  return me?.pivot?.role || ''
})

const canManageMembers = computed(() => ['propriétaire', 'proprietaire', 'admin'].includes(currentUserRole.value.toLowerCase()))

const canEditRole = (member: any) => {
  if (!canManageMembers.value) return false;
  if (String(member.id) === String(user.value?.id)) return false; 
  const targetRole = (member.pivot?.role || '').toLowerCase();
  if (currentUserRole.value.toLowerCase() === 'admin' && targetRole === 'propriétaire') return false;
  return true;
}

const inviteFunction = async ()=>{
   try {
    const data = await $api<{success:boolean, message:string, invitation:any}>(`/invitations`, {
       method: 'POST', 
       body:{
         email:inviteEmail.value,
         organization_id:activeOrganization.value?.id,
         role:inviteRole.value,
       }
    });

    if(data.success){
      addToast({ type: 'success', title: 'Succès', message: data.message });
      isInviteModalOpen.value = false
      inviteEmail.value = ''
      inviteRole.value = 'member'
    }
   } catch (error) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'inviter le membre.' });
   }
} 

const isInviteModalOpen = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('member')

const isEmailQuery = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.value)
})

const handleInvite = () => {
  inviteFunction();
}

const isEditRoleModalOpen = ref(false)
const editingMember = ref<any>(null)
const editingRole = ref('membre')

const openEditRoleModal = (member: any) => {
  editingMember.value = member;
  const currentRole = (member.pivot?.role || 'membre').toLowerCase();
  editingRole.value = currentRole === 'propriétaire' ? 'proprietaire' : currentRole;
  isEditRoleModalOpen.value = true;
}

const handleEditRole = async () => {
  if (!activeOrganization.value || !editingMember.value) return;
  try {
    await updateMemberRole(activeOrganization.value.id, editingMember.value.id, editingRole.value);
    addToast({ type: 'success', title: 'Succès', message: 'Rôle modifié avec succès' });
    const memberIndex = orgMembers.value.findIndex(m => m.id === editingMember.value.id);
    if (memberIndex !== -1) {
      if (orgMembers.value[memberIndex].pivot) {
        orgMembers.value[memberIndex].pivot.role = editingRole.value === 'proprietaire' ? 'propriétaire' : editingRole.value;
      } else {
        orgMembers.value[memberIndex].role = editingRole.value === 'proprietaire' ? 'propriétaire' : editingRole.value;
      }
    }
    isEditRoleModalOpen.value = false;
  } catch (err: any) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de modifier le rôle.' });
  }
}

const handleRemoveMember = async (memberId: number | string) => {
  if (!activeOrganization.value) return;
  if (!confirm('Voulez-vous vraiment retirer ce membre de l\'organisation ?')) return;
  try {
    await removeMember(activeOrganization.value.id, memberId);
    orgMembers.value = orgMembers.value.filter(m => m.id !== memberId);
    addToast({ type: 'success', title: 'Succès', message: 'Membre retiré de l\'organisation.' });
  } catch (e) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de retirer le membre.' });
  }
}

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
  } else if (newTab === 'members' && orgMembers.value.length === 0) {
    loadMembers()
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
      analyzeLogoColors(file)
      const updated = await uploadLogo(activeOrganization.value.id, file)
      setActiveOrganization(updated)
      addToast({ type: 'success', title: 'Succès', message: 'Logo mis à jour.' })
    } catch (e) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de télécharger le logo.' })
    }
  }
}

const selectPrimaryColor = (color: string) => {
  form.value.primary_color = color
  // Live preview the color change
  const { setPrimaryColor } = useTheme()
  setPrimaryColor(color)
}

const isLoading = ref(false)

const handleSave = async () => {
  if (!activeOrganization.value) return;
  isLoading.value = true
  try {
    const updated = await updateOrganization(activeOrganization.value.id, {
      name: form.value.name,
      description: form.value.description,
      primary_color: form.value.primary_color
    })
    setActiveOrganization(updated)
    // Immediately apply the theme color so the user sees the change right away
    const { setPrimaryColor } = useTheme()
    setPrimaryColor(form.value.primary_color)
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

const isDeleteModalOpen = ref(false)
const deleteConfirmationText = ref('')
const expectedConfirmationText = computed(() => activeOrganization.value?.name || '')

const openDeleteModal = () => {
  if (!activeOrganization.value) return;
  deleteConfirmationText.value = ''
  isDeleteModalOpen.value = true
}

const executeDelete = async () => {
  if (!activeOrganization.value) return;
  if (deleteConfirmationText.value !== expectedConfirmationText.value) return;
  
  try {
    await deleteOrganization(activeOrganization.value.id)
    setActiveOrganization(null)
    isDeleteModalOpen.value = false
    addToast({ type: 'success', title: 'Succès', message: 'Organisation supprimée.' })
    navigateTo('/organizations')
  } catch (err) {
    console.error('Error deleting org', err)
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'organisation.' })
  }
}
</script>

<template>
  <div>
    <!-- Top Nav / Back button -->
    <div class="flex items-center gap-4 mb-8">
      <button @click="goBack" class="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-[#2A2A2D] flex items-center justify-center bg-white dark:bg-[#1D1D1D] text-main dark:text-white shadow-md hover:scale-105 hover:shadow-lg transition-all" title="Retour">
        <Icon name="heroicons:chevron-left" class="w-5 h-5 font-bold" />
      </button>
    </div>

    <!-- Header Section -->
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Paramètres de l'Organisation</h1>
        <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1">Modifiez les informations de votre organisation.</p>
      </div>
    </section>

    <!-- Horizontal Tab Navigation -->
    <div id="tour-settings-tabs" class="flex items-center gap-2 md:gap-4 mb-8 overflow-x-auto custom-scrollbar pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
      <button @click="activeTab = 'general'" class="px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'general' ? 'btn-primary text-white shadow-lg neo-emboss' : 'text-secondary dark:text-gray-400 hover:bg-canvas dark:hover:bg-gray-800'">
        <Icon name="heroicons:information-circle" class="w-5 h-5" /> Générales
      </button>

      <button id="tour-settings-members-tab" @click="activeTab = 'members'" class="px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'members' ? 'btn-primary text-white shadow-lg neo-emboss' : 'text-secondary dark:text-gray-400 hover:bg-canvas dark:hover:bg-gray-800'">
        <Icon name="heroicons:users" class="w-5 h-5" /> Membres
      </button>

      <button @click="activeTab = 'reminders'" class="px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'reminders' ? 'btn-primary text-white shadow-lg neo-emboss' : 'text-secondary dark:text-gray-400 hover:bg-canvas dark:hover:bg-gray-800'">
        <Icon name="heroicons:bell" class="w-5 h-5" /> Rappels
      </button>

      <button @click="activeTab = 'tags'" class="px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'tags' ? 'btn-primary text-white shadow-lg neo-emboss' : 'text-secondary dark:text-gray-400 hover:bg-canvas dark:hover:bg-gray-800'">
        <Icon name="heroicons:tag" class="w-5 h-5" /> Étiquettes
      </button>

      <button @click="activeTab = 'security'" class="px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'security' ? 'bg-red-600 text-white shadow-lg neo-emboss' : 'text-secondary dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'">
        <Icon name="heroicons:shield-check" class="w-5 h-5" /> Sécurité
      </button>
    </div>

    <!-- Main Settings Form -->
    <div class="space-y-6">
        
        <template v-if="activeTab === 'general'">
          <!-- General Info Card -->
          <div id="tour-settings-general" class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 md:p-8 border border-form-border dark:border-gray-800 shadow-sm">
            <h2 class="text-xl font-bold text-main dark:text-white mb-6">Informations Générales</h2>
            
            <div class="mb-6 flex items-center gap-6">
              <div class="relative group">
                <div class="w-20 h-20 rounded-2xl overflow-hidden bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-200 dark:border-blue-800 flex items-center justify-center">
                  <img v-if="activeOrganization?.logo" :src="getLogoUrl(activeOrganization.logo)" class="w-full h-full object-cover" />
                  <span v-else class="text-2xl font-bold text-primary">{{ activeOrganization?.name?.substring(0, 2).toUpperCase() }}</span>
                </div>
                <button @click="triggerFileInput" type="button" class="absolute -bottom-2 -right-2 p-1.5 btn-primary text-white rounded-lg shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all neo-emboss">
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

              <!-- Color Palette / Main Theme Selection -->
              <div>
                <label class="block text-sm font-bold text-main dark:text-gray-300 mb-2">Couleur principale (Thème de l'application)</label>
                
                <!-- ColorThief extracted swatches -->
                <div v-if="isAnalyzingLogo" class="flex items-center gap-2 py-2 text-xs text-secondary dark:text-gray-400">
                  <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin text-primary" />
                  <span>Extraction des couleurs du logo avec Color Thief...</span>
                </div>
                <div v-else-if="extractedColors.length > 0" class="mb-3">
                  <span class="text-xs text-secondary dark:text-gray-400 mb-2 block font-medium">Couleurs extraites du logo (Color Thief) :</span>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="color in extractedColors"
                      :key="color"
                      type="button"
                      @click="selectPrimaryColor(color)"
                      class="w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center shadow-sm relative group hover:scale-105"
                      :style="{ backgroundColor: color, borderColor: form.primary_color === color ? '#000' : 'transparent' }"
                      :title="color"
                    >
                      <Icon v-if="form.primary_color === color" name="heroicons:check" class="w-4 h-4 text-white drop-shadow-md" />
                    </button>
                  </div>
                </div>

                <!-- Custom color picker -->
                <div class="flex items-center gap-3">
                  <input 
                    type="color" 
                    v-model="form.primary_color" 
                    class="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input 
                    type="text" 
                    v-model="form.primary_color" 
                    placeholder="#0B0E11"
                    class="w-36 bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white font-mono text-sm uppercase rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span class="text-xs text-secondary dark:text-gray-400">Couleur sélectionnée</span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Description</label>
                <RichTextEditor v-model="form.description" class="w-full" />
              </div>

              <div class="pt-4 flex justify-end">
                <button type="submit" class="px-4 py-2 btn-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 self-end sm:self-auto neo-emboss" :disabled="isLoading">
                  <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </template>

        <template v-if="activeTab === 'members'">
          <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl border border-form-border dark:border-gray-800 shadow-sm overflow-hidden">
            <div class="p-6 md:p-8 border-b border-form-border dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 class="text-xl font-bold text-main dark:text-white mb-2">Membres de l'Organisation</h2>
                <p class="text-sm text-secondary dark:text-gray-400">Gérez les membres et leurs rôles au sein de l'organisation.</p>
              </div>
              <button v-if="canManageMembers" @click="isInviteModalOpen = true" class="px-4 py-2 btn-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 neo-emboss shrink-0">
                <Icon name="heroicons:user-plus" class="w-4 h-4" />
                Inviter un membre
              </button>
            </div>

            <div v-if="isLoadingMembers" class="flex justify-center py-12">
              <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
            </div>
            
            <div v-else-if="orgMembers.length === 0" class="text-center py-12 text-secondary dark:text-gray-500">
              Aucun membre trouvé.
            </div>

            <div v-else class="overflow-x-auto w-full pb-4">
              <table class="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr class="bg-canvas dark:bg-[#151515] text-secondary dark:text-gray-400 text-xs uppercase tracking-wider border-b border-form-border dark:border-gray-800">
                    <th class="px-6 py-4 font-bold">Utilisateur</th>
                    <th class="px-6 py-4 font-bold">Rôle</th>
                    <th class="px-6 py-4 font-bold">Date d'ajout</th>
                    <th class="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-form-border dark:divide-gray-800">
                  <tr v-for="member in orgMembers" :key="member.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0 border border-form-border dark:border-gray-600 shadow-sm">
                          <img :src="member?.profile_picture ? (member.profile_picture.startsWith('http') ? member.profile_picture : getLogoUrl(member.profile_picture)) : `https://api.dicebear.com/7.x/initials/svg?seed=${(member?.last_name || '').charAt(0).toUpperCase() + (member?.first_name || '').charAt(0).toUpperCase() || 'U'}&chars=2`" alt="Avatar" class="w-full h-full object-cover" />
                        </div>
                        <div class="flex flex-col min-w-0">
                          <span class="font-bold text-main dark:text-white truncate">{{ member.last_name }} {{ member.first_name }}</span>
                          <span class="text-xs text-secondary dark:text-gray-500 truncate">{{ member.email }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                        {{ member.pivot?.role || member.role || 'Membre' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm font-medium text-secondary dark:text-gray-400">
                      {{ new Date(member.pivot?.created_at || member.created_at || Date.now()).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div v-if="canManageMembers" class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button v-if="canEditRole(member)" class="p-2 text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Modifier le rôle" @click.stop="openEditRoleModal(member)">
                          <Icon name="heroicons:pencil" class="w-5 h-5" />
                        </button>
                        <button v-if="canEditRole(member)" class="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Retirer de l'organisation" @click.stop="handleRemoveMember(member.id)">
                          <Icon name="heroicons:trash" class="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
                <button type="submit" class="px-4 py-2 btn-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 self-end sm:self-auto neo-emboss" :disabled="isLoading">
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
              <button @click="openCreateTagModal" class="px-4 py-2 btn-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 self-end sm:self-auto neo-emboss">
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
            <button @click="openDeleteModal" class="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
              Supprimer l'organisation
            </button>
          </div>
        </template>

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
            <button type="submit" class="px-4 py-2 btn-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 self-end sm:self-auto neo-emboss">
              {{ editingTag ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Organization Modal -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xl font-bold text-red-600 dark:text-red-400">Supprimer l'organisation</h3>
          <button @click="isDeleteModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-sm text-secondary dark:text-gray-400">
            Cette action est irréversible. Tous les projets, tâches et équipes associés seront supprimés.
          </p>
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">
              Veuillez taper <span class="font-bold text-red-500">{{ expectedConfirmationText }}</span> pour confirmer.
            </label>
            <input v-model="deleteConfirmationText" type="text" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50" />
          </div>
        </div>
        <div class="p-6 border-t border-form-border dark:border-gray-800 flex justify-end gap-3">
          <button @click="isDeleteModalOpen = false" class="px-4 py-2 font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            Annuler
          </button>
          <button @click="executeDelete" :disabled="deleteConfirmationText !== expectedConfirmationText" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 self-end sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed">
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <!-- Invite Modal (Dynamic matching team/[id].vue) -->
    <div v-if="isInviteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between shrink-0">
          <h3 class="text-xl font-bold text-main dark:text-white">Inviter un membre</h3>
          <button @click="isInviteModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Entrer une adresse email</label>
            <div class="relative">
              <Icon name="heroicons:envelope" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input v-model="inviteEmail" type="email" placeholder="collegue@exemple.com" class="w-full pl-10 pr-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Rôle</label>
            <CustomSelect 
              v-model="inviteRole"
              :options="[
                { value: 'member', label: 'Membre' },
                { value: 'admin', label: 'Administrateur' }
              ]"
              placeholder="Sélectionner un rôle"
              buttonClass="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 flex justify-between items-center"
            />
          </div>

          <div class="mt-4 border border-form-border dark:border-gray-800 rounded-xl overflow-hidden bg-canvas dark:bg-[#151515]">
            <ul class="divide-y divide-form-border dark:divide-gray-800 max-h-48 overflow-y-auto custom-scrollbar">
              <li class="px-4 py-4 text-center">
                <div v-if="isEmailQuery" class="flex flex-col items-center gap-2">
                  <span class="text-sm text-gray-500">Prêt à envoyer une invitation à cet email.</span>
                  <button @click="handleInvite" class="px-4 py-2 btn-primary/10 text-primary hover:btn-primary/20 transition-colors rounded-lg font-medium text-sm flex items-center gap-2">
                    <Icon name="heroicons:paper-airplane" class="w-4 h-4" />
                    Inviter {{ inviteEmail }}
                  </button>
                </div>
                <div v-else class="text-sm text-gray-500">
                  Saisissez une adresse email valide pour envoyer une invitation.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Role Modal -->
    <div v-if="isEditRoleModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xl font-bold text-main dark:text-white">Modifier le rôle</h3>
          <button @click="isEditRoleModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <p class="text-sm text-secondary dark:text-gray-400 mb-4">
              Modifier le rôle de <strong>{{ editingMember?.name }}</strong>.
            </p>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Rôle</label>
            <CustomSelect 
              v-model="editingRole"
              :options="[
                { value: 'membre', label: 'Membre' },
                { value: 'admin', label: 'Administrateur' },
                ...(currentUserRole.toLowerCase() === 'propriétaire' || currentUserRole.toLowerCase() === 'proprietaire' ? [{ value: 'proprietaire', label: 'Propriétaire' }] : [])
              ]"
              placeholder="Sélectionner un rôle"
              buttonClass="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 flex justify-between items-center"
            />
          </div>
        </div>
        <div class="p-6 border-t border-form-border dark:border-gray-800 flex justify-end gap-3">
          <button @click="isEditRoleModalOpen = false" class="px-4 py-2 font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            Annuler
          </button>
          <button @click="handleEditRole" class="px-4 py-2 btn-primary text-white font-medium rounded-xl hover:btn-primary transition-colors">
            Enregistrer
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
