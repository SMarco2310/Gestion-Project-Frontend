<script setup lang="ts">
import { ref, watch } from 'vue'
import { TaskStatus, TaskPriority, TaskTag } from '~/utils/enums'

const props = defineProps<{
  isOpen: boolean
  parentTaskId?: string | number | null
  projetId?: string | number | null
  createTask?: (data: any) => Promise<unknown> | unknown
}>()

const emit = defineEmits(['close', 'submit'])

const form = ref({
  title: '',
  reference_code: '',
  description: '',
  status: TaskStatus.TO_DO,
  priority: TaskPriority.MEDIUM,
  tag: TaskTag.FEATURE,
  due_date: ''
})

const errors = ref({
  title: false
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
    const randomCode = `T-${Math.floor(1000 + Math.random() * 9000)}`
    form.value = {
      title: '',
      reference_code: randomCode,
      description: '',
      status: TaskStatus.TO_DO,
      priority: TaskPriority.MEDIUM,
      tag: TaskTag.FEATURE,
      due_date: getTodayDate()
    }
    errors.value = { title: false }
  }
})

const close = () => {
  emit('close')
}

const submit = async () => {
  // Simple validation
  errors.value.title = !form.value.title.trim()

  if (errors.value.title) {
    return // Stop submission if validation fails
  }

  const payload = {
    ...form.value,
    parent_task_id: props.parentTaskId ?? null,
    projet_id: props.projetId ?? null
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
                  :class="errors.title ? 'focus:ring-red-500' : 'focus:ring-primary dark:focus:ring-blue-500'"
                  placeholder="Que faut-il faire ?"
                  @keydown.enter="submit"
                />
                <p v-if="errors.title" class="text-red-500 text-xs mt-1 font-medium">Ce champ est requis.</p>
              </div>

              <!-- Tag & Status Row -->
              <div class="flex gap-4">
                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Étiquette</label>
                  <select 
                    v-model="form.tag"
                    class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 transition-all appearance-none cursor-pointer uppercase text-xs font-bold"
                  >
                    <option value="bug">BUG</option>
                    <option value="feature">FEATURE</option>
                    <option value="improvement">IMPROVEMENT</option>
                    <option value="documentation">DOCUMENTATION</option>
                    <option value="design">DESIGN</option>
                    <option value="testing">TESTING</option>
                    <option value="deployment">DEPLOYMENT</option>
                  </select>
                </div>
                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Priorité</label>
                  <select 
                    v-model="form.priority"
                    class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 transition-all appearance-none cursor-pointer uppercase text-xs font-bold"
                  >
                    <option value="faible">FAIBLE</option>
                    <option value="moyen">MOYEN</option>
                    <option value="élevé">ÉLEVÉ</option>
                  </select>
                </div>
              </div>

              <!-- End Date -->
              <div>
                <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Échéance</label>
                <div class="relative">
                  <Icon name="heroicons:calendar" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary dark:text-gray-500 pointer-events-none" />
                  <input 
                    v-model="form.due_date" 
                    type="date" 
                    :min="minDate"
                    class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Description</label>
                <textarea 
                  v-model="form.description" 
                  rows="3"
                  class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white placeholder-secondary dark:placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 transition-all resize-none"
                  placeholder="Détails supplémentaires..."
                ></textarea>
              </div>

            </div>
          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)] flex justify-end gap-3 z-10 relative">
            <button @click="close" class="px-4 py-2 rounded-lg text-sm font-bold text-secondary dark:text-gray-300 hover:text-main dark:hover:text-white transition-colors">
              Annuler
            </button>
            <button @click="submit" class="px-5 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 hover:brightness-110 neo-emboss active:neo-inset transition-all flex items-center gap-2">
              <Icon name="heroicons:plus" class="w-4 h-4" />
              Créer
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
