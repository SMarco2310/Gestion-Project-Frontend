<script setup lang="ts">
definePageMeta({
  // middleware: 'auth',
})

const route = useRoute()
const { getProjet } = useProjets()

const projet = await getProjet(route.params.id as string)

const isOpen = ref(true)

const handleClose = () => {
  isOpen.value = false
  navigateTo('/projets')
}

const { isOwner } = useAuth()

const isAddDropdownOpen = ref(false)
const assignSearchQuery = ref('')

const assignedMembers = ref([
  { id: 1, name: 'Alice Smith', email: 'alice@example.com' }
])
const assignedTeams = ref([
  { id: 1, name: 'Développement' }
])

const availableMembers = ref([
  { id: 2, name: 'Bob Jones', email: 'bob@example.com' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' }
])
const availableTeams = ref([
  { id: 2, name: 'Design' }
])

const filteredAssignees = computed(() => {
  const query = assignSearchQuery.value.toLowerCase()
  return {
    members: availableMembers.value.filter(m => m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)),
    teams: availableTeams.value.filter(t => t.name.toLowerCase().includes(query))
  }
})

const assignMember = (member: any) => {
  assignedMembers.value.push(member)
  availableMembers.value = availableMembers.value.filter(m => m.id !== member.id)
  isAddDropdownOpen.value = false
  assignSearchQuery.value = ''
}

const assignTeam = (team: any) => {
  assignedTeams.value.push(team)
  availableTeams.value = availableTeams.value.filter(t => t.id !== team.id)
  isAddDropdownOpen.value = false
  assignSearchQuery.value = ''
}

</script>

<template>
  <Transition name="slide-over">
    <div v-if="isOpen" class="fixed inset-0 z-40 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40" @click="handleClose" />

      <!-- Sheet -->
      <aside class="relative z-50 w-full max-w-2xl h-full bg-white dark:bg-[#161618] shadow-2xl overflow-y-auto p-8">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white">
              <Icon name="heroicons:briefcase" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-sm text-secondary dark:text-gray-400">{{ projet?.reference_code || `PROJ-${projet?.id}` }}</p>
              <h2 class="text-xl font-bold text-main dark:text-gray-200">{{ projet?.name }}</h2>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button class="text-secondary hover:text-main dark:hover:text-gray-200">
              <Icon name="heroicons:pencil" class="w-5 h-5" />
            </button>
            <button class="text-secondary hover:text-red-500">
              <Icon name="heroicons:trash" class="w-5 h-5" />
            </button>
            <button class="text-secondary hover:text-main dark:hover:text-gray-200" @click="handleClose">
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <section class="mt-8">
          <h3 class="font-bold text-main dark:text-gray-200 mb-3">Description</h3>
          <p class="text-secondary dark:text-gray-400 whitespace-pre-line">{{ projet?.description }}</p>
        </section>

        <!-- Équipe du projet -->
        <section class="mt-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-main dark:text-gray-200">Équipe du projet</h3>
            <div class="relative" v-if="isOwner">
              <button @click="isAddDropdownOpen = !isAddDropdownOpen" class="px-3 py-1.5 bg-canvas dark:bg-[#1A1A1D] text-primary dark:text-blue-400 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-xs border border-form-border dark:border-gray-800 shadow-sm">
                <Icon name="heroicons:plus" class="w-4 h-4" />
                Ajouter
              </button>
              
              <div v-if="isAddDropdownOpen" @click="isAddDropdownOpen = false" class="fixed inset-0 z-40"></div>
              <div v-if="isAddDropdownOpen" class="absolute right-0 top-10 mt-1 w-64 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-xl border border-form-border dark:border-gray-800 z-50 flex flex-col max-h-[300px] overflow-hidden">
                <div class="p-2 border-b border-form-border dark:border-gray-800 shrink-0">
                  <input v-model="assignSearchQuery" type="text" placeholder="Rechercher..." class="w-full bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 rounded px-3 py-2 text-sm text-main dark:text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div class="overflow-y-auto custom-scrollbar flex-1 p-1">
                  <div v-if="filteredAssignees.teams.length > 0">
                    <div class="px-2 py-1 text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">Équipes</div>
                    <button v-for="team in filteredAssignees.teams" :key="team.id" @click="assignTeam(team)" class="w-full text-left px-2 py-1.5 rounded hover:bg-canvas dark:hover:bg-gray-800 flex items-center gap-2 group transition-colors">
                      <div class="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Icon name="heroicons:user-group" class="w-3.5 h-3.5" />
                      </div>
                      <span class="text-sm font-medium text-main dark:text-gray-300 truncate">{{ team.name }}</span>
                    </button>
                  </div>
                  <div v-if="filteredAssignees.members.length > 0" :class="{'mt-2 pt-2 border-t border-form-border dark:border-gray-800': filteredAssignees.teams.length > 0}">
                    <div class="px-2 py-1 text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">Membres</div>
                    <button v-for="member in filteredAssignees.members" :key="member.id" @click="assignMember(member)" class="w-full text-left px-2 py-1.5 rounded hover:bg-canvas dark:hover:bg-gray-800 flex items-center gap-2 group transition-colors">
                      <div class="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {{ member.name.charAt(0) }}
                      </div>
                      <div class="flex flex-col truncate">
                        <span class="text-sm font-medium text-main dark:text-gray-300 truncate">{{ member.name }}</span>
                      </div>
                    </button>
                  </div>
                  <div v-if="filteredAssignees.teams.length === 0 && filteredAssignees.members.length === 0" class="p-4 text-center text-xs text-secondary dark:text-gray-500">
                    Aucun résultat trouvé
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-2">
            <!-- Assigned Teams -->
            <div v-for="team in assignedTeams" :key="'t-'+team.id" class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg text-sm font-medium">
              <Icon name="heroicons:user-group" class="w-4 h-4" />
              {{ team.name }}
              <button v-if="isOwner" @click="assignedTeams = assignedTeams.filter(t => t.id !== team.id); availableTeams.push(team)" class="hover:text-blue-900 dark:hover:text-blue-200 ml-1">
                <Icon name="heroicons:x-mark" class="w-4 h-4" />
              </button>
            </div>
            
            <!-- Assigned Members -->
            <div v-for="member in assignedMembers" :key="'m-'+member.id" @click="navigateTo(`/profile/${member.id}`)" class="flex items-center gap-2 px-3 py-1.5 bg-canvas dark:bg-[#1A1A1D] text-main dark:text-gray-300 border border-form-border dark:border-gray-800 rounded-lg text-sm font-medium cursor-pointer hover:border-primary dark:hover:border-blue-500/50 transition-colors group">
              <div class="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold shrink-0">
                {{ member.name.charAt(0) }}
              </div>
              <span class="group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{{ member.name }}</span>
              <button v-if="isOwner" @click.stop="assignedMembers = assignedMembers.filter(m => m.id !== member.id); availableMembers.push(member)" class="hover:text-red-500 dark:hover:text-red-400 ml-1 text-secondary dark:text-gray-500 transition-colors">
                <Icon name="heroicons:x-mark" class="w-4 h-4" />
              </button>
            </div>
            
            <div v-if="assignedTeams.length === 0 && assignedMembers.length === 0" class="text-sm text-secondary dark:text-gray-500 italic">
              Aucun membre ou équipe assigné.
            </div>
          </div>
        </section>

        <!-- Add Progression globale, Activité récente sections here, 
             using real fields once your API returns them -->
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.slide-over-enter-active,
.slide-over-leave-active {
  transition: opacity 0.2s ease;
}
.slide-over-enter-from,
.slide-over-leave-to {
  opacity: 0;
}
</style>