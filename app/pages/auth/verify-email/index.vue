<template>
  <div class="min-h-screen w-full relative flex items-center justify-center bg-black overflow-hidden font-sans">
    <!-- Background Image with Overlay -->
    <div class="absolute inset-0 z-0">
      <img
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
        alt="Background"
        class="w-full h-full object-cover opacity-60"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
    </div>

    <div class="relative z-10 w-full max-w-md mx-auto p-6">
      <div class="bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl neo-emboss">
        
        <div v-if="isLoading" class="flex flex-col items-center justify-center text-center space-y-6">
          <svg class="animate-spin w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div class="space-y-2">
            <h2 class="text-2xl font-bold text-white tracking-tight">Vérification en cours...</h2>
            <p class="text-gray-300">Veuillez patienter pendant que nous confirmons votre adresse email.</p>
          </div>
        </div>

        <div v-else-if="isSuccess" class="flex flex-col items-center justify-center text-center space-y-6">
          <div class="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-2">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-bold text-white tracking-tight">Email vérifié !</h2>
            <p class="text-gray-300">{{ message }}</p>
          </div>
          <NuxtLink to="/organizations" class="w-full py-3 px-4 bg-primary text-white font-bold text-lg rounded-full neo-emboss border border-primary/50 hover:brightness-110 active:neo-inset transition-all flex items-center justify-center mt-6">
            Continuer vers l'application
          </NuxtLink>
        </div>

        <div v-else class="flex flex-col items-center justify-center text-center space-y-6">
          <div class="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-2">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-bold text-white tracking-tight">Échec de vérification</h2>
            <p class="text-gray-300">{{ message || "Le lien de vérification est invalide ou a expiré." }}</p>
          </div>
          <NuxtLink to="/auth/login" class="w-full py-3 px-4 bg-white/10 text-white font-bold text-lg rounded-full border border-white/20 hover:bg-white/20 active:neo-inset transition-all flex items-center justify-center mt-6">
            Retour à la connexion
          </NuxtLink>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: false,
})

const route = useRoute()
const { verifyEmail } = useAuth()

const isLoading = ref(true)
const isSuccess = ref(false)
const message = ref('')

onMounted(async () => {
  const verifyUrl = route.query.verify_url as string

  if (!verifyUrl) {
    isLoading.value = false
    isSuccess.value = false
    message.value = "Lien de vérification introuvable."
    return
  }

  try {
    const response = await verifyEmail(verifyUrl)
    isSuccess.value = true
    message.value = response.message || "Votre adresse email a été confirmée avec succès."
  } catch (error: any) {
    isSuccess.value = false
    message.value = error?.data?.message || "Une erreur s'est produite lors de la vérification de votre email."
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.neo-emboss {
  box-shadow: 
    -2px -2px 6px rgba(255, 255, 255, 0.1),
    4px 4px 8px rgba(0, 0, 0, 0.6);
}
.active\:neo-inset:active {
  box-shadow: 
    inset -2px -2px 6px rgba(255, 255, 255, 0.1),
    inset 4px 4px 8px rgba(0, 0, 0, 0.6);
}
</style>
