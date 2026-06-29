<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'submit'])

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})
const loading = ref(false)
const isSuccess = ref(false)

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Reset state when modal opens/closes
watch(() => props.isOpen, (val) => {
  if (val) {
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    errorMessage.value = ''
    fieldErrors.value = {}
    isSuccess.value = false
  }
})

const close = () => {
  emit('close')
}

const validateFields = (): boolean => {
  fieldErrors.value = {}

  if (!currentPassword.value) {
    fieldErrors.value.currentPassword = 'Le mot de passe actuel est requis.'
  }

  if (!newPassword.value) {
    fieldErrors.value.newPassword = 'Le nouveau mot de passe est requis.'
  } else if (newPassword.value.length < 8) {
    fieldErrors.value.newPassword = 'Le mot de passe doit contenir au moins 8 caractères.'
  }

  if (!confirmPassword.value) {
    fieldErrors.value.confirmPassword = 'Veuillez confirmer le nouveau mot de passe.'
  } else if (newPassword.value !== confirmPassword.value) {
    fieldErrors.value.confirmPassword = 'Les mots de passe ne correspondent pas.'
  }

  return Object.keys(fieldErrors.value).length === 0
}

const submit = async () => {
  errorMessage.value = ''

  if (!validateFields()) return

  loading.value = true

  try {
    const { $api } = useNuxtApp()
    await $api('/api/update', {
      method: 'PUT',
      body: { 
        current_password: currentPassword.value,
        password: newPassword.value 
      },
    })
    isSuccess.value = true
    // Auto-close after 2 seconds on success
    setTimeout(() => {
      close()
    }, 2000)
  } catch (error: any) {
    if (error?.data?.errors) {
      const errors = error.data.errors
      if (errors.password) fieldErrors.value.newPassword = errors.password[0]
      if (errors.current_password) fieldErrors.value.currentPassword = errors.current_password[0]
    } else if (error?.data?.message) {
      errorMessage.value = error.data.message
    } else {
      errorMessage.value = 'Une erreur est survenue. Veuillez réessayer.'
    }
  } finally {
    loading.value = false
  }
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

              <!-- Success state -->
              <div v-if="isSuccess" class="flex flex-col items-center justify-center text-center py-6">
                <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <Icon name="heroicons:check-circle" class="w-10 h-10 text-green-500 dark:text-green-400" />
                </div>
                <h3 class="text-lg font-bold text-main dark:text-gray-200 mb-1">Mot de passe modifié !</h3>
                <p class="text-sm text-secondary dark:text-gray-400">Votre mot de passe a été mis à jour avec succès.</p>
              </div>

              <!-- Form state -->
              <template v-else>
                <!-- General Error -->
                <div v-if="errorMessage" class="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                  <Icon name="heroicons:exclamation-circle" class="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <span class="text-red-600 dark:text-red-400 text-sm">{{ errorMessage }}</span>
                </div>

                <!-- Current Password -->
                <div>
                  <label class="block text-sm font-bold text-secondary dark:text-gray-400 mb-2">Mot de passe actuel</label>
                  <div class="relative">
                    <input :type="showCurrentPassword ? 'text' : 'password'" v-model="currentPassword" placeholder="Entrez votre mot de passe actuel" :class="['w-full bg-canvas dark:bg-[#161616] border rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:ring-1 transition-all shadow-inner pr-12', fieldErrors.currentPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-form-border dark:border-gray-700 focus:border-primary dark:focus:border-gray-500 focus:ring-primary dark:focus:ring-gray-500']" />
                    <button type="button" @click="showCurrentPassword = !showCurrentPassword" class="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      <Icon :name="showCurrentPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                    </button>
                  </div>
                  <p v-if="fieldErrors.currentPassword" class="mt-1.5 ml-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                    <Icon name="heroicons:exclamation-circle" class="w-3.5 h-3.5" /> {{ fieldErrors.currentPassword }}
                  </p>
                </div>

                <!-- New Password -->
                <div>
                  <label class="block text-sm font-bold text-secondary dark:text-gray-400 mb-2">Nouveau mot de passe</label>
                  <div class="relative">
                    <input :type="showNewPassword ? 'text' : 'password'" v-model="newPassword" placeholder="Minimum 8 caractères" :class="['w-full bg-canvas dark:bg-[#161616] border rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:ring-1 transition-all shadow-inner pr-12', fieldErrors.newPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-form-border dark:border-gray-700 focus:border-primary dark:focus:border-gray-500 focus:ring-primary dark:focus:ring-gray-500']" />
                    <button type="button" @click="showNewPassword = !showNewPassword" class="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      <Icon :name="showNewPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                    </button>
                  </div>
                  <p v-if="fieldErrors.newPassword" class="mt-1.5 ml-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                    <Icon name="heroicons:exclamation-circle" class="w-3.5 h-3.5" /> {{ fieldErrors.newPassword }}
                  </p>
                </div>

                <!-- Confirm Password -->
                <div>
                  <label class="block text-sm font-bold text-secondary dark:text-gray-400 mb-2">Confirmer le nouveau mot de passe</label>
                  <div class="relative">
                    <input :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword" placeholder="Confirmez le nouveau mot de passe" :class="['w-full bg-canvas dark:bg-[#161616] border rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:ring-1 transition-all shadow-inner pr-12', fieldErrors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-form-border dark:border-gray-700 focus:border-primary dark:focus:border-gray-500 focus:ring-primary dark:focus:ring-gray-500']" />
                    <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      <Icon :name="showConfirmPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                    </button>
                  </div>
                  <p v-if="fieldErrors.confirmPassword" class="mt-1.5 ml-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                    <Icon name="heroicons:exclamation-circle" class="w-3.5 h-3.5" /> {{ fieldErrors.confirmPassword }}
                  </p>
                </div>
              </template>

            </div>

            <!-- Footer -->
            <footer v-if="!isSuccess" class="px-6 py-5 bg-canvas dark:bg-[#1A1A1D] border-t border-form-border dark:border-gray-800 flex items-center justify-end gap-3 rounded-b-2xl">
              <button @click="close" class="px-5 py-2.5 text-sm font-bold text-secondary dark:text-gray-400 hover:text-main dark:hover:text-gray-200 transition-colors">Annuler</button>
              <button @click="submit" :disabled="loading" class="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg neo-emboss active:neo-inset hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg v-if="loading" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <Icon v-else name="heroicons:check" class="w-5 h-5" />
                {{ loading ? 'Mise à jour...' : 'Mettre à jour' }}
              </button>
            </footer>

          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
