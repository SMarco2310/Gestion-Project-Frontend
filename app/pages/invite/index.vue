<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useAuth from '~/composables/useAuth'
import useInvite from '~/composables/useInvite'
import type { Invitation } from '~/composables/useInvite'

definePageMeta({
  pageTransition: {
    name: 'fade',
    mode: 'out-in'
  }
})

const route = useRoute()
const router = useRouter()
const { isAuthenticated, user } = useAuth()
const { getInvitation, acceptInvitation, isLoading, error } = useInvite()

const token = route.query.token as string
const invitation = ref<Invitation | null>(null)
const actionError = ref<string | null>(null)

onMounted(async () => {
  if (!token) {
    error.value = "Aucun jeton d'invitation fourni."
    return
  }

  if (isAuthenticated.value) {
    try {
      invitation.value = await getInvitation(token)
    } catch (e: any) {
      // error is handled by composable
    }
  }
})

const handleAccept = async () => {
  actionError.value = null
  try {
    await acceptInvitation(token)
    // Redirect on success
    router.push('/organizations')
  } catch (err: any) {
    actionError.value = error.value || "Échec de l'acceptation de l'invitation."
  }
}
</script>

<template>
  <div class="relative min-h-[100dvh] flex items-center justify-center p-0 lg:p-8 overflow-y-auto">
    <!-- Background Image spanning the entire screen -->
    <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80" alt="Background" class="absolute inset-0 w-full h-full object-cover fixed hidden lg:block" />
    
    <!-- Dark Gradient Overlay -->
    <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20 fixed hidden lg:block"></div>

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
            Vous avez été invité !
          </h1>
          <p class="text-gray-200 text-lg max-w-md">
            Rejoignez votre équipe et commencez à collaborer sur vos projets instantanément.
          </p>
        </div>
      </div>

      <!-- Right Panel - Large Floating Form Card -->
      <div class="w-full lg:w-1/2 max-w-[700px] min-h-[100dvh] lg:min-h-[calc(100vh-4rem)] flex flex-col justify-center bg-white dark:bg-[#1D1D1D] rounded-none lg:rounded-[1.5rem] lg:neo-card p-8 sm:p-12 lg:p-16 xl:p-20 lg:ml-auto border-0 lg:border border-white/50 dark:border-white/5">
        
        <div class="w-full space-y-8">
          
          <!-- Header -->
          <div class="flex flex-col items-left text-left mb-12">
            <!-- Mobile Logo -->
            <div class="flex items-center gap-3 mb-8 lg:hidden">
              <img src="/assets/logo_app.svg" alt="Logo" class="w-10 h-10 object-contain" />
              <span class="text-black dark:text-white font-bold text-2xl tracking-wide">Gestion Pro</span>
            </div>
            <h2 class="text-4xl sm:text-5xl font-bold tracking-wider text-black dark:text-white mb-3">Invitation</h2>
            <p class="text-gray-500 dark:text-gray-400 font-semibold text-base">Vérification de votre invitation au projet</p>
          </div>

          <!-- Error State -->
          <div v-if="error" class="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
            <Icon name="heroicons:exclamation-circle" class="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0" />
            <span class="text-red-600 dark:text-red-400 text-base">{{ error }}</span>
          </div>

          <div v-if="actionError" class="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
            <Icon name="heroicons:exclamation-circle" class="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0" />
            <span class="text-red-600 dark:text-red-400 text-base">{{ actionError }}</span>
          </div>

          <!-- No Token -->
          <div v-if="!token && !error" class="text-center p-6 bg-gray-50 dark:bg-[#151515] rounded-xl">
            <p class="text-gray-600 dark:text-gray-400 text-lg">Lien d'invitation invalide. Aucun jeton trouvé.</p>
          </div>

          <!-- Not Authenticated -->
          <div v-else-if="!isAuthenticated && token">
            <div class="mb-8 p-6 bg-gray-50 dark:bg-[#151515] rounded-xl border border-gray-200 dark:border-gray-800">
              <div class="flex items-center justify-center h-16 w-16 rounded-full bg-black dark:bg-white text-white dark:text-black mx-auto mb-6">
                <Icon name="heroicons:lock-closed" class="w-8 h-8" />
              </div>
              <p class="text-center text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                Vous avez été invité à rejoindre une organisation. Veuillez vous connecter ou créer un compte avec l'adresse e-mail invitée pour accepter.
              </p>
            </div>
            <div class="flex flex-col space-y-4">
              <NuxtLink :to="`/auth/login?redirect=/invite?token=${token}`" class="w-full py-4 px-4 btn-primary text-white font-bold text-lg rounded-full neo-emboss border border-primary/50 hover:brightness-110 active:neo-inset active:scale-[0.98] transition-all flex items-center justify-center">
                Se connecter
              </NuxtLink>
              <NuxtLink :to="`/auth/signup?redirect=/invite?token=${token}`" class="w-full py-4 px-4 bg-white dark:bg-[#2A2A2D] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-lg rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center transform active:scale-[0.98]">
                Créer un compte
              </NuxtLink>
            </div>
          </div>

          <!-- Authenticated & Loading -->
          <div v-else-if="isLoading && !invitation" class="py-12 flex flex-col items-center justify-center">
            <svg class="animate-spin w-12 h-12 text-black dark:text-white mb-6" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p class="text-gray-500 dark:text-gray-400 font-medium text-lg">Vérification de l'invitation...</p>
          </div>

          <!-- Authenticated & Loaded -->
          <div v-else-if="invitation" class="animate-in fade-in zoom-in duration-300">
            <div v-if="user?.email !== invitation.email" class="mb-8 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl shadow-sm">
              <div class="flex items-start">
                <Icon name="heroicons:exclamation-triangle" class="w-6 h-6 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                <p class="text-amber-800 dark:text-amber-200 text-base leading-relaxed">
                  Cette invitation a été envoyée à <strong class="font-bold">{{ invitation.email }}</strong>, mais vous êtes connecté en tant que <strong class="font-bold">{{ user?.email }}</strong>. Veuillez vous connecter avec le bon compte pour accepter.
                </p>
              </div>
              <div class="mt-6">
                <NuxtLink :to="`/auth/login?redirect=/invite?token=${token}`" class="w-full py-3 px-4 bg-white dark:bg-[#2A2A2D] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-base rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center">
                  Changer de compte
                </NuxtLink>
              </div>
            </div>

            <div v-else>
              <div class="p-8 bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-gray-800 rounded-2xl mb-8">
                <div class="flex items-center justify-center h-20 w-20 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-3xl mx-auto mb-6 shadow-xl">
                  {{ invitation.organization?.name?.charAt(0).toUpperCase() || 'O' }}
                </div>
                <p class="text-center text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  <strong class="font-bold text-black dark:text-white">{{ invitation.inviter?.name || 'Quelqu\'un' }}</strong> vous a invité à rejoindre l'organisation <strong class="font-bold text-black dark:text-white">{{ invitation.organization?.name }}</strong>.
                  
                  <template v-if="invitation.team">
                    <br><br>Vous serez également ajouté à l'équipe <strong class="font-bold text-black dark:text-white">{{ invitation.team.name }}</strong>.
                  </template>
                  
                  <template v-if="invitation.projet">
                    <br>Vous serez également ajouté au projet <strong class="font-bold text-black dark:text-white">{{ invitation.projet.name }}</strong>.
                  </template>
                </p>
              </div>

              <button
                @click="handleAccept"
                :disabled="isLoading"
                class="w-full py-4 px-4 btn-primary text-white font-bold text-lg rounded-full neo-emboss border border-primary/50 hover:brightness-110 active:neo-inset active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <svg v-if="isLoading" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{{ isLoading ? 'Acceptation en cours...' : 'Accepter l\'invitation' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>