<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { TaskPriority } from '~/utils/enums'
import useProjets from '~/composables/useProjets'
import useTags from '~/composables/useTags'
import useOrganizations from '~/composables/useOrganizations'

const props = defineProps<{
  isOpen: boolean
  parentTaskId?: string | number | null
  projetId?: string | number | null
  createTask?: (data: any) => Promise<unknown> | unknown
}>()

const emit = defineEmits(['close', 'submit'])

const form = ref({
  title: '',
  description: '',
  board_column: 'À faire',
  priority: TaskPriority.MEDIUM,
  tag_id: '' as string | number,
  due_date: '',
  projet_id: props.projetId || '',
  assignee_id: null as string | number | null
})

const errors = ref({
  title: false,
  projet_id: false
})

const { projets, getProjets } = useProjets()
const { tags, getTags } = useTags()
const { activeOrganization } = useOrganizations()
const { $api } = useNuxtApp()

const isAssigneeDropdownOpen = ref(false)
const isStatusDropdownOpen = ref(false)
const orgMembers = ref<any[]>([])
const avatarColors = ['bg-primary', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500']

const kanbanColumns = computed(() => {
  return activeOrganization.value?.kanban_columns?.length 
    ? activeOrganization.value.kanban_columns 
    : ['À faire', 'En cours', 'Terminé']
})

const kanbanColors = computed(() => {
  return activeOrganization.value?.kanban_colors || {}
})

const statusConfig = computed(() => {
  const config: Record<string, { label: string; colorClass?: string; style?: any }> = {}
  kanbanColumns.value.forEach(col => {
    let colorClass = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    let style: any = undefined
    const lowerCol = col.toLowerCase()
    
    if (kanbanColors.value[col]) {
      colorClass = ''
      style = {
        backgroundColor: kanbanColors.value[col] + '20',
        color: kanbanColors.value[col]
      }
    } else if (lowerCol === 'à faire' || lowerCol === 'to do') {
      colorClass = 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-500'
    } else if (lowerCol === 'en cours' || lowerCol === 'in progress') {
      colorClass = 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-primary'
    } else if (lowerCol === 'terminé' || lowerCol === 'done') {
      colorClass = 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-500'
    }
    
    config[col] = {
      label: col.toUpperCase(),
      colorClass,
      style
    }
  })
  return config
})

const fetchOrgMembers = async () => {
  if (!activeOrganization.value) return
  try {
    const res = await $api<any>(`/organizations/${activeOrganization.value.id}/members`, { method: 'GET' })
    const members = res.data?.data ?? res.data ?? []
    orgMembers.value = members.map((m: any, i: number) => ({
      id: m.id,
      first_name: m.first_name,
      last_name: m.last_name,
      initials: (m.last_name || '?').charAt(0).toUpperCase() + (m.first_name || '').charAt(0).toUpperCase(),
      color: avatarColors[i % avatarColors.length],
      profile_picture: m.profile_picture || null
    }))
  } catch (err) {
    console.error('Failed to fetch org members for assignee dropdown:', err)
  }
}

onMounted(async () => {
  if (!props.projetId) {
    await getProjets()
  }
  await getTags()
  fetchOrgMembers()
})

const getTodayDate = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
const minDate = ref(getTodayDate())

// Reset form when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.value = {
      title: '',
      description: '',
      board_column: kanbanColumns.value[0] || 'À faire',
      priority: TaskPriority.MEDIUM,
      tag_id: tags.value[0]?.id ?? '',
      due_date: getTodayDate(),
      projet_id: props.projetId || '',
      assignee_id: null
    }
    errors.value = { title: false, projet_id: false }
  }
})

const close = () => {
  emit('close')
}

const submit = async () => {
  // Simple validation
  errors.value.title = !form.value.title.trim()
  errors.value.projet_id = !props.projetId && !form.value.projet_id

  if (errors.value.title || errors.value.projet_id) {
    return // Stop submission if validation fails
  }

  const payload = {
    ...form.value,
    parent_task_id: props.parentTaskId ?? null,
    projet_id: props.projetId ?? form.value.projet_id
  }

  try {
    if (props.createTask) {
      await props.createTask(payload)
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
      <div v-if="isOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" @click.self="close">
        <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] w-full max-w-lg rounded-xl flex flex-col overflow-hidden" role="dialog" aria-modal="true">
          
          <!-- Header -->
          <div class="px-6 py-4 flex justify-between items-center shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
            <h2 class="text-xl font-bold text-main dark:text-white">{{ parentTaskId ? 'Créer une sous-tâche' : 'Créer une tâche' }}</h2>
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
                  Titre de la tâche <span class="text-red-500">*</span>
                </label>
                <input 
                  v-model="form.title" 
                  type="text" 
                  class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white placeholder-secondary dark:placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 transition-all"
                  :class="errors.title ? 'focus:ring-red-500' : 'focus:ring-primary dark:focus:ring-primary'"
                  placeholder="Que faut-il faire ?"
                  @keydown.enter="submit"
                />
                <p v-if="errors.title" class="text-red-500 text-xs mt-1 font-medium">Ce champ est requis.</p>
              </div>

              <!-- Project Selector (Only if not provided by parent) -->
              <div v-if="!props.projetId && !props.parentTaskId">
                <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">
                  Projet <span class="text-red-500">*</span>
                </label>
                <CustomSelect 
                  v-model="form.projet_id"
                  :options="projets.map(p => ({ value: p.id, label: p.name }))"
                  placeholder="Sélectionner un projet"
                  buttonClass="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 transition-all cursor-pointer text-sm flex justify-between items-center"
                />
                <p v-if="errors.projet_id" class="text-red-500 text-xs mt-1 font-medium">Veuillez sélectionner un projet.</p>
              </div>

              <!-- Status, Priority & Tag Row -->
              <div class="flex gap-4">
                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Statut</label>
                  <div class="relative">
                    <div class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg px-4 py-2.5 cursor-pointer flex justify-between items-center transition-all" @click="isStatusDropdownOpen = !isStatusDropdownOpen">
                      <div class="flex items-center gap-2 truncate">
                        <span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm', statusConfig[form.board_column]?.colorClass]" :style="statusConfig[form.board_column]?.style">
                          {{ statusConfig[form.board_column]?.label || form.board_column }}
                        </span>
                      </div>
                      <Icon name="ph:caret-down" class="w-4 h-4 flex-shrink-0 text-secondary dark:text-gray-400 transition-transform duration-200" :class="isStatusDropdownOpen ? 'rotate-180' : ''" />
                    </div>
                    
                    <!-- Dropdown -->
                    <div v-if="isStatusDropdownOpen" @click="isStatusDropdownOpen = false" class="fixed inset-0 z-[120]"></div>
                    <div v-if="isStatusDropdownOpen" class="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1D1D1D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-[130] overflow-hidden">
                      <ul class="max-h-48 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-1">
                        <li v-for="col in kanbanColumns" :key="col" class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center justify-between text-sm transition-colors" @click="form.board_column = col; isStatusDropdownOpen = false">
                          <span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm', statusConfig[col]?.colorClass]" :style="statusConfig[col]?.style">
                            {{ statusConfig[col]?.label || col }}
                          </span>
                          <Icon v-if="form.board_column === col" name="ph:check" class="w-4 h-4 text-primary dark:text-primary" />
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Priorité</label>
                  <CustomSelect 
                    v-model="form.priority"
                    :options="[
                      { value: 'faible', label: 'FAIBLE' },
                      { value: 'moyen', label: 'MOYEN' },
                      { value: 'élevé', label: 'ÉLEVÉ' }
                    ]"
                    placeholder="Priorité"
                    buttonClass="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary transition-all cursor-pointer uppercase text-xs font-bold flex justify-between items-center"
                  />
                </div>

                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Étiquette</label>
                  <CustomSelect 
                    v-model="form.tag_id"
                    :options="tags.map(t => ({ value: t.id, label: t.name }))"
                    placeholder="Sélectionner"
                    buttonClass="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary transition-all cursor-pointer text-xs font-bold flex justify-between items-center"
                  />
                </div>
              </div>

              <!-- End Date and Assignee Row -->
              <div class="flex gap-4">
                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Échéance</label>
                  <div class="relative">
                    <Icon name="heroicons:calendar" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary dark:text-gray-500 pointer-events-none" />
                    <input 
                      v-model="form.due_date" 
                      type="date" 
                      :min="minDate"
                      class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary transition-all"
                    />
                  </div>
                </div>

                <div class="flex-1 relative">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Assigner à</label>
                  <div class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg px-4 py-2.5 cursor-pointer flex justify-between items-center transition-all" @click="isAssigneeDropdownOpen = !isAssigneeDropdownOpen">
                    <div class="flex items-center gap-2 truncate">
                      <template v-if="form.assignee_id">
                        <div class="w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shadow-sm" :class="orgMembers.find(m => m.id === form.assignee_id)?.profile_picture ? '' : orgMembers.find(m => m.id === form.assignee_id)?.color">
                          <img v-if="orgMembers.find(m => m.id === form.assignee_id)?.profile_picture" :src="orgMembers.find(m => m.id === form.assignee_id)?.profile_picture.startsWith('http') ? orgMembers.find(m => m.id === form.assignee_id)?.profile_picture : `http://localhost:8000${orgMembers.find(m => m.id === form.assignee_id)?.profile_picture}`" class="w-full h-full object-cover" />
                          <span v-else>{{ orgMembers.find(m => m.id === form.assignee_id)?.initials }}</span>
                        </div>
                        <span class="text-sm font-medium truncate">{{ orgMembers.find(m => m.id === form.assignee_id)?.name }}</span>
                      </template>
                      <template v-else>
                        <div class="w-5 h-5 flex-shrink-0 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-secondary">
                          <Icon name="ph:user-minus" class="w-3 h-3" />
                        </div>
                        <span class="text-secondary dark:text-gray-400 text-sm truncate">Non assigné</span>
                      </template>
                    </div>
                    <Icon name="ph:caret-down" class="w-4 h-4 flex-shrink-0 text-secondary dark:text-gray-400 transition-transform duration-200" :class="isAssigneeDropdownOpen ? 'rotate-180' : ''" />
                  </div>
                  
                  <!-- Dropdown -->
                  <div v-if="isAssigneeDropdownOpen" class="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1D1D1D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-[120] overflow-hidden">
                    <ul class="max-h-48 overflow-y-auto custom-scrollbar p-1">
                      <li class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-2 text-sm text-main dark:text-white transition-colors" @click="form.assignee_id = null; isAssigneeDropdownOpen = false">
                        <div class="w-5 h-5 flex-shrink-0 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-secondary">
                          <Icon name="ph:user-minus" class="w-3 h-3" />
                        </div> 
                        <span class="text-secondary dark:text-gray-400 truncate">Non assigné</span>
                      </li>
                      <li v-for="member in orgMembers" :key="member.id" class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-2 text-sm text-main dark:text-white transition-colors" @click="form.assignee_id = member.id; isAssigneeDropdownOpen = false">
                        <div class="w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden" :class="member.profile_picture ? '' : member.color">
                          <img v-if="member.profile_picture" :src="member.profile_picture.startsWith('http') ? member.profile_picture : `http://localhost:8000${member.profile_picture}`" class="w-full h-full object-cover" />
                          <span v-else>{{ member.initials }}</span>
                        </div> 
                        <span class="truncate">{{ member.last_name + ' ' + member.first_name }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Description</label>
                <RichTextEditor 
                  v-model="form.description" 
                  class="w-full"
                />
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
              Créer
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
