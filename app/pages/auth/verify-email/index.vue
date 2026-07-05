<template>
  <div class="min-h-screen w-full relative flex items-center justify-center bg-[#F8FAFC] font-sans selection:bg-primary selection:text-white p-6">
    <div class="relative z-10 w-full max-w-md mx-auto">
      <div class="bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl shadow-slate-200/50">
        
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center text-center space-y-6">
          <svg class="animate-spin w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div class="space-y-2">
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Vérification en cours...</h2>
            <p class="text-slate-500 text-sm leading-relaxed">Veuillez patienter pendant que nous confirmons votre adresse email.</p>
          </div>
        </div>

        <!-- Success State -->
        <div v-else-if="isSuccess" class="flex flex-col items-center justify-center text-center space-y-6 animate-fade-in-up">
          <div class="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2 shadow-sm border border-emerald-100">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Email vérifié !</h2>
            <p class="text-slate-500 text-sm leading-relaxed">{{ message }}</p>
          </div>
          <NuxtLink to="/organizations" class="w-full py-3.5 px-4 bg-primary text-white font-semibold text-base rounded-full shadow-lg shadow-primary/20 hover:bg-blue-600 hover:-translate-y-0.5 transition-all flex items-center justify-center mt-6">
            Continuer vers l'application
          </NuxtLink>
        </div>

        <!-- Error State -->
        <div v-else class="flex flex-col items-center justify-center text-center space-y-6 animate-fade-in-up">
          <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2 shadow-sm border border-red-100">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Échec de vérification</h2>
            <p class="text-slate-500 text-sm leading-relaxed">{{ message || "Le lien de vérification est invalide ou a expiré." }}</p>
          </div>
          <NuxtLink to="/auth/login" class="w-full py-3.5 px-4 bg-white text-slate-700 font-semibold text-base rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center mt-6">
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.font-sans {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
