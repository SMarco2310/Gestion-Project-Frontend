<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-white font-sans">
    <div class="w-full max-w-md mx-auto p-8 flex flex-col items-center">
      
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center text-center space-y-8 w-full">
        <div class="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(59,130,246,0.15)]">
          <svg class="animate-spin w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-black font-mono">Vérification...</h2>
          <p class="text-slate-500 text-lg">Veuillez patienter pendant que nous confirmons votre adresse email.</p>
        </div>
      </div>

      <!-- Success State -->
      <div v-else-if="isSuccess" class="flex flex-col items-center justify-center text-center space-y-8 w-full">
        <div class="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(34,197,94,0.15)]">
          <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-black font-mono">Email vérifié !</h2>
          <p class="text-slate-500 text-lg px-4">{{ message }}</p>
        </div>
        <NuxtLink to="/organizations" class="w-full py-4 px-6 bg-[#0A0A0A] hover:bg-black text-white font-mono font-medium text-base rounded-full shadow-lg shadow-black/10 transition-all flex items-center justify-center mt-4">
          Continuer vers l'application
        </NuxtLink>
      </div>

      <!-- Error State -->
      <div v-else class="flex flex-col items-center justify-center text-center space-y-8 w-full">
        <div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(239,68,68,0.15)]">
          <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-black font-mono">Échec de vérification</h2>
          <p class="text-slate-500 text-lg px-4">{{ message || "Le lien de vérification est invalide ou a expiré." }}</p>
        </div>
        <NuxtLink to="/auth/login" class="w-full py-4 px-6 bg-[#0A0A0A] hover:bg-black text-white font-mono font-medium text-base rounded-full shadow-lg shadow-black/10 transition-all flex items-center justify-center mt-4">
          Retour à la connexion
        </NuxtLink>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');

.font-sans {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

.font-mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
</style>
