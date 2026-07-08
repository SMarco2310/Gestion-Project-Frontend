<script setup lang="ts">
// Landing page does not need auth middleware
definePageMeta({
  layout: false // explicitly disable any layout just in case
})
</script>

<template>
  <div class="landing min-h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-x-hidden selection:bg-primary selection:text-white">

    <!-- Navigation -->
    <nav class="absolute top-0 left-0 right-0 z-50">
      <div class="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/assets/logo_app.svg" alt="Logo" class="w-8 h-8 object-contain">
          <span class="landing-display text-xl font-bold tracking-tight text-slate-900">Gestion Pro</span>
        </div>
        
        <div class="hidden md:flex items-center gap-8">
          <a href="#" class="text-sm font-medium text-slate-600 hover:text-primary transition-colors border-b-2 border-primary pb-1">Product</a>
          <a href="#features" class="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Features</a>
          <a href="#" class="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Resources</a>
          <a href="#" class="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Pricing</a>
        </div>

        <div class="flex items-center gap-4">
          <NuxtLink to="/auth/login" class="text-sm font-semibold text-slate-700 hover:text-primary transition-colors">Se connecter</NuxtLink>
          <NuxtLink to="/auth/signup" class="text-sm font-semibold bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-primary/30 hover:-translate-y-0.5">Commencer</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <main class="relative pt-32 lg:pt-48 pb-20">
      <div class="max-w-5xl mx-auto px-6 text-center">
        <h1 class="landing-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
          Gérez vos projets avec <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">précision</span>
        </h1>

        <p class="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          La plateforme tout-en-un pour les équipes exigeantes. Synchronisez, planifiez et exécutez sans friction.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <NuxtLink to="/auth/signup" class="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-blue-600 text-white rounded-full font-semibold text-base transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 flex items-center justify-center gap-2">
            Démarrer gratuitement
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
          </NuxtLink>
          <button class="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-sm">
            <Icon name="heroicons:play-circle" class="w-5 h-5 text-slate-400" />
            Voir la démo
          </button>
        </div>
      </div>
    </main>

    <!-- App Mockup Section -->
    <section class="relative max-w-6xl mx-auto px-6 pb-32">
      <div class="relative rounded-2xl md:rounded-[2rem] bg-white p-2 shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform-gpu hover:scale-[1.01] transition-transform duration-500">
        <img src="/app_mockup.png" alt="App Interface" class="w-full rounded-xl md:rounded-[1.5rem] object-cover bg-slate-50 border border-slate-100">
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 bg-white border-t border-slate-100">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <h2 class="landing-display text-3xl md:text-4xl font-bold mb-4 text-slate-900 tracking-tight">Construit pour l'efficacité</h2>
          <p class="text-slate-500 text-lg">Outils professionnels conçus pour réduire le bruit et augmenter la concentration.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <!-- Feature 1 -->
          <div class="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Icon name="heroicons:building-office-2" class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-3">Multi-Organisations</h3>
            <p class="text-slate-500 leading-relaxed text-sm">
              Gérez plusieurs espaces de travail, clients et équipes depuis une seule interface fluide. Plus de changement de contexte.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <Icon name="heroicons:view-columns" class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-3">Vues Kanban</h3>
            <p class="text-slate-500 leading-relaxed text-sm">
              Visualisez le flux de travail avec clarté et précision. Suivez l'avancement en temps réel.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mb-6">
              <Icon name="heroicons:bolt" class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-3">Synchronisation Temps Réel</h3>
            <p class="text-slate-500 leading-relaxed text-sm">
              Vos données sont mises à jour instantanément pour toute l'équipe. Fini les conflits de version.
            </p>
          </div>

          <!-- Feature 4 (Illustration placeholder) -->
          <div class="p-8 rounded-2xl bg-[#F8FAFC] border border-slate-100 shadow-sm flex items-center justify-center min-h-[200px]">
             <div class="flex items-center gap-4 text-slate-400">
               <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 font-medium text-slate-600">A</div>
               <div class="h-px w-16 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
               <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 text-blue-500">
                 <Icon name="heroicons:arrows-right-left" class="w-4 h-4" />
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#F8FAFC] border-t border-slate-100">
      <div class="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-900">Gestion Pro</span>
        </div>
        
        <div class="flex items-center gap-6 text-sm text-slate-500">
          <a href="#" class="hover:text-slate-900 transition-colors">Privacy Policy</a>
          <a href="#" class="hover:text-slate-900 transition-colors">Terms of Service</a>
          <a href="#" class="hover:text-slate-900 transition-colors">Cookies</a>
          <a href="#" class="hover:text-slate-900 transition-colors">Contact</a>
        </div>

        <div class="text-sm text-slate-400">
          &copy; {{ new Date().getFullYear() }} Gestion Pro. All rights reserved.
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.landing {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

.landing-display {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.02em;
}

/* Base styles for a clean light theme */
html {
  scroll-behavior: smooth;
}
</style>