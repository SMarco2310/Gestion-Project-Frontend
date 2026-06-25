<script setup lang="ts">
definePageMeta({
  pageTransition: {
    name: 'fade',
    mode: 'out-in'
  }
})

const showPassword = ref(false);
const togglePassword = () => {
    showPassword.value = !showPassword.value;
}
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 lg:p-4 overflow-y-auto">
    <!-- Background Image spanning the entire screen -->
    <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80" alt="Background" class="absolute inset-0 w-full h-full object-cover fixed" />
    
    <!-- Dark Gradient Overlay -->
    <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20 fixed"></div>

    <!-- Top Left Branding -->
    <div class="absolute top-8 left-8 lg:top-12 lg:left-12 z-20 flex items-center gap-3">
       <img src="/assets/logo_app.png" alt="Logo" class="w-10 h-10 object-contain drop-shadow-md" />
       <span class="text-white font-bold text-2xl tracking-wide">Gestion de Projets</span>
    </div>

    <!-- Main Content Container -->
    <div class="relative z-10 w-full max-w-[3000px] min-h-[calc(100vh-2rem)] flex flex-col lg:flex-row items-center justify-between gap-10 my-auto">
      
      <!-- Left Panel - Text content -->
      <div class="hidden lg:flex flex-col w-full lg:w-1/2 text-white p-8 lg:p-12 rounded-xl justify-center h-full">

        <div class="my-auto">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Gérez plus intelligemment.<br />
            Collaborez plus vite.<br />
            Réussissez partout.
          </h1>
          <p class="text-gray-200 text-lg max-w-md">
            De la planification rapide aux projets complexes, notre outil puissant vous permet de travailler en toute fluidité sur tous vos appareils.
          </p>
        </div>
      </div>

      <!-- Right Panel - Large Floating Form Card -->
      <div class="w-full lg:w-1/2 max-w-[700px] min-h-[calc(100vh-2rem)] flex flex-col justify-center bg-white dark:bg-[#1D1D1D] rounded-[1.5rem] shadow-2xl p-8 sm:p-12 lg:p-16 xl:p-20 lg:ml-auto">
        
        <div class="w-full space-y-8">
          
          <!-- Header -->
          <div class="flex flex-col items-left text-left mb-12">
            <h2 class="text-4xl sm:text-5xl font-bold tracking-wider text-black dark:text-white  mb-3">Welcome !</h2>
            <p class="text-gray-500 dark:text-gray-400 font-semibold text-base">Créer un compte pour commencer</p>
          </div>

          <!-- Form -->
          <form @submit.prevent="" class="space-y-6">
            
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom</label>
              <input type="text" id="name" placeholder="Entrez votre nom" class="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A2A2D] text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-colors outline-none text-base" />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input type="email" id="email" placeholder="Entrez votre e-mail" class="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A2A2D] text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-colors outline-none text-base" />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe</label>
              <div class="relative">
                <input :type="showPassword ? 'text' : 'password'" id="password" placeholder="Entrez votre mot de passe" class="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A2A2D] text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-colors outline-none pr-12 text-base" />
                <button type="button" @click="togglePassword" class="absolute inset-y-0 right-0 px-5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label for="password-confirm" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmer le mot de passe</label>
              <div class="relative">
                <input :type="showPassword ? 'text' : 'password'" id="password-confirm" placeholder="Confirmez votre mot de passe" class="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A2A2D] text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-colors outline-none pr-12 text-base" />
                <button type="button" @click="togglePassword" class="absolute inset-y-0 right-0 px-5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                </button>
              </div>
            </div>

            <button type="submit" class="w-full py-4 px-4 bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white font-semibold text-lg rounded-full transition-all mt-8 transform active:scale-[0.98]">
              Créer un compte
            </button>

            <!-- <div class="relative flex items-center py-6">
              <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              <span class="flex-shrink-0 px-4 text-sm text-gray-400 uppercase tracking-wider">Ou continuer avec</span>
              <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            <button type="button" class="w-full py-4 px-4 bg-white dark:bg-[#2A2A2D] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-lg rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98]">
              <Icon name="logos:google-icon" class="w-6 h-6" />
              Continuer avec Google
            </button>
             -->
          </form>

          <p class="text-center text-base text-gray-600 dark:text-gray-400 mt-10">
            Vous avez déjà un compte ? 
            <NuxtLink href="/auth/login" class="text-black dark:text-white font-bold hover:underline">Se connecter</NuxtLink>
          </p>

        </div>
      </div>
    </div>
  </div>
</template>