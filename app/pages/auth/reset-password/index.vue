<script setup lang="ts">
import { ref, onMounted } from 'vue'
import useAuth from '../../../composables/useAuth'

definePageMeta({ pageTransition: { name: 'fade', mode: 'out-in' } })

const { resetPassword } = useAuth()
const route = useRoute()

const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const isSuccess = ref(false)
const isInvalidLink = ref(false)
const resetToken = ref('')
const resetEmail = ref('')

onMounted(() => {
  resetToken.value = (route.query.token as string) || ''
  resetEmail.value = (route.query.email as string) || ''
  if (!resetToken.value || !resetEmail.value) isInvalidLink.value = true
})

const handleSubmit = async () => {
  if (!password.value || !passwordConfirmation.value) return
  if (password.value !== passwordConfirmation.value) { errorMessage.value = 'Les mots de passe ne correspondent pas.'; return }
  if (password.value.length < 8) { errorMessage.value = 'Le mot de passe doit contenir au moins 8 caractères.'; return }
  loading.value = true; errorMessage.value = ''
  try {
    await resetPassword(resetToken.value, resetEmail.value, password.value, passwordConfirmation.value)
    isSuccess.value = true
  } catch (error: any) {
    if (error?.data?.errors?.password) errorMessage.value = error.data.errors.password[0]
    else if (error?.data?.errors?.email) errorMessage.value = error.data.errors.email[0]
    else if (error?.data?.message) errorMessage.value = error.data.message
    else errorMessage.value = 'Une erreur est survenue. Le lien est peut-être expiré.'
  } finally { loading.value = false }
}
</script>

<template>
  <div class="relative min-h-[100dvh] flex items-center justify-center p-0 lg:p-8">
    <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80" alt="Background" class="absolute inset-0 w-full h-full object-cover hidden lg:block" />
    <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20 hidden lg:block"></div>
    <div class="absolute top-8 left-8 lg:top-12 lg:left-12 z-20 hidden lg:flex items-center gap-3">
       <img src="/assets/logo_app.svg" alt="Logo" class="w-10 h-10 object-contain drop-shadow-none lg:drop-shadow-md" />
       <span class="text-white font-bold text-2xl tracking-wide">Gestion Pro</span>
    </div>

    <div class="relative z-10 w-full max-w-[3000px] min-h-[100dvh] lg:min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row items-center justify-between lg:gap-10">
      <div class="hidden lg:flex flex-col w-full lg:w-1/2 text-white p-8 lg:p-12 rounded-xl justify-center h-full">
        <div class="my-auto">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">Créez un nouveau<br />mot de passe.<br />Restez protégé.</h1>
          <p class="text-gray-200 text-lg max-w-md">Choisissez un mot de passe solide pour sécuriser l'accès à tous vos projets et tâches.</p>
        </div>
      </div>

      <div class="relative w-full lg:w-1/2 max-w-[700px] min-h-[100dvh] lg:min-h-[calc(100vh-4rem)] flex flex-col justify-center bg-white dark:bg-[#1D1D1D] rounded-none lg:rounded-[1.5rem] lg:neo-card p-8 sm:p-12 lg:p-16 xl:p-20 lg:ml-auto border-0 lg:border border-white/50 dark:border-white/5">
        <div class="w-full space-y-8">
          <Transition name="fade" mode="out-in">
            <!-- Invalid link -->
            <div v-if="isInvalidLink" key="invalid" class="flex flex-col items-center justify-center text-center py-10">
              <div class="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-8 neo-emboss">
                <Icon name="heroicons:exclamation-triangle" class="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h2 class="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-4">Lien invalide</h2>
              <p class="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-sm mb-10">Ce lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande.</p>
              <NuxtLink href="/auth/forget-password" class="w-full py-4 px-4 bg-gradient-to-b from-gray-800 to-black dark:from-white dark:to-gray-200 text-white dark:text-black font-bold text-lg rounded-full neo-emboss border border-gray-700/50 dark:border-white/50 hover:brightness-110 active:neo-inset active:scale-[0.98] transition-all flex items-center justify-center gap-2">Nouvelle demande</NuxtLink>
            </div>

            <!-- Reset Form -->
            <div v-else-if="!isSuccess" key="form">
              <NuxtLink href="/auth/login" class="absolute top-8 left-8 sm:top-12 sm:left-12 lg:top-16 lg:left-16 xl:top-20 xl:left-20 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition-colors w-fit z-10">
                <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Retour
              </NuxtLink>
              <div class="flex flex-col items-left text-left mb-12 mt-12 sm:mt-0">
                <!-- Mobile Logo -->
                <div class="flex items-center gap-3 mb-8 lg:hidden">
                  <img src="/assets/logo_app.svg" alt="Logo" class="w-10 h-10 object-contain" />
                  <span class="text-black dark:text-white font-bold text-2xl tracking-wide">Gestion Pro</span>
                </div>
                <h2 class="text-4xl sm:text-5xl font-bold tracking-wider text-black dark:text-white mb-3">Nouveau mot de passe</h2>
                <p class="text-gray-500 dark:text-gray-400 font-semibold text-base">Choisissez un nouveau mot de passe sécurisé pour votre compte.</p>
              </div>
              <div v-if="errorMessage" class="flex items-center justify-center p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20">
                <span class="text-red-500 dark:text-red-400 text-sm">{{ errorMessage }}</span>
              </div>
              <form @submit.prevent="handleSubmit" class="space-y-6">
                <div>
                  <label for="reset-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input :value="resetEmail" type="email" id="reset-email" disabled class="w-full px-5 py-4 rounded-xl neo-input bg-gray-100 dark:bg-[#0f0f0f] text-gray-500 dark:text-gray-400 outline-none text-base cursor-not-allowed" />
                </div>
                <div>
                  <label for="new-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nouveau mot de passe</label>
                  <div class="relative">
                    <input v-model="password" :type="showPassword ? 'text' : 'password'" id="new-password" placeholder="Minimum 8 caractères" required class="w-full px-5 py-4 rounded-xl neo-input bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white focus:ring-2 focus:ring-black/50 dark:focus:ring-white/50 outline-none pr-12 text-base" />
                    <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 px-5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmer le mot de passe</label>
                  <div class="relative">
                    <input v-model="passwordConfirmation" :type="showConfirmPassword ? 'text' : 'password'" id="confirm-password" placeholder="Répétez le mot de passe" required class="w-full px-5 py-4 rounded-xl neo-input bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white focus:ring-2 focus:ring-black/50 dark:focus:ring-white/50 outline-none pr-12 text-base" />
                    <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute inset-y-0 right-0 px-5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      <Icon :name="showConfirmPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <button type="submit" :disabled="!password || !passwordConfirmation || loading" class="w-full py-4 px-4 bg-gradient-to-b from-gray-800 to-black dark:from-white dark:to-gray-200 text-white dark:text-black font-bold text-lg rounded-full neo-emboss border border-gray-700/50 dark:border-white/50 hover:brightness-110 active:neo-inset active:scale-[0.98] mt-8 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <svg v-if="loading" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {{ loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe' }}
                </button>
              </form>
            </div>

            <!-- Success -->
            <div v-else key="success" class="flex flex-col items-center justify-center text-center py-10">
              <div class="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-8 neo-emboss">
                <Icon name="heroicons:check-circle" class="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 class="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-4">Mot de passe réinitialisé !</h2>
              <p class="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-sm mb-10">Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              <NuxtLink href="/auth/login" class="w-full py-4 px-4 bg-gradient-to-b from-gray-800 to-black dark:from-white dark:to-gray-200 text-white dark:text-black font-bold text-lg rounded-full neo-emboss border border-gray-700/50 dark:border-white/50 hover:brightness-110 active:neo-inset active:scale-[0.98] transition-all flex items-center justify-center gap-2">Se connecter</NuxtLink>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
