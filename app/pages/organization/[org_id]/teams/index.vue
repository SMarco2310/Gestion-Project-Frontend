<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'
import useOrganizations from '~/composables/useOrganizations'
import useTeams from '~/composables/useTeams'

definePageMeta({
  layout: 'custom'
})

const { activeOrganization } = useOrganizations()
const { deleteTeam } = useTeams()
const { $api } = useNuxtApp()
const { addToast } = useToast()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const route = useRoute()
const orgId = computed(() => route.params.org_id as string)

const teams = ref<any[]>([])
const isLoading = ref(true)

const fetchTeams = async () => {
  if (!orgId.value) return;
  isLoading.value = true;
  try {
    const res = await $api<any>(`/organizations/${orgId.value}/teams`, { method: 'GET' });
    teams.value = res.data?.data || res.data || [];
  } catch (err) {
    console.error('Error fetching org teams', err);
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
  if (!orgId.value || !newTeamName.value) return;
  try {
    const res = await $api<any>(`/organizations/${orgId.value}/teams`, {
      method: 'POST',
      body: { name: newTeamName.value, description: newTeamDesc.value }
    });
    teams.value.push(res.team);
    addToast({ type: 'success', title: 'Succès', message: 'Équipe créée avec succès.' });
    isCreateModalOpen.value = false
    newTeamName.value = ''
    newTeamDesc.value = ''
  } catch (err) {
    console.error('Error creating org team', err);
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer l\'équipe.' });
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
  if (!teamToDelete.value || !orgId.value) return
  const teamId = teamToDelete.value as string
  isDeleteModalOpen.value = false
  
  const previousTeams = [...teams.value]
  teams.value = teams.value.filter(t => t.id !== teamId)
  
  let isCancelled = false
  
  const timeoutId = setTimeout(async () => {
    if (isCancelled) return
    try {
      await deleteTeam(orgId.value, teamId)
    } catch (err) {
      teams.value = previousTeams
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'équipe.' })
    }
  }, 5000)

  addToast({
    type: 'success',
    title: 'Équipe supprimée',
    message: 'La suppression sera définitive dans 5 secondes.',
    duration: 5000,
    action: {
      label: 'Annuler',
      onClick: () => {
        isCancelled = true
        clearTimeout(timeoutId)
        teams.value = previousTeams
      }
    }
  })
}

</script>

<template>
  <div @click="activeDropdownId = null">
    <!-- Header Section -->
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Équipes de l'organisation</h1>
        <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1">Gérez toutes les équipes au sein de votre organisation.</p>
      </div>
      <div>
        <button @click="isCreateModalOpen = true" class="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl neo-emboss active:neo-inset hover:brightness-110 flex items-center gap-2 transition-all shadow-lg">
          <Icon name="heroicons:plus" class="w-5 h-5" />
          Nouvelle Équipe
        </button>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <Icon name="eos-icons:loading" class="w-10 h-10 text-primary animate-spin" />
    </div>

    <!-- Teams Grid -->
    <div v-else-if="teams.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      
      <div v-for="team in teams" :key="team.id" class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 border border-form-border dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg transition-all group flex flex-col h-full">
        <div class="flex justify-between items-start mb-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 flex items-center justify-center">
            <Icon name="heroicons:user-group" class="w-6 h-6" />
          </div>
          <div class="relative">
            <button @click.stop="toggleDropdown(team.id)" class="text-gray-400 hover:text-main dark:hover:text-white p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
              <Icon name="heroicons:ellipsis-vertical" class="w-5 h-5" />
            </button>
            <div v-if="activeDropdownId === team.id" class="absolute right-0 mt-2 w-40 bg-card dark:bg-[#1D1D1D] rounded-xl shadow-xl border border-form-border dark:border-gray-800 z-50 overflow-hidden text-main dark:text-gray-300">
              <button @click.stop="confirmDeleteTeam(team.id)" class="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                <Icon name="heroicons:trash" class="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
        
        <h2 class="text-xl font-bold text-main dark:text-white mb-2">{{ team.name }}</h2>
        <p class="text-sm text-secondary dark:text-gray-400 mb-6 flex-grow line-clamp-3">
          <span v-html="team.description || 'Aucune description fournie.'"></span>
        </p>
        
        <div class="flex items-center justify-between pt-4 border-t border-form-border dark:border-gray-800">
          <div class="flex -space-x-2">
            <template v-if="team.members && team.members.length > 0">
              <div v-for="member in team.members.slice(0, 3)" :key="member.id" class="w-8 h-8 rounded-full border-2 border-white dark:border-[#1D1D1D] bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 overflow-hidden shrink-0" :title="member.last_name + ' ' + member.first_name">
                <img :src="member?.profile_picture ? (member.profile_picture.startsWith('http') ? member.profile_picture : apiBase.replace('/api', '') + member.profile_picture) : `https://api.dicebear.com/7.x/initials/svg?seed=${(member?.last_name || '').charAt(0).toUpperCase() + (member?.first_name || '').charAt(0).toUpperCase() || 'U'}&chars=2`" alt="Avatar" class="w-full h-full object-cover" />
              </div>
            </template>
            <div v-if="(team.members_count || 0) > 3" class="w-8 h-8 rounded-full border-2 border-white dark:border-[#1D1D1D] bg-canvas dark:bg-[#151515] flex items-center justify-center text-[10px] font-bold text-secondary dark:text-gray-400">
              +{{ (team.members_count || 0) - 3 }}
            </div>
          </div>
          <span class="text-xs font-medium text-secondary dark:text-gray-500">{{ team.members_count || 0 }} {{ (team.members_count || 0) > 1 ? 'membres' : 'membre' }}</span>
        </div>
      </div>

    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-20 px-4">
      <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
        <Icon name="heroicons:user-group" class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold text-main dark:text-white mb-2">Aucune équipe</h3>
      <p class="text-secondary dark:text-gray-400 text-center max-w-sm mb-6">Vous n'avez pas encore créé d'équipe. Créez-en une pour organiser vos membres.</p>
      <button @click="isCreateModalOpen = true" class="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl neo-emboss active:neo-inset hover:brightness-110 flex items-center gap-2 transition-all shadow-lg">
        <Icon name="heroicons:plus" class="w-6 h-6" />
        Créer une équipe
      </button>
    </div>

    <!-- Create Modal -->
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
            <input v-model="newTeamName" type="text" placeholder="Ex: Développeurs Backend" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
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
          <button @click="handleCreateTeam" class="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors">
            Créer
          </button>
        </div>
      </div>
    </div>

    <ConfirmModal
      :is-open="isDeleteModalOpen"
      title="Supprimer l'équipe"
      message="Voulez-vous vraiment supprimer cette équipe définitivement de l'organisation ?"
      @close="isDeleteModalOpen = false"
      @confirm="executeDeleteTeam"
    />

  </div>
</template>
