<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'submit'])

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const close = () => {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  emit('close')
}

const submit = () => {
  // Add basic validation if needed, then emit
  emit('submit', {
    currentPassword: currentPassword.value,
    newPassword: newPassword.value
  })
  close()
}

</script>

<template>
  <ClientOnly>
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
          <div 
            class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-white/20 dark:border-white/5"
            role="dialog"
            aria-modal="true"
          >
            <!-- Header -->
            <header class="flex items-center justify-between px-6 py-5 border-b border-form-border dark:border-gray-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-b from-blue-400 to-blue-500 neo-emboss flex items-center justify-center text-white">
                  <Icon name="heroicons:lock-closed" class="w-5 h-5" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-main dark:text-gray-200">Changer le mot de passe</h2>
                  <p class="text-xs text-secondary dark:text-gray-400 mt-0.5">Sécurisez votre compte</p>
                </div>
              </div>
              <button @click="close" class="p-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Icon name="heroicons:x-mark" class="w-6 h-6" />
              </button>
            </header>

            <!-- Body -->
            <div class="p-6 flex flex-col gap-5">
              
              <!-- Current Password -->
              <div>
                <label class="block text-sm font-bold text-secondary dark:text-gray-400 mb-2">Mot de passe actuel</label>
                <div class="relative">
                  <input :type="showCurrentPassword ? 'text' : 'password'" v-model="currentPassword" placeholder="Entrez votre mot de passe actuel" class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:border-primary dark:focus:border-gray-500 focus:ring-1 focus:ring-primary dark:focus:ring-gray-500 transition-all shadow-inner pr-12" />
                  <button type="button" @click="showCurrentPassword = !showCurrentPassword" class="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <Icon :name="showCurrentPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- New Password -->
              <div>
                <label class="block text-sm font-bold text-secondary dark:text-gray-400 mb-2">Nouveau mot de passe</label>
                <div class="relative">
                  <input :type="showNewPassword ? 'text' : 'password'" v-model="newPassword" placeholder="Entrez votre nouveau mot de passe" class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:border-primary dark:focus:border-gray-500 focus:ring-1 focus:ring-primary dark:focus:ring-gray-500 transition-all shadow-inner pr-12" />
                  <button type="button" @click="showNewPassword = !showNewPassword" class="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <Icon :name="showNewPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Confirm Password -->
              <div>
                <label class="block text-sm font-bold text-secondary dark:text-gray-400 mb-2">Confirmer le nouveau mot de passe</label>
                <div class="relative">
                  <input :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword" placeholder="Confirmez le nouveau mot de passe" class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:border-primary dark:focus:border-gray-500 focus:ring-1 focus:ring-primary dark:focus:ring-gray-500 transition-all shadow-inner pr-12" />
                  <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <Icon :name="showConfirmPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>

            <!-- Footer -->
            <footer class="px-6 py-5 bg-canvas dark:bg-[#1A1A1D] border-t border-form-border dark:border-gray-800 flex items-center justify-end gap-3 rounded-b-2xl">
              <button @click="close" class="px-5 py-2.5 text-sm font-bold text-secondary dark:text-gray-400 hover:text-main dark:hover:text-gray-200 transition-colors">Annuler</button>
              <button @click="submit" :disabled="!currentPassword || !newPassword || newPassword !== confirmPassword" class="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg neo-emboss active:neo-inset hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Icon name="heroicons:check" class="w-5 h-5" /> Mettre à jour
              </button>
            </footer>

          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
