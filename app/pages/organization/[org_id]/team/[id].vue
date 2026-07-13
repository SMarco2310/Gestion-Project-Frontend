<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'custom'
})

const route = useRoute()
const { isOwner } = useAuth()
const { activeOrganization } = useOrganizations()
const { $api } = useNuxtApp()
const teamId = route.params.id

const { addToast } = useToast()

const team = ref<any>({ name: '', description: '', created_at: '' })
const teamMembers = ref<any[]>([])
const allOrgMembers = ref<any[]>([])
const isLoading = ref(true)

const fetchTeamData = async () => {
  if (!activeOrganization.value) return;
  isLoading.value = true;
  try {
    const orgId = activeOrganization.value.id;
    const res = await $api<any>(`/organizations/${orgId}/teams/${teamId}`, { method: 'GET' });
    team.value = res.team;
    teamMembers.value = res.team.members || [];
    
    // Fetch org members for invitation
    const membersRes = await $api<any>(`/organizations/${orgId}/members`, { method: 'GET' });
    allOrgMembers.value = membersRes.data?.data || membersRes.data || [];
  } catch (err) {
    console.error('Error fetching team data', err);
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de charger l\'équipe.' });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchTeamData();
})

// --- Edit Role State ---
const isEditRoleModalOpen = ref(false)
const selectedMemberForRole = ref<any>(null)

const openEditRoleModal = (member: any) => {
  selectedMemberForRole.value = { ...member, role: member.pivot?.role || 'membre' }
  isEditRoleModalOpen.value = true
}

const updateMemberRole = async () => {
  if (!selectedMemberForRole.value || !activeOrganization.value) return;
  try {
    const orgId = activeOrganization.value.id;
    await $api(`/organizations/${orgId}/teams/${teamId}/members/${selectedMemberForRole.value.id}`, {
      method: 'PUT',
      body: { role: selectedMemberForRole.value.role }
    });
    const index = teamMembers.value.findIndex((m: any) => m.id === selectedMemberForRole.value.id)
    if (index !== -1) {
      if (teamMembers.value[index].pivot) {
        teamMembers.value[index].pivot.role = selectedMemberForRole.value.role;
      }
    }
    addToast({ type: 'success', title: 'Succès', message: 'Rôle mis à jour.' });
  } catch (err) {
    console.error('Error updating role', err);
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de mettre à jour le rôle.' });
  } finally {
    isEditRoleModalOpen.value = false
  }
}

const isConfirmModalOpen = ref(false)
const confirmModalTitle = ref('')
const confirmModalMessage = ref('')
const pendingDeleteAction = ref<(() => void) | null>(null)

const removeTeamMember = (memberId: number) => {
  if (!activeOrganization.value) return;
  
  const member = teamMembers.value.find((m: any) => m.id === memberId)
  
  confirmModalTitle.value = 'Retirer le membre'
  confirmModalMessage.value = `Voulez-vous vraiment retirer ${member?.name || 'ce membre'} de l'équipe ?`
  
  pendingDeleteAction.value = () => {
    isConfirmModalOpen.value = false
    
    const previousMembers = [...teamMembers.value]
    teamMembers.value = teamMembers.value.filter((m: any) => m.id !== memberId)
    
    let isCancelled = false
    const orgId = activeOrganization.value!.id;
    
    const timeoutId = setTimeout(async () => {
      if (isCancelled) return
      try {
        await $api(`/organizations/${orgId}/teams/${teamId}/members/${memberId}`, { method: 'DELETE' });
      } catch (err) {
        teamMembers.value = previousMembers
        addToast({ type: 'error', title: 'Erreur', message: 'Impossible de retirer le membre.' });
      }
    }, 5000)

    addToast({
      type: 'success',
      title: 'Membre retiré',
      message: 'Le retrait sera définitif dans 5 secondes.',
      duration: 5000,
      action: {
        label: 'Annuler',
        onClick: () => {
          isCancelled = true
          clearTimeout(timeoutId)
          teamMembers.value = previousMembers
          addToast({ type: 'info', title: 'Annulé', message: 'Le retrait a été annulé.' })
        }
      }
    })
  }
  isConfirmModalOpen.value = true
}



// Edit Team Info
const isEditModalOpen = ref(false)
const editTeamForm = ref({ name: '', description: '' })

const openEditModal = () => {
  editTeamForm.value = { name: team.value.name, description: team.value.description || '' }
  isEditModalOpen.value = true
}

const handleEditTeam = async () => {
  if (!activeOrganization.value) return;
  try {
    const orgId = activeOrganization.value.id;
    const res = await $api<any>(`/organizations/${orgId}/teams/${teamId}`, {
      method: 'PUT',
      body: editTeamForm.value
    });
    team.value.name = editTeamForm.value.name;
    team.value.description = editTeamForm.value.description;
    addToast({ type: 'success', title: 'Succès', message: 'Équipe modifiée.' });
  } catch (err) {
    console.error('Error editing team', err);
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de modifier l\'équipe.' });
  } finally {
    isEditModalOpen.value = false
  }
}

// Add Member / Invite Logic
const isAddMemberModalOpen = ref(false)
const searchQuery = ref('')
const selectedRole = ref('membre')

const availableOrgMembers = computed(() => {
  return allOrgMembers.value.filter(orgM => !teamMembers.value.some(tm => tm.id === orgM.id))
})

const filteredMembers = computed(() => {
  if (!searchQuery.value) return availableOrgMembers.value
  const query = searchQuery.value.toLowerCase()
  return availableOrgMembers.value.filter(m => 
    m.name.toLowerCase().includes(query) || 
    m.email.toLowerCase().includes(query)
  )
})

const isEmailQuery = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchQuery.value)
})

const handleAddMember = (member: any) => {
  // Mock adding to local list since there's no backend endpoint to add to team
  teamMembers.value.push({
    id: member.id,
    name: member.name,
    email: member.email,
    pivot: { role: selectedRole.value, joined_at: new Date().toISOString() }
  })
  isAddMemberModalOpen.value = false
  searchQuery.value = ''
  addToast({ type: 'success', title: 'Succès', message: 'Membre ajouté.' });
}

const handleInviteNew = async () => {
  if (!isEmailQuery.value || !activeOrganization.value) return;
  try {
    const data = await $api<{success:boolean, message:string, invitation:any}>(`/invitations`, {
      method: 'POST', 
      body: {
        email: searchQuery.value,
        organization_id: activeOrganization.value.id,
        team_id: teamId,
        role: 'member'
      }
    });

    if (data.success) {
      addToast({ type: 'success', title: 'Succès', message: `Invitation envoyée à ${searchQuery.value}.` });
      isAddMemberModalOpen.value = false;
      searchQuery.value = '';
    }
  } catch (error: any) {
    console.error(error);
    addToast({ type: 'error', title: 'Erreur', message: error?.data?.message || 'Impossible d\'envoyer l\'invitation.' });
  }
}
</script>

<template>
  <div>
    <!-- Header Section -->
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <NuxtLink :to="`/organization/${$route.params.org_id}/team`" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            <Icon name="heroicons:arrow-left" class="w-6 h-6" />
          </NuxtLink>
          <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">{{ team.name }}</h1>
        </div>
        <div class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1 prose dark:prose-invert max-w-none" v-html="team.description"></div>
      </div>
      <div class="flex items-center gap-3 self-end sm:self-auto">
        <button @click="openEditModal" class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-main dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
          <Icon name="heroicons:pencil-square" class="w-5 h-5" />
          Modifier
        </button>
      </div>
    </section>

    <!-- Members List -->
    <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl border border-form-border dark:border-gray-800 shadow-sm overflow-hidden mt-8">
      <div class="p-6 border-b border-form-border dark:border-gray-800 flex justify-between items-center">
        <h3 class="text-xl font-bold text-main dark:text-white">Membres de l'équipe</h3>
        <button @click="isAddMemberModalOpen = true" class="px-4 py-2 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white font-bold rounded-xl neo-emboss active:neo-inset hover:brightness-110 flex items-center gap-2 transition-all shadow-lg text-sm">
          <Icon name="heroicons:user-plus" class="w-5 h-5" />
          Ajouter un membre
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-secondary dark:text-gray-400">
          <thead class="bg-canvas dark:bg-[#151515] text-main dark:text-gray-300 font-medium">
            <tr>
              <th class="px-6 py-4">Nom</th>
              <th class="px-6 py-4">Rôle</th>
              <th class="px-6 py-4 hidden md:table-cell">Rejoint le</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-form-border dark:divide-gray-800">
            <tr v-for="member in teamMembers" :key="member.id" @click="navigateTo(`/profile/${member.id}`)" class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                    {{ member?.name?.charAt(0)?.toUpperCase() || 'U' }}
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium text-main dark:text-white">{{ member?.name || 'Utilisateur' }}</span>
                    <span class="text-xs">{{ member.email }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium" :class="{
                  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': (member.pivot?.role || 'membre').toLowerCase() === 'team_lead',
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': (member.pivot?.role || 'membre').toLowerCase() === 'admin',
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300': (member.pivot?.role || 'membre').toLowerCase() === 'membre'
                }">
                  {{ (member.pivot?.role || 'membre') === 'team_lead' ? 'Team Lead' : 'Membre' }}
                </span>
              </td>
              <td class="px-6 py-4 hidden md:table-cell">
                {{ member.pivot?.joined_at ? new Date(member.pivot.joined_at).toLocaleDateString('fr-FR') : '-' }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button class="p-2 text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Modifier le rôle" @click.stop="openEditRoleModal(member)">
                    <Icon name="heroicons:pencil" class="w-5 h-5" />
                  </button>
                  <button class="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Retirer de l'équipe" @click.stop="removeTeamMember(member.id)">
                    <Icon name="heroicons:trash" class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      


    <!-- Edit Team Modal -->
    <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xl font-bold text-main dark:text-white">Modifier l'équipe</h3>
          <button @click="isEditModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Nom de l'équipe</label>
            <input v-model="editTeamForm.name" type="text" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Description</label>
            <RichTextEditor v-model="editTeamForm.description" class="w-full" />
          </div>
        </div>
        <div class="p-6 border-t border-form-border dark:border-gray-800 flex justify-end gap-3">
          <button @click="isEditModalOpen = false" class="px-4 py-2 font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            Annuler
          </button>
          <button @click="handleEditTeam" class="px-4 py-2 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white font-bold rounded-xl neo-emboss active:neo-inset hover:brightness-110 flex items-center gap-2 transition-all shadow-lg text-sm">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
    </div>

    <!-- Add Member Modal with Search & Invite logic -->
    <div v-if="isAddMemberModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between shrink-0">
          <h3 class="text-xl font-bold text-main dark:text-white">Ajouter un membre</h3>
          <button @click="isAddMemberModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Rechercher ou Inviter (Email)</label>
            <div class="relative">
              <Icon name="heroicons:magnifying-glass" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input v-model="searchQuery" type="text" placeholder="Rechercher un membre ou entrer un email..." class="w-full pl-10 pr-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Rôle dans l'équipe</label>
            <CustomSelect 
              v-model="selectedRole"
              :options="[
                { value: 'membre', label: 'Membre' },
                { value: 'team_lead', label: 'Team Lead' }
              ]"
              placeholder="Sélectionner un rôle"
              buttonClass="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 flex justify-between items-center"
            />
          </div>

          <div class="mt-4 border border-form-border dark:border-gray-800 rounded-xl overflow-hidden bg-canvas dark:bg-[#151515]">
            <ul class="divide-y divide-form-border dark:divide-gray-800 max-h-48 overflow-y-auto custom-scrollbar">
              <li v-for="member in filteredMembers" :key="member.id" @click="handleAddMember(member)" class="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between group transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    {{ member.name.charAt(0) }}
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-main dark:text-white">{{ member.name }}</span>
                    <span class="text-xs text-gray-500">{{ member.email }}</span>
                  </div>
                </div>
                <button class="text-primary opacity-0 group-hover:opacity-100 transition-opacity">Ajouter</button>
              </li>
              
              <!-- Empty state / Invite state -->
              <li v-if="filteredMembers.length === 0" class="px-4 py-4 text-center">
                <div v-if="isEmailQuery" class="flex flex-col items-center gap-2">
                  <span class="text-sm text-gray-500">Aucun membre trouvé avec cet email.</span>
                  <button @click="handleInviteNew" class="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-lg font-medium text-sm flex items-center gap-2">
                    <Icon name="heroicons:envelope" class="w-4 h-4" />
                    Inviter {{ searchQuery }}
                  </button>
                </div>
                <div v-else class="text-sm text-gray-500">
                  Aucun membre trouvé. Saisissez une adresse email valide pour envoyer une invitation.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <!-- Edit Role Modal -->
    <div v-if="isEditRoleModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="isEditRoleModalOpen = false">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-sm border border-form-border dark:border-gray-800 shadow-xl overflow-hidden">
        <div class="p-5 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-lg font-bold text-main dark:text-white">Modifier le rôle</h3>
          <button @click="isEditRoleModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>
        <div class="p-5">
          <div class="mb-4">
            <p class="text-sm text-secondary dark:text-gray-400 mb-4">
              Sélectionnez le nouveau rôle pour <span class="font-bold text-main dark:text-gray-200">{{ selectedMemberForRole?.name }}</span>.
            </p>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Rôle</label>
            <CustomSelect 
              v-model="selectedMemberForRole.role"
              :options="[
                { value: 'membre', label: 'Membre' },
                { value: 'team_lead', label: 'Team Lead' }
              ]"
              placeholder="Sélectionner un rôle"
              buttonClass="w-full px-4 py-2.5 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 flex justify-between items-center"
            />
          </div>
        </div>
        <div class="p-5 border-t border-form-border dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-[#1A1A1D]">
          <button @click="isEditRoleModalOpen = false" class="px-4 py-2 text-sm font-medium text-main dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">
            Annuler
          </button>
          <button @click="updateMemberRole" class="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-blue-600 transition-colors shadow-sm">
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
    
    <!-- Confirm Modal -->
    <ConfirmModal
      :is-open="isConfirmModalOpen"
      :title="confirmModalTitle"
      :message="confirmModalMessage"
      confirm-text="Retirer"
      @close="isConfirmModalOpen = false"
      @confirm="pendingDeleteAction ? pendingDeleteAction() : null"
    />
  </div>
</template>
