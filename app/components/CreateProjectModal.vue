<script setup lang="ts">
import { ref, watch } from 'vue'
import useAuth from '~/composables/useAuth'
import { ProjectStatus } from '~/utils/enums'

const props = defineProps<{
  isOpen: boolean
  createProject?: (data: any) => Promise<unknown> | unknown
}>()

const { activeOrganization, getMembers } = useOrganizations()
const { getTeams } = useTeams()
const { user } = useAuth()
const emit = defineEmits(['close', 'submit'])

const isAddDropdownOpen = ref(false)
const assignSearchQuery = ref('')
const assignedMembers = ref<any[]>([])
const assignedTeams = ref<any[]>([])
const availableMembers = ref<any[]>([])
const availableTeams = ref<any[]>([])

const filteredAssignees = computed(() => {
  const query = assignSearchQuery.value.toLowerCase()
  return {
    members: availableMembers.value.filter(m => {
      if (assignedMembers.value.some(am => am.id === m.id)) return false;
      const fullName = `${m.first_name || ''} ${m.last_name || ''}`.trim().toLowerCase()
      return fullName.includes(query) || (m.email?.toLowerCase() || '').includes(query)
    }),
    teams: availableTeams.value.filter(t => !assignedTeams.value.some(at => at.id === t.id) && t.name.toLowerCase().includes(query))
  }
})

const assignMember = (member: any) => {
  assignedMembers.value.push(member)
  isAddDropdownOpen.value = false
  assignSearchQuery.value = ''
}

const removeMember = (member: any) => {
  assignedMembers.value = assignedMembers.value.filter(m => m.id !== member.id)
}

const assignTeam = (team: any) => {
  assignedTeams.value.push(team)
  isAddDropdownOpen.value = false
  assignSearchQuery.value = ''
}

const removeTeam = (team: any) => {
  assignedTeams.value = assignedTeams.value.filter(t => t.id !== team.id)
}


const getTodayDate = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
const minDate = ref(getTodayDate())

const form = ref({
  name: '',
  description: '',
  status: ProjectStatus.TO_DO,
  color: 'blue',
  start_date: getTodayDate(),
  end_date: getTodayDate()
})

const errors = ref({
  title: false,
  description: false,
  dates: false
})

// Reset form when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.value = {
      name: '',
      description: '',
      status: ProjectStatus.TO_DO,
      color: 'blue',
      start_date: getTodayDate(),
      end_date: getTodayDate()
    }
    assignedMembers.value = []
    assignedTeams.value = []
    errors.value = { title: false, description: false, dates: false }
    fetchAssignees()
  }
})

const fetchAssignees = async () => {
  if (activeOrganization.value) {
    const membersData = await getMembers(activeOrganization.value.id)
    availableMembers.value = membersData
    const teamsData = await getTeams(activeOrganization.value.id)
    availableTeams.value = teamsData
  }
}

const close = () => {
  emit('close')
}

const submit = async () => {
  errors.value.title = !form.value.name.trim()
  errors.value.description = !form.value.description.trim()
  errors.value.dates = !form.value.start_date || !form.value.end_date || (form.value.end_date < form.value.start_date)

  if (errors.value.title || errors.value.description || errors.value.dates) {
    return // Stop submission if validation fails
  }

  const payload = {
    ...form.value,
    status: form.value.status,
    team_ids: assignedTeams.value.map(t => t.id),
    user_ids: assignedMembers.value.map(m => m.id)
  }

  try {
    if (props.createProject) {
      await props.createProject(payload)
    } else {
      emit('submit', payload)
    }

    close()
  } catch (error) {
    console.error(error)
    throw error
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" @click.self="close">
        <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] w-full max-w-lg max-h-full rounded-xl flex flex-col overflow-hidden" role="dialog" aria-modal="true">
          
          <!-- Header -->
          <div class="px-6 py-4 flex justify-between items-center shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
            <h2 class="text-xl font-bold text-main dark:text-white">Créer un nouveau projet</h2>
            <button @click="close" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5">
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>

          <!-- Body / Form -->
          <div class="p-6 flex-1 overflow-y-auto">
            <div class="flex flex-col gap-5">
              
              <!-- Title -->
              <div>
                <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">
                  Titre du projet <span class="text-red-500">*</span>
                </label>
                <input 
                  v-model="form.name" 
                  type="text" 
                  class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white placeholder-secondary dark:placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 transition-all"
                  :class="errors.title ? 'focus:ring-red-500' : 'focus:ring-primary dark:focus:ring-primary'"
                  placeholder="Nom du projet"
                />
                <p v-if="errors.title" class="text-red-500 text-xs mt-1 font-medium">Ce champ est requis.</p>
              </div>

              <!-- Status Row -->
              <div class="flex gap-4">
                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Statut</label>
                  <CustomSelect 
                    v-model="form.status"
                    :options="[
                      { value: ProjectStatus.TO_DO, label: 'À faire' },
                      { value: ProjectStatus.IN_PROGRESS, label: 'En cours' },
                      { value: ProjectStatus.DONE, label: 'Terminé' }
                    ]"
                    placeholder="Statut"
                    buttonClass="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary transition-all cursor-pointer flex justify-between items-center text-sm"
                  />
                </div>
              </div>

              <!-- Dates -->
              <div class="flex flex-col sm:flex-row gap-4">
                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Date de début</label>
                  <div class="relative">
                    <Icon name="heroicons:calendar" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary dark:text-gray-500 pointer-events-none" />
                    <input 
                      v-model="form.start_date" 
                      type="date" 
                      :min="minDate"
                      class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary transition-all"
                    />
                  </div>
                </div>
                <div class="flex-1 relative">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Date de fin prévue</label>
                  <div class="relative">
                    <Icon name="heroicons:calendar" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary dark:text-gray-500 pointer-events-none" />
                    <input 
                      v-model="form.end_date" 
                      type="date" 
                      :min="form.start_date || minDate"
                      class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary transition-all"
                    />
                  </div>
                  <p v-if="errors.dates" class="text-red-500 text-xs mt-1 absolute -bottom-5 left-0 w-full font-medium">Dates invalides.</p>
                </div>
              </div>

              <!-- Équipe du projet -->
              <div class="bg-gray-50/50 dark:bg-[#1A1A1D] rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div class="flex items-center justify-between mb-3">
                  <span class="block text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">Équipe du projet</span>
                  <div class="relative">
                    <button @click.prevent="isAddDropdownOpen = !isAddDropdownOpen" class="text-xs font-bold text-cyan-600 flex items-center gap-1 hover:underline">
                      <Icon name="heroicons:plus" class="w-3 h-3" /> Ajouter
                    </button>
                    <div v-if="isAddDropdownOpen" @click="isAddDropdownOpen = false" class="fixed inset-0 z-40"></div>
                    <div v-if="isAddDropdownOpen" class="absolute right-0 top-6 mt-1 w-56 bg-white dark:bg-[#252525] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 z-50 flex flex-col max-h-[280px] overflow-hidden">
                      <div class="p-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
                        <input v-model="assignSearchQuery" type="text" placeholder="Rechercher..." class="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-800 rounded px-3 py-2 text-sm text-main dark:text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div class="overflow-y-auto flex-1 p-1">
                        <div v-if="filteredAssignees.teams.length > 0">
                          <div class="px-2 py-1 text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">Équipes</div>
                          <button v-for="team in filteredAssignees.teams" :key="team.id" @click.prevent="assignTeam(team)" class="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors">
                            <div class="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-400 flex items-center justify-center shrink-0"><Icon name="heroicons:user-group" class="w-3 h-3" /></div>
                            <span class="text-xs font-medium text-main dark:text-gray-300 truncate">{{ team.name }}</span>
                          </button>
                        </div>
                        <div v-if="filteredAssignees.members.length > 0" :class="{'mt-1 pt-1 border-t border-gray-100 dark:border-gray-800':filteredAssignees.teams.length>0}">
                          <div class="px-2 py-1 text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">Membres</div>
                          <button v-for="member in filteredAssignees.members" :key="member.id" @click.prevent="assignMember(member)" class="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors">
                            <div class="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-[9px] shrink-0">{{ (member?.last_name||'U').charAt(0).toUpperCase()+(member?.first_name||'').charAt(0).toUpperCase() }}</div>
                            <span class="text-xs font-medium text-main dark:text-gray-300 truncate">{{ member.last_name+' '+member.first_name }}</span>
                          </button>
                        </div>
                        <div v-if="filteredAssignees.teams.length===0&&filteredAssignees.members.length===0" class="p-3 text-center text-xs text-secondary">Aucun résultat</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <div v-if="assignedTeams.length > 0" class="flex flex-wrap gap-1.5">
                    <div v-for="team in assignedTeams" :key="'t-'+team.id" class="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-md text-xs font-bold">
                      <Icon name="heroicons:user-group" class="w-3.5 h-3.5" />{{ team.name }}
                      <button @click.prevent="removeTeam(team)" class="ml-0.5 hover:text-blue-900 dark:hover:text-blue-200"><Icon name="heroicons:x-mark" class="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div v-if="assignedMembers.length > 0" class="flex flex-col gap-2 mt-1">
                    <div v-for="(member, idx) in assignedMembers" :key="'m-'+member.id" class="flex items-center justify-between group bg-white dark:bg-[#222224] p-1.5 pr-2 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                      <div class="flex items-center gap-2.5 flex-1 overflow-hidden">
                        <div :class="['w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-[10px] shadow-sm overflow-hidden shrink-0',!member.profile_picture?['bg-orange-500','bg-teal-500','bg-primary','bg-rose-500','bg-emerald-500','bg-purple-500'][idx%6]:'bg-canvas dark:bg-gray-800']">
                          <img v-if="member.profile_picture" :src="member.profile_picture.startsWith('http')?member.profile_picture:`http://localhost:8000${member.profile_picture}`" class="w-full h-full object-cover" />
                          <span v-else>{{ (member?.last_name||'U').charAt(0).toUpperCase()+(member?.first_name||'').charAt(0).toUpperCase() }}</span>
                        </div>
                        <div class="flex flex-col truncate">
                          <span class="text-xs font-bold text-main dark:text-gray-200 truncate">{{ member.last_name+' '+member.first_name }}</span>
                          <span class="text-[10px] text-secondary dark:text-gray-500 truncate leading-none">{{ member.role||'Membre' }}</span>
                        </div>
                      </div>
                      <button @click.prevent="removeMember(member)" class="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-secondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                        <Icon name="heroicons:x-mark" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div v-if="assignedTeams.length===0&&assignedMembers.length===0" class="text-xs text-secondary dark:text-gray-500 italic py-2 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">Aucun membre assigné</div>
                </div>
              </div>

              <!-- Color Selection -->
              <div>
                <label class="block text-sm font-bold text-main dark:text-gray-300 mb-2">Couleur du dossier</label>
                <div class="flex items-center gap-3">
                  <button 
                    v-for="color in ['purple', 'blue', 'green', 'rose', 'amber', 'slate']" 
                    :key="color"
                    @click="form.color = color"
                    class="w-8 h-8 rounded-full border-2 transition-transform"
                    :class="[
                      form.color === color ? 'border-cyan-600 dark:border-cyan-600 scale-110 shadow-sm' : 'border-transparent scale-100 hover:scale-105',
                      {
                        'bg-[#F2F0F9] dark:bg-[#2A2938]': color === 'purple',
                        'bg-blue-100 dark:bg-blue-900/40': color === 'blue',
                        'bg-emerald-100 dark:bg-emerald-900/40': color === 'green',
                        'bg-rose-100 dark:bg-rose-900/40': color === 'rose',
                        'bg-amber-100 dark:bg-amber-900/40': color === 'amber',
                        'bg-slate-200 dark:bg-slate-700': color === 'slate'
                      }
                    ]"
                  ></button>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">
                  Description <span class="text-red-500">*</span>
                </label>
                <RichTextEditor 
                  v-model="form.description" 
                  class="w-full"
                  :class="errors.description ? 'ring-1 ring-red-500' : ''"
                />
                <p v-if="errors.description" class="text-red-500 text-xs mt-1 font-medium">Ce champ est requis.</p>
              </div>

            </div>
          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)] flex justify-end gap-3 z-10 relative">
            <button @click="close" class="px-4 py-2 rounded-lg text-sm font-bold text-secondary dark:text-gray-300 hover:text-main dark:hover:text-white transition-colors">
              Annuler
            </button>
            <button @click="submit" class="px-5 py-2 rounded-lg text-sm font-bold text-white bg-cyan-600 hover:brightness-110 neo-emboss active:neo-inset transition-all flex items-center gap-2">
              <Icon name="heroicons:plus" class="w-4 h-4" />
              Créer le projet
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
