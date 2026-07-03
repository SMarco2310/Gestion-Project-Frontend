<script setup lang="ts">
definePageMeta({
  pageTransition: {
    name: 'fade',
    mode: 'out-in'
  }
})

const { signup } = useAuth();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const fieldErrors = ref<Record<string, string>>({});
const loading = ref(false);

const showPassword = ref(false);
const togglePassword = () => {
    showPassword.value = !showPassword.value;
}

watch(name, () => { if (fieldErrors.value.name) delete fieldErrors.value.name; });
watch(email, () => { if (fieldErrors.value.email) delete fieldErrors.value.email; });
watch(password, () => { if (fieldErrors.value.password) delete fieldErrors.value.password; });
watch(confirmPassword, () => { if (fieldErrors.value.confirmPassword) delete fieldErrors.value.confirmPassword; });

// Client-side validation
const validateFields = (): boolean => {
  fieldErrors.value = {};

  if (!name.value.trim()) {
    fieldErrors.value.name = 'Le nom est requis.';
  }

  if (!email.value.trim()) {
    fieldErrors.value.email = "L'adresse e-mail est requise.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    fieldErrors.value.email = "Veuillez entrer une adresse e-mail valide.";
  }

  if (!password.value) {
    fieldErrors.value.password = 'Le mot de passe est requis.';
  } else if (password.value.length < 8) {
    fieldErrors.value.password = 'Le mot de passe doit contenir au moins 8 caractères.';
  }

  if (!confirmPassword.value) {
    fieldErrors.value.confirmPassword = 'Veuillez confirmer le mot de passe.';
  } else if (password.value !== confirmPassword.value) {
    fieldErrors.value.confirmPassword = 'Les mots de passe ne correspondent pas.';
  }

  return Object.keys(fieldErrors.value).length === 0;
}

const handleSignup = async () => {
    errorMessage.value = '';

    if (!validateFields()) return;

    loading.value = true;

    try {
        await signup(name.value, email.value, password.value);
        navigateTo('/organizations');
    } catch (error: any) {
        // Parse Laravel validation errors
        if (error?.data?.errors) {
            const errors = error.data.errors;
            if (errors.name) fieldErrors.value.name = errors.name[0];
            if (errors.email) fieldErrors.value.email = errors.email[0];
            if (errors.password) fieldErrors.value.password = errors.password[0];
        } else if (error?.data?.message) {
            errorMessage.value = error.data.message;
        } else {
            errorMessage.value = "Une erreur est survenue lors de l'inscription.";
        }
    } finally {
        loading.value = false;
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
    <div class="absolute top-8 left-8 lg:top-12 lg:left-12 z-20 flex items-center gap-3">
       <img src="/assets/logo_app.png" alt="Logo" class="w-10 h-10 object-contain drop-shadow-none lg:drop-shadow-md" />
       <span class="hidden lg:block text-white font-bold text-2xl tracking-wide">Gestion de Projets</span>
    </div>

    <!-- Main Content Container -->
    <div class="relative z-10 w-full max-w-[3000px] min-h-[100dvh] lg:min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row items-center justify-between lg:gap-10">
      
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
      <div class="w-full lg:w-1/2 max-w-[700px] min-h-[100dvh] lg:min-h-[calc(100vh-4rem)] flex flex-col justify-center bg-white dark:bg-[#1D1D1D] rounded-none lg:rounded-[1.5rem] lg:neo-card p-8 sm:p-12 lg:p-16 xl:p-20 lg:ml-auto border-0 lg:border border-white/50 dark:border-white/5">
        
        <div class="w-full space-y-8">
          
          <!-- Header -->
          <div class="flex flex-col items-left text-left mb-12">
            <h2 class="text-4xl sm:text-5xl font-bold tracking-wider text-black dark:text-white  mb-3">Bienvenue!</h2>
            <p class="text-gray-500 dark:text-gray-400 font-semibold text-base">Créer un compte pour commencer</p>
          </div>

          <!-- General Error -->
          <div v-if="errorMessage" class="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
            <Icon name="heroicons:exclamation-circle" class="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
            <span class="text-red-600 dark:text-red-400 text-sm">{{ errorMessage }}</span>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSignup" class="space-y-6">
            
            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom</label>
              <input v-model="name" id="name" type="text" placeholder="Entrez votre nom" :class="['w-full px-5 py-4 rounded-xl neo-input bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white focus:ring-2 outline-none text-base transition-all', fieldErrors.name ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-black/50 dark:focus:ring-white/50']" />
              <p v-if="fieldErrors.name" class="mt-1.5 ml-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <Icon name="heroicons:exclamation-circle" class="w-3.5 h-3.5" /> {{ fieldErrors.name }}
              </p>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input v-model="email" id="email" type="email" placeholder="Entrez votre e-mail" :class="['w-full px-5 py-4 rounded-xl neo-input bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white focus:ring-2 outline-none text-base transition-all', fieldErrors.email ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-black/50 dark:focus:ring-white/50']" />
              <p v-if="fieldErrors.email" class="mt-1.5 ml-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <Icon name="heroicons:exclamation-circle" class="w-3.5 h-3.5" /> {{ fieldErrors.email }}
              </p>
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe</label>
              <div class="relative">
                <input v-model="password" :type="showPassword ? 'text' : 'password'" id="password" placeholder="Entrez votre mot de passe" :class="['w-full px-5 py-4 rounded-xl neo-input bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white focus:ring-2 outline-none pr-12 text-base transition-all', fieldErrors.password ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-black/50 dark:focus:ring-white/50']" />
                <button type="button" @click="togglePassword" class="absolute inset-y-0 right-0 px-5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                </button>
              </div>
              <p v-if="fieldErrors.password" class="mt-1.5 ml-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <Icon name="heroicons:exclamation-circle" class="w-3.5 h-3.5" /> {{ fieldErrors.password }}
              </p>
            </div>

            <!-- Confirm Password -->
            <div>
              <label for="password-confirm" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmer le mot de passe</label>
              <div class="relative">
                <input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" id="password-confirm" placeholder="Confirmez votre mot de passe" :class="['w-full px-5 py-4 rounded-xl neo-input bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white focus:ring-2 outline-none pr-12 text-base transition-all', fieldErrors.confirmPassword ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-black/50 dark:focus:ring-white/50']" />
                <button type="button" @click="togglePassword" class="absolute inset-y-0 right-0 px-5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                </button>
              </div>
              <p v-if="fieldErrors.confirmPassword" class="mt-1.5 ml-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <Icon name="heroicons:exclamation-circle" class="w-3.5 h-3.5" /> {{ fieldErrors.confirmPassword }}
              </p>
            </div>

            <button type="submit" class="w-full py-4 px-4 bg-gradient-to-b from-gray-800 to-black dark:from-white dark:to-gray-200 text-white dark:text-black font-bold text-lg rounded-full neo-emboss border border-gray-700/50 dark:border-white/50 hover:brightness-110 active:neo-inset active:scale-[0.98] mt-8 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" :disabled="loading">
              <svg v-if="loading" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              {{ loading ? 'Création...' : 'Créer un compte' }}
            </button>

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