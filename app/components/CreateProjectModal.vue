<script setup lang="ts">
import { ref, watch } from 'vue'
import useAuth from '~/composables/useAuth'
import { ProjectStatus } from '~/utils/enums'

const props = defineProps<{
  isOpen: boolean
  createProject?: (data: any) => Promise<unknown> | unknown
}>()

const { user } = useAuth()
const emit = defineEmits(['close', 'submit'])

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
    errors.value = { title: false, description: false, dates: false }
  }
})

const close = () => {
  emit('close')
}

const submit = async () => {
  // Simple validation
  errors.value.title = !form.value.name.trim()
  errors.value.description = !form.value.description.trim()
  errors.value.dates = !form.value.start_date || !form.value.end_date

  if (errors.value.title || errors.value.description || errors.value.dates) {
    return // Stop submission if validation fails
  }

  const payload = {
    ...form.value,
    status: form.value.status
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
        <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] w-full max-w-lg rounded-xl flex flex-col overflow-hidden" role="dialog" aria-modal="true">
          
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
                  :class="errors.title ? 'focus:ring-red-500' : 'focus:ring-primary dark:focus:ring-blue-500'"
                  placeholder="Nom du projet"
                />
                <p v-if="errors.title" class="text-red-500 text-xs mt-1 font-medium">Ce champ est requis.</p>
              </div>

              <!-- Status Row -->
              <div class="flex gap-4">
                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Statut</label>
                  <select 
                    v-model="form.status"
                    class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option :value="ProjectStatus.TO_DO">À faire</option>
                    <option :value="ProjectStatus.IN_PROGRESS">En cours</option>
                    <option :value="ProjectStatus.DONE">Terminé</option>
                  </select>
                </div>
              </div>

              <!-- Dates -->
              <div class="flex gap-4">
                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Date de début</label>
                  <div class="relative">
                    <Icon name="heroicons:calendar" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary dark:text-gray-500 pointer-events-none" />
                    <input 
                      v-model="form.start_date" 
                      type="date" 
                      class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Date de fin prévue</label>
                  <div class="relative">
                    <Icon name="heroicons:calendar" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary dark:text-gray-500 pointer-events-none" />
                    <input 
                      v-model="form.end_date" 
                      type="date" 
                      :min="form.start_date || minDate"
                      class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 transition-all"
                    />
                  </div>
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
                      form.color === color ? 'border-primary dark:border-blue-500 scale-110 shadow-sm' : 'border-transparent scale-100 hover:scale-105',
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
                <textarea 
                  v-model="form.description" 
                  rows="4"
                  class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white placeholder-secondary dark:placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 transition-all resize-none"
                  :class="errors.description ? 'focus:ring-red-500' : 'focus:ring-primary dark:focus:ring-blue-500'"
                  placeholder="Décrivez les objectifs et détails de ce projet..."
                ></textarea>
                <p v-if="errors.description" class="text-red-500 text-xs mt-1 font-medium">Ce champ est requis.</p>
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
              Créer le projet
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
