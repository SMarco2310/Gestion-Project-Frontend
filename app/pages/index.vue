<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { AreaChart } from 'vue-chrts'

// Landing page does not need auth middleware
definePageMeta({
  layout: false // explicitly disable any layout just in case
})

// --- Hero floating cards: cycling content per slot ---
interface HeroCardData {
  statusLabel: string
  statusColor: string
  dotColor: string
  title: string
  tag?: { label: string; bg: string; text: string }
  reference?: string
  refColor?: string
  assignee?: { initials: string; colorClass: string }
  done?: boolean
  projetName?: string
  commentairesCount?: number
  attachmentsCount?: number
  dark?: boolean
}

const heroCardPools: HeroCardData[][] = [
  [
    { statusLabel: 'À faire', statusColor: '#9CA3AF', dotColor: '#0055cc', title: 'Optimisation du pipeline CI/CD', tag: { label: 'BACKEND', bg: 'bg-gray-100', text: 'text-gray-700' } },
    { statusLabel: 'À faire', statusColor: '#9CA3AF', dotColor: '#0055cc', title: 'Migration base de données', tag: { label: 'DEVOPS', bg: 'bg-amber-50', text: 'text-amber-700' }, dark: true },
    { statusLabel: 'À faire', statusColor: '#9CA3AF', dotColor: '#0055cc', title: 'Audit de sécurité API', tag: { label: 'SECURITY', bg: 'bg-rose-50', text: 'text-rose-700' } }
  ],
  [
    { statusLabel: 'En cours', statusColor: '#6B7280', dotColor: '#f97316', title: "Refonte de l'interface d'onboarding", tag: { label: 'UI/UX', bg: 'bg-purple-50', text: 'text-purple-700' }, assignee: { initials: 'AP', colorClass: 'bg-slate-800' } },
    { statusLabel: 'En cours', statusColor: '#6B7280', dotColor: '#f97316', title: 'Intégration du Kanban interactif', tag: { label: 'FRONTEND', bg: 'bg-rose-50', text: 'text-rose-700' }, assignee: { initials: 'MS', colorClass: 'bg-emerald-600' }, dark: true },
    { statusLabel: 'En cours', statusColor: '#6B7280', dotColor: '#f97316', title: 'Configuration des webhooks', tag: { label: 'API', bg: 'bg-blue-50', text: 'text-blue-700' }, assignee: { initials: 'CL', colorClass: 'bg-amber-600' } }
  ],
  [
    { statusLabel: 'Terminé', statusColor: '#6B7280', dotColor: '#10B981', title: 'Audit de performance des APIs', reference: 'GP-103', refColor: '#10B981', assignee: { initials: 'ML', colorClass: 'bg-violet-600' }, done: true },
    { statusLabel: 'Terminé', statusColor: '#6B7280', dotColor: '#10B981', title: 'Alignement design system', reference: 'GP-100', refColor: '#10B981', assignee: { initials: 'AP', colorClass: 'bg-slate-800' }, done: true, dark: true },
    { statusLabel: 'Terminé', statusColor: '#6B7280', dotColor: '#10B981', title: 'Déploiement v2.4 en prod', reference: 'GP-108', refColor: '#10B981', assignee: { initials: 'MS', colorClass: 'bg-emerald-600' }, done: true }
  ],
  [
    { statusLabel: 'En cours', statusColor: '#6B7280', dotColor: '#ae2e24', title: 'Intégration du Kanban interactif', tag: { label: 'FRONTEND', bg: 'bg-rose-50', text: 'text-rose-700' }, projetName: 'Refonte UI', reference: 'GP-103', commentairesCount: 5, attachmentsCount: 2, assignee: { initials: 'AP', colorClass: 'bg-slate-800' } },
    { statusLabel: 'À faire', statusColor: '#9CA3AF', dotColor: '#0055cc', title: 'Configuration des webhooks Slack', tag: { label: 'INTEGRATION', bg: 'bg-indigo-50', text: 'text-indigo-700' }, projetName: 'API Integration', reference: 'GP-102', commentairesCount: 1, assignee: { initials: 'MS', colorClass: 'bg-emerald-600' }, dark: true },
    { statusLabel: 'En cours', statusColor: '#6B7280', dotColor: '#9333ea', title: 'Prototypes 3D des badges', tag: { label: '3D MOTION', bg: 'bg-purple-50', text: 'text-purple-700' }, projetName: 'UI Lab', reference: 'DS-202', commentairesCount: 2, attachmentsCount: 1, assignee: { initials: 'CL', colorClass: 'bg-amber-600' } }
  ]
]

// Small floating project cards (gradient style) — a few color variants to rotate through
interface HeroProjectCard {
  reference: string
  statusLabel: string
  name: string
  progressLabel: string
  progressPct: number
  dateLabel: string
  gradient: string
}

const heroProjectPool: HeroProjectCard[] = [
  { reference: 'PRJ-003', statusLabel: 'EN COURS', name: 'Refonte UI', progressLabel: 'Tâches accomplies', progressPct: 62, dateLabel: '14 Aoû 2026', gradient: 'from-[#3B82F6] to-[#2563EB]' },
  { reference: 'PRJ-014', statusLabel: 'EN COURS', name: 'API Integration', progressLabel: 'Tâches accomplies', progressPct: 38, dateLabel: '22 Aoû 2026', gradient: 'from-[#8B5CF6] to-[#6D28D9]' },
  { reference: 'PRJ-021', statusLabel: 'À FAIRE', name: 'Design System', progressLabel: 'Tâches accomplies', progressPct: 15, dateLabel: '30 Aoû 2026', gradient: 'from-[#10B981] to-[#059669]' }
]

const heroCardIndex = ref([0, 0, 0, 0])
const heroProjectIndex = ref(0)
const heroProjectIndexLeft = ref(1)

const currentHeroCard = (slot: number) => heroCardPools[slot]?.[heroCardIndex.value[slot]!] ?? heroCardPools[slot]![0]!
const currentHeroProject = computed(() => heroProjectPool[heroProjectIndex.value] ?? heroProjectPool[0]!)
const currentHeroProjectLeft = computed(() => heroProjectPool[heroProjectIndexLeft.value] ?? heroProjectPool[1]!)

const chartData = [
  { month: 'Sem 1', Activity: 400 },
  { month: 'Sem 2', Activity: 650 },
  { month: 'Sem 3', Activity: 920 },
  { month: 'Sem 4', Activity: 1350 }
]
const currentVelocity = '+48%'

const categories = {
  Activity: {
    name: 'Activité Globale',
    color: '#0B0E11'
  }
}

const xFormatter = (i: number) => chartData[i]?.month || ''

const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    const navOffset = 16
    const elementPosition = element.getBoundingClientRect().top + window.scrollY
    const offsetPosition = elementPosition - navOffset
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

const showBackToTop = ref(false)

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 350
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const colorMode = useColorMode()
const toggleDarkMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const heroCardTimers: ReturnType<typeof setInterval>[] = []

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()

  // Stagger each card slot on its own cadence so swaps feel organic, not synced
  const periods = [6200, 7400, 6800, 8200]
  periods.forEach((ms, slot) => {
    heroCardTimers.push(setInterval(() => {
      heroCardIndex.value[slot] = (heroCardIndex.value[slot]! + 1) % heroCardPools[slot]!.length
    }, ms))
  })
  heroCardTimers.push(setInterval(() => {
    heroProjectIndex.value = (heroProjectIndex.value + 1) % heroProjectPool.length
  }, 8800))
  heroCardTimers.push(setInterval(() => {
    heroProjectIndexLeft.value = (heroProjectIndexLeft.value + 1) % heroProjectPool.length
  }, 7800))

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.08
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
      }
    })
  }, observerOptions)

  const elements = document.querySelectorAll('.reveal-on-scroll')
  elements.forEach((el) => observer.observe(el))
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  heroCardTimers.forEach(clearInterval)
})
</script>

<template>
  <div class="landing min-h-screen bg-[#F4F5F7] dark:bg-[#0A0C10] text-[#111318] dark:text-white selection:bg-[#0B0E11] selection:text-white transition-colors duration-300">

    <!-- Navigation -->
    <nav class="relative top-0 left-0 right-0 z-50 px-4 pt-4">
      <div class="max-w-4xl mx-auto h-16 flex items-center justify-between gap-4 bg-transparent rounded-full pl-3 pr-3">
        <div class="flex items-center gap-2.5 cursor-pointer pl-2 shrink-0" @click="scrollToSection('hero')">
          <img src="/assets/logo_app.svg" alt="Logo" class="w-7 h-7 object-contain">
          <span class="land-display text-lg font-extrabold tracking-tight text-[#111318] dark:text-white hidden sm:inline">Gestion Pro</span>
        </div>

        <div class="hidden md:flex items-center gap-3 lg:gap-5 bg-transparent rounded-full p-1 mx-10 lg:mx-16">
          <a href="#hero" @click.prevent="scrollToSection('hero')" class="land-body text-sm font-semibold text-[#374151] dark:text-white/70 hover:text-[#111318] dark:hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white dark:hover:bg-white/10">Aperçu</a>
          <a href="#features" @click.prevent="scrollToSection('features')" class="land-body text-sm font-semibold text-[#374151] dark:text-white/70 hover:text-[#111318] dark:hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white dark:hover:bg-white/10">Fonctionnalités</a>
          <a href="#pricing" @click.prevent="scrollToSection('pricing')" class="land-body text-sm font-semibold text-[#374151] dark:text-white/70 hover:text-[#111318] dark:hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white dark:hover:bg-white/10">Tarifs</a>
        </div>

        <div class="flex items-center gap-2 shrink-0 ml-10 lg:ml-16">
          <button
            @click="toggleDarkMode"
            class="p-2.5 rounded-full text-[#6B7280] dark:text-white/60 hover:text-[#111318] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            :aria-label="colorMode.value === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'"
          >
            <Icon :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'" class="w-4 h-4" />
          </button>
          <NuxtLink to="/auth/login" class="land-body text-sm font-semibold text-[#6B7280] dark:text-white/60 hover:text-[#111318] dark:hover:text-white transition-colors hidden sm:block px-3">Se connecter</NuxtLink>
          <NuxtLink to="/auth/signup" class="land-body text-sm rounded-full px-5 py-2.5 btn-primary neo-emboss land-btn-black">Commencer</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <main id="hero" class="relative pt-32 md:pt-44 pb-28 md:pb-36 overflow-hidden">
      <!-- Subtle structure grid -->
      <div class="land-grid-bg absolute inset-0 pointer-events-none"></div>

      <!-- Floating task cards around the copy — positioned against full viewport, clear of the centered text column -->
      <!-- Slot 0: top-left, cycles through À faire tasks -->
      <div class="hidden md:block absolute top-20 left-4 md:left-8 lg:left-16 xl:left-24 w-44 md:w-48 lg:w-60 land-card-float z-0">
        <Transition name="hero-card-swap" mode="out-in">
          <div :key="heroCardIndex[0]" :class="['p-4 lg:p-5 rounded-2xl border shadow-lg rotate-[-8deg]', currentHeroCard(0).dark ? 'bg-gradient-to-b from-[#2E2E32] to-[#232326] border-white/[0.08]' : 'bg-white border-[#E2E5EB]']">
            <div class="flex items-center gap-2 mb-2 lg:mb-2.5">
              <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: currentHeroCard(0).dotColor }"></span>
              <span class="land-mono text-[8px] lg:text-[9px] font-bold uppercase tracking-wider" :style="{ color: currentHeroCard(0).statusColor }">{{ currentHeroCard(0).statusLabel }}</span>
            </div>
            <p :class="['land-body text-xs lg:text-sm font-semibold leading-snug', currentHeroCard(0).dark ? 'text-white' : 'text-[#374151]']">{{ currentHeroCard(0).title }}</p>
            <div v-if="currentHeroCard(0).tag" class="hidden lg:flex items-center gap-1.5 mt-2.5">
              <span :class="['land-mono text-[8px] px-1.5 py-0.5 rounded font-bold uppercase', currentHeroCard(0).tag!.bg, currentHeroCard(0).tag!.text]">{{ currentHeroCard(0).tag!.label }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Slot 1: right-mid, cycles through En cours tasks -->
      <div class="hidden md:block absolute top-36 right-4 md:right-8 lg:right-16 xl:right-24 w-48 md:w-52 lg:w-64 land-card-float-alt z-0">
        <Transition name="hero-card-swap" mode="out-in">
          <div :key="heroCardIndex[1]" :class="['p-4 lg:p-5 rounded-2xl border shadow-xl rotate-[6deg]', currentHeroCard(1).dark ? 'bg-gradient-to-b from-[#2E2E32] to-[#232326] border-white/[0.08]' : 'bg-white border-[#E2E5EB]']">
            <div class="flex items-center gap-2 mb-2 lg:mb-2.5">
              <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: currentHeroCard(1).dotColor }"></span>
              <span class="land-mono text-[8px] lg:text-[9px] font-bold uppercase tracking-wider" :style="{ color: currentHeroCard(1).statusColor }">{{ currentHeroCard(1).statusLabel }}</span>
            </div>
            <p :class="['land-body text-xs lg:text-sm font-semibold leading-snug', currentHeroCard(1).dark ? 'text-white' : 'text-[#111318]']">{{ currentHeroCard(1).title }}</p>
            <div :class="['hidden lg:flex items-center justify-between mt-2.5 pt-2.5 border-t', currentHeroCard(1).dark ? 'border-white/10' : 'border-[#F4F5F7]']">
              <span v-if="currentHeroCard(1).tag" :class="['land-mono text-[8px] px-1.5 py-0.5 rounded font-bold uppercase', currentHeroCard(1).tag!.bg, currentHeroCard(1).tag!.text]">{{ currentHeroCard(1).tag!.label }}</span>
              <div v-if="currentHeroCard(1).assignee" :class="['w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold', currentHeroCard(1).assignee!.colorClass]">{{ currentHeroCard(1).assignee!.initials }}</div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Slot 2: bottom-left, cycles through Terminé tasks -->
      <div class="hidden md:block absolute bottom-24 left-4 md:left-10 lg:left-20 xl:left-28 w-48 md:w-52 lg:w-64 land-card-float z-0">
        <Transition name="hero-card-swap" mode="out-in">
          <div :key="heroCardIndex[2]" :class="['p-4 lg:p-5 rounded-2xl border shadow-xl rotate-[5deg]', currentHeroCard(2).dark ? 'bg-gradient-to-b from-[#2E2E32] to-[#232326] border-white/[0.08]' : 'bg-white border-[#E2E5EB]']">
            <div class="flex items-center gap-2 mb-2 lg:mb-2.5">
              <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: currentHeroCard(2).dotColor }"></span>
              <span class="land-mono text-[8px] lg:text-[9px] font-bold uppercase tracking-wider" :style="{ color: currentHeroCard(2).statusColor }">{{ currentHeroCard(2).statusLabel }}</span>
            </div>
            <p class="land-body text-xs lg:text-sm font-semibold text-[#9CA3AF] line-through leading-snug">{{ currentHeroCard(2).title }}</p>
            <div :class="['hidden lg:flex items-center justify-between mt-2.5 pt-2.5 border-t', currentHeroCard(2).dark ? 'border-white/10' : 'border-[#F4F5F7]']">
              <span class="land-mono text-[9px] font-bold" :style="{ color: currentHeroCard(2).refColor }">{{ currentHeroCard(2).reference }}</span>
              <div v-if="currentHeroCard(2).assignee" :class="['w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold', currentHeroCard(2).assignee!.colorClass]">{{ currentHeroCard(2).assignee!.initials }}</div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Slot 4: bottom-right, compact in-app style card with folder/comments/attachments -->
      <div class="hidden md:block absolute bottom-44 right-4 md:right-8 lg:right-16 xl:right-24 w-48 md:w-52 lg:w-60 land-card-float z-0">
        <Transition name="hero-card-swap" mode="out-in">
          <div :key="heroCardIndex[3]" :class="['p-3.5 lg:p-4 rounded-2xl border shadow-xl rotate-[7deg] flex flex-col gap-2', currentHeroCard(3).dark ? 'bg-gradient-to-b from-[#2E2E32] to-[#232326] border-white/[0.08]' : 'bg-white border-[#E2E5EB]']">
            <p :class="['land-body text-xs lg:text-sm font-semibold leading-snug', currentHeroCard(3).dark ? 'text-white' : 'text-[#111318]']">{{ currentHeroCard(3).title }}</p>
            <div v-if="currentHeroCard(3).tag" class="flex flex-wrap items-center gap-1">
              <span :class="['land-mono px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider', currentHeroCard(3).tag!.bg, currentHeroCard(3).tag!.text]">{{ currentHeroCard(3).tag!.label }}</span>
            </div>
            <div class="hidden lg:flex items-center gap-1.5 land-mono text-[9px] text-[#9CA3AF] font-medium">
              <Icon name="heroicons:folder" class="w-3 h-3 shrink-0" />
              <span class="truncate">{{ currentHeroCard(3).projetName }}</span>
            </div>
            <div :class="['flex items-center justify-between pt-2 border-t text-[9px] lg:text-[10px]', currentHeroCard(3).dark ? 'border-white/10' : 'border-[#F4F5F7]']">
              <span :class="['land-mono font-semibold', currentHeroCard(3).dark ? 'text-white/50' : 'text-[#6B7280]']">{{ currentHeroCard(3).reference }}</span>
              <div class="flex items-center gap-2 text-[#9CA3AF]">
                <span v-if="currentHeroCard(3).commentairesCount" class="hidden lg:flex items-center gap-1 land-mono"><Icon name="ph:chat-teardrop-text" class="w-3 h-3" />{{ currentHeroCard(3).commentairesCount }}</span>
                <span v-if="currentHeroCard(3).attachmentsCount" class="hidden lg:flex items-center gap-1 land-mono"><Icon name="ph:paperclip" class="w-3 h-3" />{{ currentHeroCard(3).attachmentsCount }}</span>
                <div v-if="currentHeroCard(3).assignee" :class="['w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0', currentHeroCard(3).assignee!.colorClass]">{{ currentHeroCard(3).assignee!.initials }}</div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Small gradient project card, cycling through a few color variants -->
      <div class="hidden md:block absolute top-2 right-24 md:right-36 lg:right-52 xl:right-64 w-32 lg:w-36 land-card-float-alt z-0">
        <Transition name="hero-card-swap" mode="out-in">
          <div :key="heroProjectIndex" :class="['p-3 rounded-xl bg-gradient-to-br text-white shadow-xl rotate-[4deg]', currentHeroProject.gradient]">
            <div class="flex items-center justify-between mb-2">
              <span class="land-mono text-[7px] font-bold opacity-80">{{ currentHeroProject.reference }}</span>
              <span class="land-mono text-[6px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">{{ currentHeroProject.statusLabel }}</span>
            </div>
            <p class="land-body text-[11px] font-bold leading-snug mb-2">{{ currentHeroProject.name }}</p>
            <div class="flex items-center justify-between text-[7px] opacity-80 mb-1">
              <span>{{ currentHeroProject.progressLabel }}</span>
              <span>{{ currentHeroProject.progressPct }}%</span>
            </div>
            <div class="h-1 rounded-full bg-white/20 overflow-hidden">
              <div class="h-full bg-white rounded-full" :style="{ width: currentHeroProject.progressPct + '%' }"></div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Small gradient project card, left of the CTA row -->
      <div class="hidden lg:block absolute top-[26rem] left-24 xl:left-40 w-32 lg:w-36 land-card-float z-0">
        <Transition name="hero-card-swap" mode="out-in">
          <div :key="heroProjectIndexLeft" :class="['p-3 rounded-xl bg-gradient-to-br text-white shadow-xl rotate-[-6deg]', currentHeroProjectLeft.gradient]">
            <div class="flex items-center justify-between mb-2">
              <span class="land-mono text-[7px] font-bold opacity-80">{{ currentHeroProjectLeft.reference }}</span>
              <span class="land-mono text-[6px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">{{ currentHeroProjectLeft.statusLabel }}</span>
            </div>
            <p class="land-body text-[11px] font-bold leading-snug mb-2">{{ currentHeroProjectLeft.name }}</p>
            <div class="flex items-center justify-between text-[7px] opacity-80 mb-1">
              <span>{{ currentHeroProjectLeft.progressLabel }}</span>
              <span>{{ currentHeroProjectLeft.progressPct }}%</span>
            </div>
            <div class="h-1 rounded-full bg-white/20 overflow-hidden">
              <div class="h-full bg-white rounded-full" :style="{ width: currentHeroProjectLeft.progressPct + '%' }"></div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Slot 3: bottom-right live badge, ambient float only -->
      <div class="hidden md:flex absolute bottom-8 right-4 md:right-8 lg:right-20 xl:right-32 items-center gap-2 bg-white border border-[#E2E5EB] rounded-full px-3 py-1.5 lg:px-3.5 lg:py-2 shadow-lg rotate-[-4deg] land-card-float-alt z-0">
        <span class="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
        <span class="land-mono text-[9px] lg:text-[10px] font-bold text-[#6B7280]">Glisser-déposer actif</span>
      </div>

      <div class="max-w-6xl mx-auto px-6 relative">

        <!-- Centered copy -->
        <div class="relative z-10 text-center max-w-2xl mx-auto land-hero-enter">
          <p class="land-mono text-xs font-bold text-[#374151] dark:text-white/50 tracking-wider uppercase mb-6">Plateforme de gestion de projet</p>
          <h1 class="land-display text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-[#111318] dark:text-white leading-[1.05] tracking-tight mb-6">
            Organisez votre équipe.<br>
            Exécutez <span class="land-accent text-[#9CA3AF]">avec précision.</span>
          </h1>
          <p class="land-body text-base md:text-lg text-[#6B7280] dark:text-white/50 mb-9 leading-relaxed max-w-md mx-auto">
            La plateforme tout-en-un pour les équipes exigeantes. Workspaces, Kanban, analytique  synchronisés en temps réel.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <NuxtLink to="/auth/signup" class="land-body px-7 py-3.5 rounded-full btn-primary neo-emboss land-btn-black flex items-center gap-2">
              Démarrer gratuitement
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </NuxtLink>
            <a href="#features" @click.prevent="scrollToSection('features')" class="land-body px-7 py-3.5 bg-white dark:bg-white/5 text-[#111318] dark:text-white font-semibold rounded-full border border-[#E2E5EB] dark:border-white/10 hover:bg-[#F4F5F7] dark:hover:bg-white/10 hover:border-[#D1D5DB] dark:hover:border-white/20 transition-colors">
              Voir le produit
            </a>
          </div>

          <!-- Stats strip -->
          <div class="mt-12 pt-8 border-t border-[#E2E5EB] dark:border-white/10 flex items-center justify-center gap-8">
            <div>
              <div class="land-mono text-2xl font-bold text-[#111318] dark:text-white">184</div>
              <div class="land-body text-xs text-[#6B7280] dark:text-white/40 mt-0.5">tâches par mois</div>
            </div>
            <div class="w-px h-8 bg-[#E2E5EB] dark:bg-white/10"></div>
            <div>
              <div class="land-mono text-2xl font-bold text-[#10B981]">+48%</div>
              <div class="land-body text-xs text-[#6B7280] dark:text-white/40 mt-0.5">vélocité équipe</div>
            </div>
            <div class="w-px h-8 bg-[#E2E5EB] dark:bg-white/10"></div>
            <div>
              <div class="land-mono text-2xl font-bold text-[#111318] dark:text-white">∞</div>
              <div class="land-body text-xs text-[#6B7280] dark:text-white/40 mt-0.5">workspaces</div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Features Section -->
    <section id="features" class="py-24 bg-white dark:bg-[#0A0C10] reveal-on-scroll">
      <div class="max-w-6xl mx-auto px-6">
        <div class="mb-16">
          <p class="land-mono text-xs font-bold uppercase tracking-widest text-[#0B0E11] dark:text-white mb-3">Fonctionnalités</p>
          <h2 class="land-display text-3xl md:text-4xl font-extrabold text-[#111318] dark:text-white tracking-tight max-w-xl">Construit pour les équipes qui livrent</h2>
        </div>

        <div>

          <!-- Feature 01 -->
          <div class="py-20 grid md:grid-cols-2 gap-10 md:gap-16 items-center reveal-on-scroll">
            <div>
              <span class="land-mono text-[#EAECEF] dark:text-white/10 text-8xl font-bold leading-none select-none block">01.</span>
              <h3 class="land-display text-xl md:text-2xl font-extrabold text-[#111318] dark:text-white mt-2 mb-4">Multi-Workspaces & Organisations</h3>
              <p class="land-body text-[#6B7280] dark:text-white/50 leading-relaxed">Organisez vos activités avec une flexibilité totale. Basculez instantanément entre organisations et espaces de travail depuis une interface centralisée.</p>
            </div>
            <!-- Visual: org switcher mockup -->
            <div class="bg-[#F4F5F7] rounded-2xl p-6 rotate-[-2deg] hover:rotate-0 transition-transform duration-300 shadow-sm">
              <div class="space-y-2.5">
                <div class="p-3 bg-white rounded-xl border border-[#E2E5EB] flex items-center gap-3 shadow-sm">
                  <div class="w-8 h-8 rounded-lg bg-[#0B0E11] flex items-center justify-center text-white font-bold text-xs shrink-0">GP</div>
                  <div class="flex-1 min-w-0">
                    <div class="land-body text-sm font-semibold text-[#111318]">Gestion Pro</div>
                    <div class="land-mono text-[10px] text-[#6B7280]">Marketing · Dev · Design</div>
                  </div>
                  <Icon name="heroicons:check" class="w-4 h-4 text-[#0B0E11] shrink-0" />
                </div>
                <div class="p-3 bg-white/60 rounded-xl border border-[#E2E5EB]/50 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#F4F5F7] border border-[#E2E5EB] flex items-center justify-center text-[#6B7280] font-bold text-xs shrink-0">DS</div>
                  <div class="flex-1 min-w-0">
                    <div class="land-body text-sm font-semibold text-[#9CA3AF]">Design Studio</div>
                    <div class="land-mono text-[10px] text-[#9CA3AF]">3 workspaces</div>
                  </div>
                </div>
                <div class="p-3 bg-white/60 rounded-xl border border-[#E2E5EB]/50 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#F4F5F7] border border-[#E2E5EB] flex items-center justify-center text-[#6B7280] font-bold text-xs shrink-0">TL</div>
                  <div class="flex-1 min-w-0">
                    <div class="land-body text-sm font-semibold text-[#9CA3AF]">Tech Lab</div>
                    <div class="land-mono text-[10px] text-[#9CA3AF]">2 workspaces</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature 02 -->
          <div class="py-20 grid md:grid-cols-2 gap-10 md:gap-16 items-center reveal-on-scroll">
            <div class="md:order-last">
              <span class="land-mono text-[#EAECEF] dark:text-white/10 text-8xl font-bold leading-none select-none block">02.</span>
              <h3 class="land-display text-xl md:text-2xl font-extrabold text-[#111318] dark:text-white mt-2 mb-4">Tableaux Kanban Interactifs</h3>
              <p class="land-body text-[#6B7280] dark:text-white/50 leading-relaxed">Visualisez le flux de travail avec clarté et précision. Glissez-déposez les tâches, créez des colonnes personnalisées, suivez l'avancement en temps réel.</p>
            </div>
            <!-- Visual: dark kanban mini -->
            <div class="bg-[#111318] rounded-2xl p-5 md:order-first rotate-[2deg] hover:rotate-0 transition-transform duration-300 shadow-lg">
              <div class="flex items-center gap-2 mb-4">
                <span class="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <span class="land-mono text-[10px] text-white/40 uppercase tracking-wider font-bold">Kanban Board</span>
              </div>
              <div class="flex gap-3">
                <div class="flex-1 bg-white/5 rounded-xl p-3">
                  <div class="flex items-center gap-1.5 mb-3">
                    <span class="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span class="land-mono text-[9px] text-white/40 uppercase tracking-wider">À faire</span>
                  </div>
                  <div class="space-y-2">
                    <div class="p-2.5 bg-white/10 rounded-lg border border-white/10">
                      <p class="land-body text-xs text-white/70 font-medium">Optimiser la DB</p>
                    </div>
                    <div class="p-2.5 bg-white/10 rounded-lg border border-white/10">
                      <p class="land-body text-xs text-white/70 font-medium">Design mockups</p>
                    </div>
                  </div>
                </div>
                <div class="flex-1 bg-white/5 rounded-xl p-3">
                  <div class="flex items-center gap-1.5 mb-3">
                    <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span class="land-mono text-[9px] text-white/40 uppercase tracking-wider">En cours</span>
                  </div>
                  <div class="space-y-2">
                    <div class="p-2.5 bg-white/10 rounded-lg border border-white/20">
                      <p class="land-body text-xs text-white font-semibold">Refonte API</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature 03 -->
          <div class="py-20 grid md:grid-cols-2 gap-10 md:gap-16 items-center reveal-on-scroll">
            <div>
              <span class="land-mono text-[#EAECEF] dark:text-white/10 text-8xl font-bold leading-none select-none block">03.</span>
              <h3 class="land-display text-xl md:text-2xl font-extrabold text-[#111318] dark:text-white mt-2 mb-4">Synchronisation Temps Réel</h3>
              <p class="land-body text-[#6B7280] dark:text-white/50 leading-relaxed">Vos données sont mises à jour instantanément pour toute l'équipe. Commentaires, assignations, statuts — tout se synchronise sans rechargement.</p>
            </div>
            <!-- Visual: live team activity -->
            <div class="bg-[#F4F5F7] rounded-2xl p-6 rotate-[-2deg] hover:rotate-0 transition-transform duration-300 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <span class="land-mono text-xs font-bold text-[#6B7280]">Équipe en ligne</span>
                <span class="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              </div>
              <div class="space-y-2.5">
                <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E2E5EB]">
                  <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">AP</div>
                  <div class="flex-1 min-w-0">
                    <div class="land-body text-xs font-semibold text-[#111318] truncate">Refonte API</div>
                    <div class="land-mono text-[10px] text-[#10B981]">à l'instant</div>
                  </div>
                  <span class="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0"></span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E2E5EB]">
                  <div class="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">ML</div>
                  <div class="flex-1 min-w-0">
                    <div class="land-body text-xs font-semibold text-[#111318] truncate">Audit sécurité</div>
                    <div class="land-mono text-[10px] text-[#10B981]">il y a 2 min</div>
                  </div>
                  <span class="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0"></span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E2E5EB]">
                  <div class="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">SR</div>
                  <div class="flex-1 min-w-0">
                    <div class="land-body text-xs font-semibold text-[#111318] truncate">Design brief</div>
                    <div class="land-mono text-[10px] text-[#6B7280]">il y a 5 min</div>
                  </div>
                  <span class="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature 04 -->
          <div class="py-20 grid md:grid-cols-2 gap-10 md:gap-16 items-center reveal-on-scroll">
            <div class="md:order-last">
              <span class="land-mono text-[#EAECEF] dark:text-white/10 text-8xl font-bold leading-none select-none block">04.</span>
              <h3 class="land-display text-xl md:text-2xl font-extrabold text-[#111318] dark:text-white mt-2 mb-4">Analytique Intégrée</h3>
              <p class="land-body text-[#6B7280] dark:text-white/50 leading-relaxed">Vélocité, tâches terminées, progression par workspace. Les données qui vous aident à décider, pas seulement à compter.</p>
            </div>
            <div class="bg-white rounded-2xl p-5 border border-[#E2E5EB] md:order-first min-h-[200px] flex flex-col rotate-[2deg] hover:rotate-0 transition-transform duration-300 shadow-sm">
              <div class="flex items-center justify-between mb-3">
                <span class="land-mono text-xs font-bold text-[#6B7280]">Activité globale</span>
                <span class="land-mono text-xs font-bold text-[#10B981]">{{ currentVelocity }} ce mois</span>
              </div>
              <div class="flex-1">
                <ClientOnly>
                  <AreaChart
                    :data="chartData"
                    :categories="categories"
                    :xFormatter="xFormatter"
                    :height="160"
                    class="w-full"
                  />
                </ClientOnly>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-24 bg-[#111318] reveal-on-scroll">
      <div class="max-w-5xl mx-auto px-6">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p class="land-mono text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Tarification</p>
            <h2 class="land-display text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-5">Gratuit pour commencer.<br>Évolue avec vous.</h2>
            <p class="land-body text-white/40 leading-relaxed mb-8">Accès complet pendant la période d'essai. Pas de carte bleue. Pas de surprise.</p>
            <NuxtLink to="/auth/signup" class="land-body inline-flex items-center gap-2 px-7 py-3.5 rounded-full btn-primary neo-emboss land-btn-black">
              Commencer maintenant
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </NuxtLink>
          </div>

          <div class="bg-white rounded-2xl p-7 reveal-on-scroll reveal-delay-1">
            <div class="flex justify-between items-center mb-5">
              <span class="land-display text-xl font-extrabold text-[#111318]">Pro</span>
              <span class="land-mono text-xs font-bold bg-[#0B0E11] text-white px-3 py-1 rounded-full">Période d'essai</span>
            </div>
            <div class="land-mono text-4xl font-bold text-[#111318] mb-1">Gratuit</div>
            <p class="land-body text-[#6B7280] text-sm mb-7">Tout ce dont vous avez besoin pour démarrer.</p>
            <ul class="space-y-3 mb-8">
              <li v-for="feat in ['Projets et tâches illimités', 'Tableaux Kanban & suivi d\'équipe', 'Rapports analytiques en temps réel', 'Workspaces multiples', 'Membres illimités']" :key="feat"
                class="flex items-center gap-2.5 land-body text-sm text-[#6B7280]"
              >
                <div class="w-4 h-4 rounded-full bg-[#10B981]/15 flex items-center justify-center shrink-0">
                  <Icon name="heroicons:check" class="w-2.5 h-2.5 text-[#10B981]" />
                </div>
                {{ feat }}
              </li>
            </ul>
            <NuxtLink to="/auth/signup" class="land-body w-full py-3.5 rounded-full btn-primary neo-emboss land-btn-black-static text-center block">
              Créer mon espace
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#0A0C10] text-white/40 pt-14 pb-10 border-t border-white/5 reveal-on-scroll">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/5">

          <div class="lg:col-span-2 space-y-5">
            <div class="flex items-center gap-2.5 cursor-pointer" @click="scrollToSection('hero')">
              <img src="/assets/logo_app.svg" alt="Logo" class="w-7 h-7 object-contain">
              <span class="land-display text-lg font-extrabold text-white">Gestion Pro</span>
            </div>
            <p class="land-body text-sm leading-relaxed max-w-sm">Plateforme tout-en-un pour organiser vos équipes, planifier vos projets et suivre votre avancement en temps réel.</p>
            <form @submit.prevent class="flex gap-2 max-w-sm">
              <input type="email" placeholder="Votre adresse e-mail" class="land-body px-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#0B0E11]/60 flex-1" />
              <button type="submit" class="land-body px-4 py-2.5 bg-white text-[#111318] font-bold text-sm rounded-full hover:bg-white/90 transition-all flex-shrink-0">OK</button>
            </form>
          </div>

          <div>
            <h4 class="land-mono text-xs font-bold text-white uppercase tracking-widest mb-4">Produit</h4>
            <ul class="space-y-2.5 text-sm">
              <li><a href="#features" @click.prevent="scrollToSection('features')" class="land-body hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#pricing" @click.prevent="scrollToSection('pricing')" class="land-body hover:text-white transition-colors">Tarification</a></li>
              <li><NuxtLink to="/auth/signup" class="land-body hover:text-white transition-colors">Créer un compte</NuxtLink></li>
            </ul>
          </div>

          <div>
            <h4 class="land-mono text-xs font-bold text-white uppercase tracking-widest mb-4">Ressources</h4>
            <ul class="space-y-2.5 text-sm">
              <li><a href="#resources" @click.prevent="scrollToSection('resources')" class="land-body hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#resources" @click.prevent="scrollToSection('resources')" class="land-body hover:text-white transition-colors">Tutoriels</a></li>
              <li><a href="#resources" @click.prevent="scrollToSection('resources')" class="land-body hover:text-white transition-colors">Communauté</a></li>
              <li><a href="#" class="land-body hover:text-white transition-colors">Centre d'aide</a></li>
            </ul>
          </div>

          <div>
            <h4 class="land-mono text-xs font-bold text-white uppercase tracking-widest mb-4">Entreprise</h4>
            <ul class="space-y-2.5 text-sm">
              <li><a href="#" class="land-body hover:text-white transition-colors">À propos</a></li>
              <li><a href="#" class="land-body hover:text-white transition-colors">Politique de confidentialité</a></li>
              <li><a href="#" class="land-body hover:text-white transition-colors">Conditions d'utilisation</a></li>
              <li><a href="#" class="land-body hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

        </div>

        <div class="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div class="land-mono">&copy; {{ new Date().getFullYear() }} Gestion Pro. Tous droits réservés.</div>
          <div class="flex items-center gap-5">
            <a href="#" class="land-mono hover:text-white transition-colors">Confidentialité</a>
            <a href="#" class="land-mono hover:text-white transition-colors">Conditions</a>
            <a href="#" class="land-mono hover:text-white transition-colors">Cookies</a>
            <a href="#" class="land-mono hover:text-white transition-colors">Mentions légales</a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Back to Top -->
    <Transition name="fade-top">
      <button
        v-if="showBackToTop"
        @click="scrollToTop"
        class="fixed bottom-8 right-8 z-50 p-3 bg-[#111318] text-white rounded-xl border border-white/10 hover:bg-[#0B0E11] hover:border-[#0B0E11] transition-all duration-300 flex items-center justify-center shadow-lg group"
        aria-label="Retour en haut"
      >
        <Icon name="ph:arrow-up-bold" class="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-300" />
      </button>
    </Transition>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Fraunces:ital,opsz,wght@1,9..144,700;1,9..144,800&family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');

.landing {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  color-scheme: light;
}

.dark .landing {
  color-scheme: dark;
}

/* Pin to pure black in light mode, regardless of browser auto-dark repaint */
.land-btn-black,
.land-btn-black-static {
  background-color: #0B0E11;
  background-image: linear-gradient(to bottom, #1f2937, #0B0E11);
  transition: filter 0.25s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;
}

.land-btn-black:hover,
.land-btn-black-static:hover {
  filter: brightness(1.2);
  transform: translateY(-1px) scale(1.015);
  box-shadow: 0 6px 18px rgba(11, 14, 17, 0.25);
}

.land-btn-black:active,
.land-btn-black-static:active {
  transform: translateY(0) scale(0.98);
  filter: brightness(1.05);
}

/* Invert to white-on-black-text in dark mode, keeping a visible border.
   -static variant is excluded: it lives on a permanently-white card, so it
   must stay black regardless of page-level dark mode. */
.dark .land-btn-black {
  background-color: #ffffff;
  background-image: linear-gradient(to bottom, #ffffff, #f1f1f1);
  color: #0B0E11;
  border-color: rgba(11, 14, 17, 0.15);
}

.dark .land-btn-black:hover {
  filter: brightness(0.97);
  box-shadow: 0 6px 18px rgba(255, 255, 255, 0.15);
}

.land-display {
  font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.03em;
}

.land-accent {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  letter-spacing: -0.01em;
  font-optical-sizing: auto;
}

.land-body {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

.land-mono {
  font-family: 'DM Mono', 'Fira Code', ui-monospace, monospace;
}

.land-grid-bg {
  background-image:
    linear-gradient(to right, #E2E5EB 1px, transparent 1px),
    linear-gradient(to bottom, #E2E5EB 1px, transparent 1px);
  background-size: 48px 48px;
  opacity: 0.22;
  -webkit-mask-image: radial-gradient(ellipse 42% 55% at 50% 46%, black 0%, black 35%, transparent 75%);
  mask-image: radial-gradient(ellipse 42% 55% at 50% 46%, black 0%, black 35%, transparent 75%);
}

.dark .land-grid-bg {
  background-image:
    linear-gradient(to right, #ffffff 1px, transparent 1px),
    linear-gradient(to bottom, #ffffff 1px, transparent 1px);
  opacity: 0.06;
}

/* Hero entrance animations */
.land-hero-enter {
  animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.land-hero-enter-delayed {
  animation: heroFadeUp 0.7s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes heroFadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Ambient float — layered onto the entrance animation via a second animation name */
.land-card-float {
  animation:
    heroFadeUp 0.7s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both,
    cardFloat 9s 0.9s ease-in-out infinite;
}

.land-card-float-alt {
  animation:
    heroFadeUp 0.7s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both,
    cardFloatAlt 10.5s 0.9s ease-in-out infinite;
}

@keyframes cardFloat {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-14px) translateX(4px); }
}

@keyframes cardFloatAlt {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(12px) translateX(-5px); }
}

@media (prefers-reduced-motion: reduce) {
  .land-card-float,
  .land-card-float-alt {
    animation: heroFadeUp 0.7s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
}

/* Hero card content swap — fade + subtle scale on cycle */
.hero-card-swap-enter-active,
.hero-card-swap-leave-active {
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-card-swap-enter-from {
  opacity: 0;
  transform: scale(0.94) translateY(6px);
}

.hero-card-swap-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-6px);
}

/* Scroll Reveal */
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.reveal-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.reveal-delay-1 { transition-delay: 0.1s; }
.reveal-delay-2 { transition-delay: 0.2s; }
.reveal-delay-3 { transition-delay: 0.3s; }
.reveal-delay-4 { transition-delay: 0.4s; }

html, body {
  scroll-behavior: smooth;
  overflow-x: hidden;
  max-width: 100vw;
}

.fade-top-enter-active,
.fade-top-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-top-enter-from,
.fade-top-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
