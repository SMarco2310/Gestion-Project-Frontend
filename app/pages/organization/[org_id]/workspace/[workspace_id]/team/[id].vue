<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '~/composables/useToast'
import useProjets from '~/composables/useProjets'
import useTasks from '~/composables/useTasks'

definePageMeta({
  layout: 'custom'
})

const route = useRoute()
const { goBack: smartBack } = useSmartBack()
const goBack = () => {
  smartBack(`/organization/${route.params.org_id}/workspace/${route.params.workspace_id}/team`)
}
const { isOwner } = useAuth()
const { activeOrganization } = useOrganizations()
const { projets, getProjets } = useProjets()
const { tasks, getTasks } = useTasks()
const { $api } = useNuxtApp()
const teamId = route.params.id
const orgId = route.params.org_id

const { addToast } = useToast()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const team = ref<any>({ name: '', description: '', created_at: '' })
const teamMembers = ref<any[]>([])
const allOrgMembers = ref<any[]>([])
const isLoading = ref(true)

const fetchTeamData = async () => {
  if (!orgId) return;
  isLoading.value = true;
  try {
    const [teamRes, membersRes] = await Promise.all([
      $api<any>(`/organizations/${orgId}/teams/${teamId}`, { method: 'GET' }),
      $api<any>(`/organizations/${orgId}/members`, { method: 'GET' })
    ]);
    
    team.value = teamRes.team;
    teamMembers.value = teamRes.team.members || [];
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
  getProjets();
  getTasks();
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

const handleAddMember = async (member: any) => {
  try {
    const data = await $api(`/organizations/${orgId}/teams/${teamId}/members`, {
      method: 'POST',
      body: {
        user_id: member.id,
        role: selectedRole.value
      }
    });
    
    // Add to local state after successful backend creation
    teamMembers.value.push({
      id: member.id,
      name: member.name || `${member.last_name} ${member.first_name}`,
      email: member.email,
      pivot: { role: selectedRole.value, joined_at: new Date().toISOString() }
    })
    isAddMemberModalOpen.value = false
    searchQuery.value = ''
    addToast({ type: 'success', title: 'Succès', message: 'Membre ajouté avec succès.' });
  } catch (err: any) {
    addToast({ type: 'error', title: 'Erreur', message: err?.data?.message || 'Impossible d\'ajouter le membre.' });
  }
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

// --- Projects & Progress Logic ---
const teamProjects = computed(() => {
  return projets.value.filter(p => {
    // Determine if project belongs to this team
    if (p.teams && Array.isArray(p.teams)) {
      return p.teams.some((t: any) => String(t.id) === String(teamId))
    }
    return false; // Fallback if API doesn't return teams inside project
  })
})

const getProjectProgress = (projectId: string | number) => {
  const projectTasks = tasks.value.filter((task) => String(task.projet_id) === String(projectId))
  if (projectTasks.length === 0) return 0
  const doneTasks = projectTasks.filter((task) => task.status && task.status.toLowerCase() === 'done').length
  return Math.round((doneTasks / projectTasks.length) * 100)
}

const getProjectColorClass = (color?: string) => {
  const colors: Record<string, string> = {
    purple: 'from-purple-400 to-purple-600',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-emerald-400 to-emerald-600',
    rose: 'from-rose-400 to-rose-600',
    amber: 'from-amber-400 to-amber-600',
    slate: 'from-slate-400 to-slate-600',
  }
  return colors[color || ''] || colors['purple']
}

const getProjectBgColorClass = (color?: string) => {
  const colors: Record<string, string> = {
    purple: 'bg-purple-500',
    blue: 'bg-primary',
    green: 'bg-emerald-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-500',
  }
  return colors[color || ''] || colors['purple']
}

// --- Avatar Helpers ---
const getInitials = (member: any) => {
  return ((member?.last_name || '').charAt(0) + (member?.first_name || '').charAt(0)).toUpperCase() || 'U'
}

const avatarColors = [
  { border: '#3B82F6', text: '#3B82F6', bg: '#EFF6FF' },
  { border: '#F97316', text: '#F97316', bg: '#FFF7ED' },
  { border: '#EAB308', text: '#EAB308', bg: '#FEFCE8' },
  { border: '#10B981', text: '#10B981', bg: '#ECFDF5' },
  { border: '#8B5CF6', text: '#8B5CF6', bg: '#F5F3FF' },
]

const getAvatarStyle = (name: string) => {
  if (!name) name = 'User'
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]!;
}

const confirmDeleteTeamClick = () => {
  pendingDeleteAction.value = async () => {
    isConfirmModalOpen.value = false;
    // Implement team deletion if needed, but for now just navigate back
    navigateTo(`/organization/${orgId}/workspace/${route.params.workspace_id}/team`);
  }
  confirmModalTitle.value = 'Supprimer l\'équipe';
  confirmModalMessage.value = 'Voulez-vous vraiment supprimer cette équipe ? Cette action est irréversible.';
  isConfirmModalOpen.value = true;
}

</script>

<template>
  <div class="w-full px-4 md:px-6 lg:px-8 pb-12">
    <!-- Header Controls -->
    <div class="flex items-center gap-4 mb-6">
      <button @click="goBack" class="w-10 h-10 rounded-full border-[3px] border-white dark:border-[#2A2A2D] flex items-center justify-center bg-[#1D1D1D] text-white shadow-md hover:scale-105 transition-all" title="Retour">
        <Icon name="heroicons:chevron-left" class="w-5 h-5 font-bold" />
      </button>
    </div>

    <!-- Main Hero Banner -->
    <div class="bg-[#F5F4F1] dark:bg-[#1A1A1D] rounded-[32px] p-8 md:p-12 mb-8 border border-gray-200 dark:border-gray-800 relative">
      <div class="absolute top-6 left-8 px-3 py-1 bg-black/10 dark:bg-white/10 text-main dark:text-gray-300 rounded-full text-[11px] font-bold tracking-wider uppercase">
        {{ team.reference_code || 'EQ-XX' }}
      </div>
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-8">
        <div class="flex items-center gap-6">
          <div class="w-24 h-24 rounded-3xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Icon name="heroicons:user-group" class="w-10 h-10" />
          </div>
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-white mb-2">{{ team.name }}</h1>
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span class="text-xs text-secondary dark:text-gray-400 font-mono tracking-wide">Actif &middot; {{ teamMembers.length }} membres</span>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <button @click="openEditModal" class="px-5 py-2.5 bg-[#F5F4F1] dark:bg-[#1A1A1D] border border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 text-main dark:text-white font-medium rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm">
            <Icon name="heroicons:pencil" class="w-4 h-4" /> Modifier
          </button>
          <button @click="confirmDeleteTeamClick" class="w-10 h-10 border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center justify-center bg-white dark:bg-[#1D1D1D] shadow-sm">
            <Icon name="heroicons:trash" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Bento Box Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column -->
      <div class="lg:col-span-7 flex flex-col gap-6">
        
        <!-- Description Panel -->
        <div class="bg-[#F5F4F1] dark:bg-[#1A1A1D] rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
          <h3 class="text-[11px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase mb-4">Description</h3>
          <div class="text-main dark:text-gray-300 text-[15px] leading-relaxed" v-html="team.description || 'Aucune description fournie.'"></div>
        </div>

        <!-- Projects Panel -->
        <div class="bg-[#F5F4F1] dark:bg-[#1A1A1D] rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
          <h3 class="text-lg font-bold text-main dark:text-white mb-6">Projets de l'équipe</h3>
          <div class="space-y-4">
            <div v-if="teamProjects.length === 0" class="text-sm text-secondary dark:text-gray-500">Aucun projet associé à cette équipe.</div>
            
            <div v-for="project in teamProjects" :key="project.id" class="flex items-center justify-between p-4 bg-[#F8F9FA] dark:bg-[#222224] rounded-2xl border border-gray-100 dark:border-gray-800">
              <div class="flex items-center gap-3 shrink-0">
                <div class="w-2 h-2 rounded-full" :class="getProjectBgColorClass(project.color)"></div>
                <span class="font-medium text-main dark:text-gray-200 text-sm whitespace-nowrap">{{ project.name }}</span>
              </div>
              <div class="flex items-center justify-end gap-6 flex-1 ml-8 max-w-sm">
                <div class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r transition-all rounded-full" :class="getProjectColorClass(project.color)" :style="{ width: getProjectProgress(project.id) + '%' }"></div>
                </div>
                <span class="text-[11px] font-mono text-secondary dark:text-gray-500 tracking-wider shrink-0">{{ project.reference_code || `PRJ-${String(project.id).substring(0, 5).toUpperCase()}` }}</span>
              </div>
            </div>
            

            
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="lg:col-span-5 flex flex-col gap-6">
        
        <!-- Members Panel -->
        <div class="bg-[#F5F4F1] dark:bg-[#1A1A1D] rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-[11px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase">Membres</h3>
            <button @click="isAddMemberModalOpen = true" class="text-[11px] font-bold text-[#10B981] flex items-center gap-1 hover:brightness-110">
              <Icon name="heroicons:plus" class="w-3 h-3" /> AJOUTER
            </button>
          </div>
          
          <div class="flex flex-col gap-4">
            <div v-for="member in teamMembers" :key="member.id" class="flex items-center justify-between group">
              <div class="flex items-center gap-4 cursor-pointer" @click="navigateTo(`/profile/${member.id}`)">
                <div class="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center relative overflow-hidden bg-white dark:bg-transparent shadow-sm">
                   <div v-if="!member.profile_picture" class="absolute inset-0 flex items-center justify-center rounded-full border-[1.5px]" :style="{ borderColor: getAvatarStyle(member.name || member.last_name + member.first_name).border, color: getAvatarStyle(member.name || member.last_name + member.first_name).text, backgroundColor: getAvatarStyle(member.name || member.last_name + member.first_name).bg }">
                      <span class="text-[13px] font-bold">{{ getInitials(member) }}</span>
                   </div>
                   <img v-else :src="member.profile_picture.startsWith('http') ? member.profile_picture : apiBase.replace('/api', '') + member.profile_picture" alt="Avatar" class="w-full h-full object-cover" />
                </div>
                <span class="font-bold text-main dark:text-gray-200 text-[15px]">{{ member.name || ((member.first_name || '') + ' ' + (member.last_name || '')).trim() }}</span>
              </div>
              <div class="flex items-center gap-2">
                <button @click="openEditRoleModal(member)" class="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors" 
                  :class="member.pivot?.role === 'team_lead' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'text-secondary dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'">
                  {{ member.pivot?.role === 'team_lead' ? 'Responsable' : 'Membre' }}
                </button>
                <button @click="removeTeamMember(member.id)" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  <Icon name="heroicons:x-mark" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Metadata Panel -->
        <div class="bg-[#F5F4F1] dark:bg-[#1A1A1D] rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h3 class="text-[11px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase mb-2">Créée le</h3>
              <p class="font-mono text-[13px] text-main dark:text-gray-300 font-medium">{{ team.created_at ? new Date(team.created_at).toLocaleDateString('fr-FR') : '03/07/2026' }}</p>
            </div>
            <div>
              <h3 class="text-[11px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase mb-2">Membres</h3>
              <p class="font-mono text-[13px] text-main dark:text-gray-300 font-medium">{{ teamMembers.length }}</p>
            </div>
          </div>
        </div>

      </div>
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
          <button @click="handleEditTeam" class="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl neo-emboss active:neo-inset hover:brightness-110 flex items-center gap-2 transition-all shadow-lg text-sm">
            Enregistrer
          </button>
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
                  <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    {{ (member?.last_name || 'U').charAt(0).toUpperCase() + (member?.first_name || '').charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-main dark:text-white">{{ member.name || ((member?.first_name || '') + ' ' + (member?.last_name || '')).trim() || 'Utilisateur' }}</span>
                    <span class="text-xs text-gray-500">{{ member.email }}</span>
                  </div>
                </div>
                <button class="text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity">Ajouter</button>
              </li>
              
              <!-- Empty state / Invite state -->
              <li v-if="filteredMembers.length === 0" class="px-4 py-4 text-center">
                <div v-if="isEmailQuery" class="flex flex-col items-center gap-2">
                  <span class="text-sm text-gray-500">Aucun membre trouvé avec cet email.</span>
                  <button @click="handleInviteNew" class="px-4 py-2 bg-cyan-600/10 text-cyan-600 hover:bg-cyan-600/20 transition-colors rounded-lg font-medium text-sm flex items-center gap-2">
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
          <button @click="updateMemberRole" class="px-4 py-2 text-sm font-medium bg-cyan-600 text-white rounded-xl hover:bg-cyan-600 transition-colors shadow-sm">
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
