<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'
import useWorkspaces from '~/composables/useWorkspaces'
import useOrganizations from '~/composables/useOrganizations'

definePageMeta({
  layout: 'custom'
})

const { activeOrganization } = useOrganizations()
const { activeWorkspace, getWorkspaceTeams, createWorkspaceTeam, attachWorkspaceTeam, detachWorkspaceTeam } = useWorkspaces()
const { $api } = useNuxtApp()
const { addToast } = useToast()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const route = useRoute()
const workspaceId = computed(() => route.params.workspace_id as string)
const orgId = computed(() => route.params.org_id as string)

const teams = ref<any[]>([])
const isLoading = ref(true)

const fetchTeams = async () => {
  if (!workspaceId.value) return;
  isLoading.value = true;
  try {
    teams.value = await getWorkspaceTeams(workspaceId.value);
  } catch (err) {
    console.error('Error fetching workspace teams', err);
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de charger les équipes.' });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchTeams();
})

const isCreateModalOpen = ref(false)
const newTeamName = ref('')
const newTeamDesc = ref('')

const handleCreateTeam = async () => {
  if (!workspaceId.value || !newTeamName.value) return;
  try {
    const team = await createWorkspaceTeam(workspaceId.value, newTeamName.value, newTeamDesc.value);
    teams.value.push(team);
    addToast({ type: 'success', title: 'Succès', message: 'Équipe créée et associée.' });
    isCreateModalOpen.value = false
    newTeamName.value = ''
    newTeamDesc.value = ''
  } catch (err) {
    console.error('Error creating team', err);
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer l\'équipe.' });
  }
}

const isAttachModalOpen = ref(false)
const orgTeams = ref<any[]>([])
const selectedOrgTeam = ref<string>('')
const isSelectOpen = ref(false)

const openAttachModal = async () => {
  isAttachModalOpen.value = true
  try {
    const res = await $api<any>(`/organizations/${orgId.value}/teams`, { method: 'GET' });
    const allOrgTeams = res.data?.data || res.data || [];
    // Filter out teams already in the workspace
    orgTeams.value = allOrgTeams.filter((t: any) => !teams.value.find(wt => wt.id === t.id));
  } catch (err) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de charger les équipes de l\'organisation.' });
  }
}

const handleAttachTeam = async () => {
  if (!workspaceId.value || !selectedOrgTeam.value) return;
  try {
    const team = await attachWorkspaceTeam(workspaceId.value, selectedOrgTeam.value);
    teams.value.push(team);
    addToast({ type: 'success', title: 'Succès', message: 'Équipe associée à l\'espace.' });
    isAttachModalOpen.value = false
    selectedOrgTeam.value = ''
  } catch (err) {
    console.error('Error attaching team', err);
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'associer l\'équipe.' });
  }
}

const activeDropdownId = ref<number | string | null>(null)

const toggleDropdown = (id: number | string) => {
  if (activeDropdownId.value === id) {
    activeDropdownId.value = null
  } else {
    activeDropdownId.value = id
  }
}

const isDeleteModalOpen = ref(false)
const teamToDelete = ref<number | string | null>(null)

const confirmDeleteTeam = (teamId: number | string) => {
  activeDropdownId.value = null
  teamToDelete.value = teamId
  isDeleteModalOpen.value = true
}

const executeDeleteTeam = async () => {
  if (!teamToDelete.value || !workspaceId.value) return
  const teamId = teamToDelete.value as string
  isDeleteModalOpen.value = false
  
  try {
    await detachWorkspaceTeam(workspaceId.value, teamId)
    teams.value = teams.value.filter(t => t.id !== teamId)
    addToast({ type: 'success', title: 'Équipe retirée', message: 'L\'équipe a été retirée de cet espace de travail.' })
  } catch (err) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de retirer l\'équipe.' })
  }
}


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

</script>

<template>
  <div @click="activeDropdownId = null">
    <!-- Header Section -->
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Équipes</h1>
        <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1">Gérez les équipes au sein de votre organisation.</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="openAttachModal" class="px-4 py-2 bg-gray-100 dark:bg-[#1D1D1D] text-main dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center gap-2 transition-all shadow-sm border border-form-border dark:border-gray-800">
          <Icon name="heroicons:link" class="w-5 h-5" />
          Associer une équipe
        </button>
        <button @click="isCreateModalOpen = true" class="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl neo-emboss active:neo-inset hover:brightness-110 flex items-center gap-2 transition-all shadow-lg">
          <Icon name="heroicons:plus" class="w-5 h-5" />
          Nouvelle Équipe
        </button>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <Icon name="eos-icons:loading" class="w-10 h-10 text-cyan-600 animate-spin" />
    </div>

    <!-- Teams Grid -->
    <div v-else-if="teams.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
      
      <div v-for="(team, index) in teams" :key="team.id" @click="navigateTo(`/organization/${$route.params.org_id}/workspace/${$route.params.workspace_id}/team/${team.id}`)" class="bg-[#ffffff] dark:bg-[#1A1A1D] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-cyan-600/30 dark:hover:border-cyan-600/30 hover:shadow-sm transition-all group flex flex-col min-h-[280px] h-full cursor-pointer shadow-sm" :class="activeDropdownId === team.id ? 'relative z-50' : 'relative z-10'">
        
        <!-- Top bar -->
        <div class="flex justify-between items-start mb-4">
          <div class="px-3 py-1 bg-black/20 dark:bg-white/20 text-white dark:text-gray-900 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm">
            {{ team.reference_code || 'EQ-XX' }}
          </div>
          <div class="relative">
            <button @click.stop="toggleDropdown(team.id)" class="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <Icon name="heroicons:ellipsis-vertical" class="w-5 h-5" />
            </button>
            <div v-if="activeDropdownId === team.id" class="absolute right-0 mt-2 w-40 bg-card dark:bg-[#1D1D1D] rounded-xl shadow-xl border border-form-border dark:border-gray-800 z-[100] overflow-hidden text-main dark:text-gray-300">
              <button @click.stop="activeDropdownId = null; navigateTo(`/organization/${$route.params.org_id}/workspace/${$route.params.workspace_id}/team/${team.id}`)" class="w-full text-left px-4 py-3 text-sm font-medium hover:bg-canvas dark:hover:bg-gray-800 hover:text-main dark:hover:text-white transition-colors flex items-center gap-2">
                <Icon name="heroicons:pencil" class="w-4 h-4" /> Gérer
              </button>
              <button @click.stop="confirmDeleteTeam(team.id)" class="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                <Icon name="heroicons:minus-circle" class="w-4 h-4" /> Retirer
              </button>
            </div>
          </div>
        </div>
        
        <!-- Icon and Status -->
        <div class="flex flex-col mb-4 gap-2.5">
          <Icon name="heroicons:user-group" class="w-10 h-10 text-cyan-600 drop-shadow-sm dark:text-cyan-500/50 mb-2" />
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full" :class="team.members_count > 0 ? 'bg-cyan-600' : 'bg-red-500'"></div>
            <span class="text-[10px] text-gray-500 dark:text-gray-400 font-mono tracking-wide">Actif &middot; {{ team.members_count || 0 }} membres</span>
          </div>
        </div>

        <!-- Title and Description -->
        <h2 class="text-xl font-bold text-main dark:text-white mb-2 truncate shrink-0">{{ team.name }}</h2>
        <p class="text-[13px] text-secondary dark:text-gray-500 mb-6 flex-grow line-clamp-2 leading-relaxed">
          <span v-html="team.description || 'Aucune description fournie.'"></span>
        </p>
        
        <!-- Footer avatars -->
        <div class="w-full h-px bg-gray-200/60 dark:bg-gray-800 mb-4 mt-auto"></div>
        <div class="flex items-center justify-between">
          <div class="flex -space-x-2">
            <template v-if="team.members && team.members.length > 0">
              <div v-for="member in team.members.slice(0, 3)" :key="member.id" class="w-8 h-8 rounded-full border-[2.5px] border-white dark:border-[#1D1D1D] flex items-center justify-center shrink-0 relative overflow-hidden bg-white dark:bg-transparent" :title="member.last_name + ' ' + member.first_name">
                 <div v-if="!member.profile_picture" class="absolute inset-0 flex items-center justify-center rounded-full border-[1.5px]" :style="{ borderColor: getAvatarStyle(member.last_name + member.first_name).border, color: getAvatarStyle(member.last_name + member.first_name).text, backgroundColor: getAvatarStyle(member.last_name + member.first_name).bg }">
                    <span class="text-[10px] font-bold">{{ getInitials(member) }}</span>
                 </div>
                 <img v-else :src="member.profile_picture.startsWith('http') ? member.profile_picture : apiBase.replace('/api', '') + member.profile_picture" alt="Avatar" class="w-full h-full object-cover" />
              </div>
            </template>
            <div v-if="(team.members_count || 0) > 3" class="w-8 h-8 rounded-full border-[2.5px] border-white dark:border-[#1D1D1D] bg-gray-100 dark:bg-[#2A2A2D] flex items-center justify-center text-[9px] font-bold text-gray-500 z-10 relative">
              +{{ (team.members_count || 0) - 3 }}
            </div>
          </div>
          <span class="text-[10px] font-mono tracking-wide text-gray-400 dark:text-gray-600">{{ team.members_count || 0 }} membres</span>
        </div>
      </div>

    </div>
    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-20 px-4">
      <div class="w-16 h-16 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center mb-4">
        <Icon name="heroicons:user-group" class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold text-main dark:text-white mb-2">Aucune équipe</h3>
      <p class="text-secondary dark:text-gray-400 text-center max-w-sm mb-6">Vous n'avez pas encore créé d'équipe. Créez-en une pour organiser vos membres.</p>
      <button @click="isCreateModalOpen = true" class="px-8 py-3.5 bg-cyan-600 text-white font-bold rounded-xl neo-emboss active:neo-inset hover:brightness-110 flex items-center gap-2 transition-all shadow-lg">
        <Icon name="heroicons:plus" class="w-6 h-6" />
        Créer une équipe
      </button>
    </div>

    <!-- Create Modal (Static) -->
    <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xl font-bold text-main dark:text-white">Créer une équipe</h3>
          <button @click="isCreateModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Nom de l'équipe</label>
            <input v-model="newTeamName" type="text" placeholder="Ex: Développeurs Backend" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-600/50" />
          </div>
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Description</label>
            <RichTextEditor v-model="newTeamDesc" class="w-full" />
          </div>
        </div>
        <div class="p-6 border-t border-form-border dark:border-gray-800 flex justify-end gap-3">
          <button @click="isCreateModalOpen = false" class="px-4 py-2 font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            Annuler
          </button>
          <button @click="handleCreateTeam" class="px-4 py-2 bg-cyan-600 text-white font-medium rounded-xl hover:bg-cyan-600 transition-colors">
            Créer
          </button>
        </div>
      </div>
    </div>

    <!-- Attach Modal -->
    <div v-if="isAttachModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xl font-bold text-main dark:text-white">Associer une équipe</h3>
          <button @click="isAttachModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div v-if="orgTeams.length > 0">
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Sélectionnez une équipe de l'organisation</label>
            <div class="relative">
              <button @click="isSelectOpen = !isSelectOpen" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-600/50 flex justify-between items-center text-left transition-colors cursor-pointer">
                <span :class="{'text-gray-400': !selectedOrgTeam}">
                  {{ selectedOrgTeam ? orgTeams.find(t => t.id === selectedOrgTeam)?.name : 'Choisir une équipe...' }}
                </span>
                <Icon name="heroicons:chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': isSelectOpen }" />
              </button>
              
              <div v-if="isSelectOpen" @click="isSelectOpen = false" class="fixed inset-0 z-40"></div>
              
              <Transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <div v-if="isSelectOpen" class="absolute z-50 w-full mt-2 bg-card dark:bg-[#1D1D1D] rounded-xl shadow-lg border border-form-border dark:border-gray-800 py-1 max-h-60 overflow-auto custom-scrollbar">
                  <div v-for="t in orgTeams" :key="t.id" @click="selectedOrgTeam = t.id; isSelectOpen = false" class="px-4 py-3 mx-1 my-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between transition-colors">
                    <span class="text-main dark:text-white font-medium">{{ t.name }}</span>
                    <Icon v-if="selectedOrgTeam === t.id" name="heroicons:check" class="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>
              </Transition>
            </div>
          </div>
          <div v-else class="text-center py-6">
            <Icon name="heroicons:information-circle" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p class="text-secondary dark:text-gray-400">Aucune autre équipe disponible dans l'organisation.</p>
          </div>
        </div>
        <div class="p-6 border-t border-form-border dark:border-gray-800 flex justify-end gap-3">
          <button @click="isAttachModalOpen = false" class="px-4 py-2 font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            Annuler
          </button>
          <button @click="handleAttachTeam" :disabled="!selectedOrgTeam" class="px-4 py-2 bg-cyan-600 text-white font-medium rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Associer
          </button>
        </div>
      </div>
    </div>

    <ConfirmModal
      :is-open="isDeleteModalOpen"
      title="Retirer l'équipe"
      message="Voulez-vous vraiment retirer cette équipe de cet espace de travail ? L'équipe existera toujours dans l'organisation."
      @close="isDeleteModalOpen = false"
      @confirm="executeDeleteTeam"
    />

  </div>
</template>
