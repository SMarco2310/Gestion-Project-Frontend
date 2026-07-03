<script setup lang="ts">
// Landing page does not need auth middleware
definePageMeta({
  layout: false // explicitly disable any layout just in case
})
</script>

<template>
  <div class="landing min-h-screen bg-canvas dark:bg-[#121212] text-main dark:text-gray-200 selection:bg-primary selection:text-white font-sans overflow-x-hidden">

    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-canvas/80 dark:bg-[#0B0F17]/80 backdrop-blur-md border-b border-form-border dark:border-white/10">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/assets/logo_app.png" alt="Logo" class="w-8 h-8 object-contain">
          <span class="landing-display text-xl font-bold tracking-tight">Gestion de Projets</span>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink to="/auth/login" class="text-sm font-medium hover:text-primary transition-colors">Se connecter</NuxtLink>
          <NuxtLink to="/auth/signup" class="text-sm font-bold bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-full transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5">Commencer</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <main class="landing-hero relative pt-20 overflow-hidden bg-[#0B0F17] text-white">
      <!-- Photo background -->
      <div class="absolute inset-0">
        <img src="/assets/hero-building.jpg" alt="" class="w-full h-full object-cover object-[70%_30%] opacity-70">
        <div class="absolute inset-0 bg-gradient-to-r from-[#0B0F17] via-[#0B0F17]/85 to-[#0B0F17]/20"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-transparent to-[#0B0F17]/40"></div>
        <div class="landing-dotgrid absolute inset-0 opacity-[0.12] pointer-events-none"></div>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-28 lg:pt-36 lg:pb-40">
        <div class="max-w-2xl">
          <div class="landing-mono inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/15 text-[11px] font-medium uppercase tracking-[0.15em] mb-8 animate-fade-in-up">
            <span class="relative flex h-1.5 w-1.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
            </span>
            Nouvelle version disponible
          </div>

          <h1 class="landing-display text-5xl lg:text-6xl font-bold tracking-tight mb-7 leading-[1.08] animate-fade-in-up" style="animation-delay: 100ms;">
            Gérez vos projets et vos équipes
            <span class="block text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-300">avec fluidité.</span>
          </h1>

          <p class="text-lg text-slate-300 max-w-xl mb-10 leading-relaxed animate-fade-in-up" style="animation-delay: 200ms;">
            Une plateforme tout-en-un conçue pour les organisations modernes. Centralisez vos tâches, collaborez en temps réel et atteignez vos objectifs plus rapidement.
          </p>

          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in-up" style="animation-delay: 300ms;">
            <NuxtLink to="/auth/signup" class="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-blue-600 text-white rounded-full font-bold text-base transition-all shadow-xl shadow-primary/30 hover:-translate-y-1 flex items-center justify-center gap-2">
              Commencer gratuitement
              <Icon name="heroicons:arrow-right" class="w-5 h-5" />
            </NuxtLink>
            <NuxtLink to="/auth/login" class="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/20 hover:bg-white/10 text-white rounded-full font-bold text-base transition-all flex items-center justify-center backdrop-blur-sm">
              Se connecter
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Trust / stats strip -->
      <div class="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div class="max-w-7xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
          <div class="text-center sm:text-left">
            <div class="landing-mono text-2xl lg:text-3xl font-bold text-white">99.9<span class="text-amber-400">%</span></div>
            <div class="text-xs uppercase tracking-wider text-slate-400 mt-1">Disponibilité</div>
          </div>
          <div class="text-center sm:text-left">
            <div class="landing-mono text-2xl lg:text-3xl font-bold text-white">2 400<span class="text-amber-400">+</span></div>
            <div class="text-xs uppercase tracking-wider text-slate-400 mt-1">Équipes actives</div>
          </div>
          <div class="text-center sm:text-left">
            <div class="landing-mono text-2xl lg:text-3xl font-bold text-white">&lt;100<span class="text-amber-400">ms</span></div>
            <div class="text-xs uppercase tracking-wider text-slate-400 mt-1">Sync temps réel</div>
          </div>
        </div>
      </div>
    </main>

    <!-- Features Section -->
    <section class="py-24 lg:py-32 bg-card dark:bg-[#161618] border-t border-form-border dark:border-white/10">
      <div class="max-w-7xl mx-auto px-6">
        <div class="max-w-2xl mb-16">
          <div class="landing-mono text-xs uppercase tracking-[0.15em] text-primary font-semibold mb-4">Fonctionnalités</div>
          <h2 class="landing-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">Tout ce dont vous avez besoin</h2>
          <p class="text-secondary dark:text-gray-400 text-lg">Des outils puissants pensés pour la productivité et la collaboration à grande échelle.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Feature 1 -->
          <div class="landing-card group relative p-8 rounded-2xl bg-canvas dark:bg-[#1D1D1D] border border-form-border dark:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div class="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Icon name="heroicons:rectangle-group" class="w-6 h-6 text-primary" />
            </div>
            <h3 class="landing-display text-lg font-bold mb-3">Multi-Organisations</h3>
            <p class="text-secondary dark:text-gray-400 leading-relaxed text-sm">
              Gérez plusieurs entités, équipes et projets depuis un seul compte. Basculez d'une organisation à l'autre en un clic.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="landing-card group relative p-8 rounded-2xl bg-canvas dark:bg-[#1D1D1D] border border-form-border dark:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div class="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Icon name="heroicons:view-columns" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 class="landing-display text-lg font-bold mb-3">Vues Kanban Flexibles</h3>
            <p class="text-secondary dark:text-gray-400 leading-relaxed text-sm">
              Visualisez l'avancement de vos tâches grâce à des tableaux Kanban interactifs et personnalisables.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="landing-card group relative p-8 rounded-2xl bg-canvas dark:bg-[#1D1D1D] border border-form-border dark:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div class="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Icon name="heroicons:bell-alert" class="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 class="landing-display text-lg font-bold mb-3">Temps Réel</h3>
            <p class="text-secondary dark:text-gray-400 leading-relaxed text-sm">
              Restez informé de chaque mise à jour grâce à un système de notifications en temps réel et des commentaires intégrés.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA band -->
    <section class="relative py-20 lg:py-28 bg-[#0B0F17] overflow-hidden">
      <div class="landing-dotgrid absolute inset-0 opacity-[0.08] pointer-events-none"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-[#0B0F17] via-[#0B0F17]/95 to-[#0B0F17]"></div>
      <div class="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <h2 class="landing-display text-3xl md:text-4xl font-bold text-white mb-5 tracking-tight">
          Prêt à faire avancer vos projets ?
        </h2>
        <p class="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
          Rejoignez les équipes qui pilotent déjà leurs projets avec plus de clarté et moins de friction.
        </p>
        <NuxtLink to="/auth/signup" class="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-blue-600 text-white rounded-full font-bold text-base transition-all shadow-xl shadow-primary/30 hover:-translate-y-1">
          Commencer gratuitement
          <Icon name="heroicons:arrow-right" class="w-5 h-5" />
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#080B11] border-t border-white/10 text-slate-400">
      <div class="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div class="col-span-2 md:col-span-1">
          <div class="flex items-center gap-2 mb-4">
            <img src="/assets/logo_app.png" alt="Logo" class="w-6 h-6">
            <span class="landing-display font-bold text-white">Gestion de Projets</span>
          </div>
          <p class="text-sm leading-relaxed">La plateforme tout-en-un pour piloter vos équipes et vos projets.</p>
        </div>
        <div>
          <div class="landing-mono text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Produit</div>
          <ul class="space-y-3 text-sm">
            <li><NuxtLink to="/auth/signup" class="hover:text-white transition-colors">Commencer</NuxtLink></li>
            <li><NuxtLink to="/auth/login" class="hover:text-white transition-colors">Se connecter</NuxtLink></li>
          </ul>
        </div>
        <div>
          <div class="landing-mono text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Fonctionnalités</div>
          <ul class="space-y-3 text-sm">
            <li>Multi-organisations</li>
            <li>Vues Kanban</li>
            <li>Notifications temps réel</li>
          </ul>
        </div>
        <div>
          <div class="landing-mono text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Entreprise</div>
          <ul class="space-y-3 text-sm">
            <li>À propos</li>
            <li>Confidentialité</li>
            <li>Conditions d'utilisation</li>
          </ul>
        </div>
      </div>
      <div class="border-t border-white/10">
        <div class="max-w-7xl mx-auto px-6 py-6 text-sm text-slate-500 text-center">
          &copy; {{ new Date().getFullYear() }} Gestion de Projets. Tous droits réservés.
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');

.landing {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

.landing-display {
  font-family: 'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif;
}

.landing-mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

/* Dot-grid texture, echoes the brief's connective/network reference imagery */
.landing-dotgrid {
  background-image: radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px);
  background-size: 18px 18px;
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-up,
  .animate-ping {
    animation: none !important;
  }
}
</style>