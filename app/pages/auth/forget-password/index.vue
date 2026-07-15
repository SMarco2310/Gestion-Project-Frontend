<script setup lang="ts">
import { ref } from 'vue'
import useAuth from '../../../composables/useAuth'

definePageMeta({
  pageTransition: {
    name: 'fade',
    mode: 'out-in'
  }
})

const { forgotPassword } = useAuth()

const email = ref('')
const isSuccess = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  if (!email.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    await forgotPassword(email.value)
    isSuccess.value = true
  } catch (error: any) {
    // Extract validation error from Laravel response
    if (error?.data?.errors?.email) {
      errorMessage.value = error.data.errors.email[0]
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
  <div class="relative min-h-[100dvh] flex items-center justify-center p-0 lg:p-8">
    <!-- Background Image spanning the entire screen -->
    <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80" alt="Background" class="absolute inset-0 w-full h-full object-cover hidden lg:block" />
    
    <!-- Dark Gradient Overlay -->
    <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20 hidden lg:block"></div>

    <!-- Top Left Branding -->
    <div class="absolute top-8 left-8 lg:top-12 lg:left-12 z-20 hidden lg:flex items-center gap-3">
       <img src="/assets/logo_app.svg" alt="Logo" class="w-10 h-10 object-contain drop-shadow-none lg:drop-shadow-md" />
       <span class="text-white font-bold text-2xl tracking-wide">Gestion Pro</span>
    </div>

    <!-- Main Content Container -->
    <div class="relative z-10 w-full max-w-[3000px] min-h-[100dvh] lg:min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row items-center justify-between lg:gap-10">
      
      <!-- Left Panel - Text content -->
      <div class="hidden lg:flex flex-col w-full lg:w-1/2 text-white p-8 lg:p-12 rounded-xl justify-center h-full">
        <div class="my-auto">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Récupérez l'accès<br />
            à vos projets.<br />
            En toute sécurité.
          </h1>
          <p class="text-gray-200 text-lg max-w-md">
            Nous comprenons que les oublis arrivent. Réinitialisez votre mot de passe pour reprendre le contrôle de votre travail.
          </p>
        </div>
      </div>

      <!-- Right Panel - Large Floating Form Card -->
      <div class="relative w-full lg:w-1/2 max-w-[700px] min-h-[100dvh] lg:min-h-[calc(100vh-4rem)] flex flex-col justify-center bg-white dark:bg-[#1D1D1D] rounded-none lg:rounded-[1.5rem] lg:neo-card p-8 sm:p-12 lg:p-16 xl:p-20 lg:ml-auto border-0 lg:border border-white/50 dark:border-white/5">
        
        <div class="w-full space-y-8">
          
          <Transition name="fade" mode="out-in">
            <!-- Step 1: Input Form -->
            <div v-if="!isSuccess" key="input">
              <!-- Absolute Retour Button -->
              <NuxtLink href="/auth/login" class="absolute top-8 left-8 sm:top-12 sm:left-12 lg:top-16 lg:left-16 xl:top-20 xl:left-20 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition-colors w-fit z-10">
                <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Retour
              </NuxtLink>

              <!-- Header -->
              <div class="flex flex-col items-left text-left mb-12 mt-12 sm:mt-0">
                <!-- Mobile Logo -->
                <div class="flex items-center gap-3 mb-8 lg:hidden">
                  <img src="/assets/logo_app.svg" alt="Logo" class="w-10 h-10 object-contain" />
                  <span class="text-black dark:text-white font-bold text-2xl tracking-wide">Gestion Pro</span>
                </div>
                <h2 class="text-4xl sm:text-5xl font-bold tracking-wider text-black dark:text-white mb-3">Mot de passe oublié</h2>
                <p class="text-gray-500 dark:text-gray-400 font-semibold text-base">Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</p>
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="flex items-center justify-center p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20">
                <span class="text-red-500 dark:text-red-400 text-sm">{{ errorMessage }}</span>
              </div>

              <!-- Form -->
              <form @submit.prevent="handleSubmit" class="space-y-6">
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input v-model="email" type="email" id="email" placeholder="Entrez votre e-mail" required class="w-full px-5 py-4 rounded-xl neo-input bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white focus:ring-2 focus:ring-black/50 dark:focus:ring-white/50 outline-none text-base" />
                </div>

                <button type="submit" :disabled="!email || loading" class="w-full py-4 px-4 bg-gradient-to-b from-gray-800 to-black dark:from-white dark:to-gray-200 text-white dark:text-black font-bold text-lg rounded-full neo-emboss border border-gray-700/50 dark:border-white/50 hover:brightness-110 active:neo-inset active:scale-[0.98] mt-8 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <svg v-if="loading" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ loading ? 'Envoi en cours...' : 'Envoyer le lien' }}
                </button>
              </form>
            </div>

            <!-- Step 2: Success Message -->
            <div v-else key="success" class="flex flex-col items-center justify-center text-center py-10">
              <div class="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-8 neo-emboss">
                <Icon name="heroicons:envelope-open" class="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              
              <h2 class="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-4">Email envoyé !</h2>
              <p class="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-sm mb-10">
                Nous avons envoyé un lien de réinitialisation à <span class="text-black dark:text-white font-bold">{{ email }}</span>. Veuillez vérifier votre boîte de réception.
              </p>

              <NuxtLink href="/auth/login" class="w-full py-4 px-4 bg-gradient-to-b from-gray-800 to-black dark:from-white dark:to-gray-200 text-white dark:text-black font-bold text-lg rounded-full neo-emboss border border-gray-700/50 dark:border-white/50 hover:brightness-110 active:neo-inset active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                Retour à la connexion
              </NuxtLink>
            </div>
          </Transition>

        </div>
      </div>
    </div>
  </div>
</template>