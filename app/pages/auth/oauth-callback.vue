<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const { getProfile, token } = useAuth()
const { addToast } = useToast()

onMounted(async () => {
  const oauthToken = route.query.token as string

  if (oauthToken) {
    // Set the token
    token.value = oauthToken
    
    try {
      // Fetch user profile to complete auth setup
      await getProfile()
      navigateTo('/organizations')
    } catch (error) {
      addToast({ title: 'Erreur', message: 'Impossible de récupérer le profil.', type: 'error' })
      navigateTo('/auth/login')
    }
  } else {
    addToast({ title: 'Erreur', message: 'Token d\'authentification manquant.', type: 'error' })
    navigateTo('/auth/login')
  }
})
</script>

<template>
  <div class="auth-page min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#151515]">
    <div class="text-center">
      <svg class="animate-spin h-10 w-10 mx-auto text-black dark:text-white mb-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      <h2 class="auth-display text-xl font-bold text-gray-900 dark:text-white tracking-tight">Authentification en cours...</h2>
      <p class="text-gray-500 mt-2">Veuillez patienter pendant que nous finalisons votre connexion.</p>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap');

.auth-page {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

.auth-display {
  font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.03em;
}
</style>


