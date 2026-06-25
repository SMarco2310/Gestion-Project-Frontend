<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'submit'])

const form = ref({
  title: '',
  reference_code: '',
  description: '',
  status: 'TO_DO',
  end_date: ''
})

const errors = ref({
  title: false,
  description: false
})

// Reset form when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.value = {
      title: '',
      reference_code: '',
      description: '',
      status: 'TO_DO',
      end_date: ''
    }
    errors.value = { title: false, description: false }
  }
})

const close = () => {
  emit('close')
}

const submit = () => {
  // Simple validation
  errors.value.title = !form.value.title.trim()
  errors.value.description = !form.value.description.trim()

  if (errors.value.title || errors.value.description) {
    return // Stop submission if validation fails
  }

  emit('submit', { ...form.value })
  close()
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
        <div class="bg-card dark:bg-[#1D1D1D] w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-form-border dark:border-gray-800" role="dialog" aria-modal="true">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-form-border dark:border-gray-800 flex justify-between items-center bg-canvas dark:bg-[#222224]">
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
                  v-model="form.title" 
                  type="text" 
                  class="w-full bg-canvas dark:bg-[#2A2A2D] text-main dark:text-white border dark:border-transparent placeholder-secondary dark:placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 transition-all"
                  :class="errors.title ? 'border-red-500 focus:ring-red-500/50' : 'border-form-border focus:ring-primary dark:focus:ring-blue-500/50'"
                  placeholder="Nom du projet"
                />
                <p v-if="errors.title" class="text-red-500 text-xs mt-1 font-medium">Ce champ est requis.</p>
              </div>

              <!-- Reference Code & Status Row -->
              <div class="flex gap-4">
                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Code de référence</label>
                  <input 
                    v-model="form.reference_code" 
                    type="text" 
                    class="w-full bg-canvas dark:bg-[#2A2A2D] text-main dark:text-white border border-form-border dark:border-transparent placeholder-secondary dark:placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-500/50 transition-all uppercase"
                    placeholder="ex: PRJ-001"
                  />
                </div>
                <div class="flex-1">
                  <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Statut</label>
                  <select 
                    v-model="form.status"
                    class="w-full bg-canvas dark:bg-[#2A2A2D] text-main dark:text-white border border-form-border dark:border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="TO_DO">À faire</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINE">Terminé</option>
                  </select>
                </div>
              </div>

              <!-- End Date -->
              <div>
                <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Date de fin prévue</label>
                <div class="relative">
                  <Icon name="heroicons:calendar" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary dark:text-gray-500 pointer-events-none" />
                  <input 
                    v-model="form.end_date" 
                    type="date" 
                    class="w-full bg-canvas dark:bg-[#2A2A2D] text-main dark:text-white border border-form-border dark:border-transparent rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-500/50 transition-all"
                  />
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
                  class="w-full bg-canvas dark:bg-[#2A2A2D] text-main dark:text-white border dark:border-transparent placeholder-secondary dark:placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 transition-all resize-none"
                  :class="errors.description ? 'border-red-500 focus:ring-red-500/50' : 'border-form-border focus:ring-primary dark:focus:ring-blue-500/50'"
                  placeholder="Décrivez les objectifs et détails de ce projet..."
                ></textarea>
                <p v-if="errors.description" class="text-red-500 text-xs mt-1 font-medium">Ce champ est requis.</p>
              </div>

            </div>
          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 border-t border-form-border dark:border-gray-800 bg-canvas dark:bg-[#222224] flex justify-end gap-3">
            <button @click="close" class="px-4 py-2 rounded-lg text-sm font-bold text-secondary dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              Annuler
            </button>
            <button @click="submit" class="px-5 py-2 rounded-lg text-sm font-bold text-white bg-primary dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 shadow-md transition-colors flex items-center gap-2">
              <Icon name="heroicons:plus" class="w-4 h-4" />
              Créer le projet
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
