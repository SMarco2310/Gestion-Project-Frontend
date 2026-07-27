<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { AreaChart } from 'vue-chrts'
import draggable from 'vuedraggable'

// Landing page does not need auth middleware
definePageMeta({
  layout: false // explicitly disable any layout just in case
})

// --- App-identical Demo Kanban Board State ---
interface DemoTaskTag {
  label: string
  colorHex: string
}

interface DemoTaskAssignee {
  initials: string
  colorClass: string
}

interface DemoTask {
  id: string
  title: string
  reference: string
  status: 'done' | 'not done'
  projetName: string
  tags: DemoTaskTag[]
  commentairesCount?: number
  attachmentsCount?: number
  checklistsTotal?: number
  checklistsCompleted?: number
  assignee: DemoTaskAssignee
}

interface DemoColumn {
  id: string
  name: string
  color: string
  isDone: boolean
  items: DemoTask[]
}

const activeOrg = ref('Gestion Pro')
const orgList = ref([
  { id: 'gp', name: 'Gestion Pro', plan: 'Enterprise', active: true },
  { id: 'ds', name: 'Design Studio', plan: 'Pro', active: false },
  { id: 'tl', name: 'Tech Lab', plan: 'Starter', active: false }
])

interface OrgPreset {
  slug: string
  columns: DemoColumn[]
  analytics: {
    '7j': { chart: any[]; velocity: string; completed: number }
    '30j': { chart: any[]; velocity: string; completed: number }
    '1an': { chart: any[]; velocity: string; completed: number }
  }
}

const orgPresets: Record<string, OrgPreset> = {
  'Gestion Pro': {
    slug: 'gestion-pro',
    columns: [
      {
        id: 'col-todo',
        name: 'À faire',
        color: '#0055cc',
        isDone: false,
        items: [
          {
            id: 'task-1',
            title: 'Optimisation de la vitesse de chargement',
            reference: 'GP-101',
            status: 'not done',
            projetName: 'Projet Stage',
            tags: [{ label: 'PERFORMANCE', colorHex: '#0055cc' }, { label: 'BACKEND', colorHex: '#7f5f01' }],
            commentairesCount: 3,
            attachmentsCount: 1,
            assignee: { initials: 'AP', colorClass: 'bg-slate-800' }
          },
          {
            id: 'task-2',
            title: 'Configuration des webhooks Slack',
            reference: 'GP-102',
            status: 'not done',
            projetName: 'API Integration',
            tags: [{ label: 'INTEGRATION', colorHex: '#5e4db2' }],
            commentairesCount: 1,
            checklistsTotal: 4,
            checklistsCompleted: 2,
            assignee: { initials: 'MS', colorClass: 'bg-emerald-600' }
          }
        ]
      },
      {
        id: 'col-progress',
        name: 'En cours',
        color: '#7f5f01',
        isDone: false,
        items: [
          {
            id: 'task-3',
            title: 'Intégration du Kanban interactif',
            reference: 'GP-103',
            status: 'not done',
            projetName: 'Refonte UI',
            tags: [{ label: 'FRONTEND', colorHex: '#ae2e24' }],
            commentairesCount: 5,
            attachmentsCount: 2,
            assignee: { initials: 'AP', colorClass: 'bg-slate-800' }
          }
        ]
      },
      {
        id: 'col-done',
        name: 'Terminé',
        color: '#216e4e',
        isDone: true,
        items: [
          {
            id: 'task-4',
            title: 'Alignement des couleurs & typographie',
            reference: 'GP-100',
            status: 'done',
            projetName: 'Design System',
            tags: [{ label: 'UI/UX', colorHex: '#216e4e' }],
            commentairesCount: 2,
            assignee: { initials: 'MS', colorClass: 'bg-emerald-600' }
          }
        ]
      }
    ],
    analytics: {
      '7j': {
        chart: [
          { month: 'Lun', Activity: 140 }, { month: 'Mar', Activity: 280 }, { month: 'Mer', Activity: 210 },
          { month: 'Jeu', Activity: 430 }, { month: 'Ven', Activity: 510 }, { month: 'Sam', Activity: 260 }, { month: 'Dim', Activity: 390 }
        ],
        velocity: '+18%', completed: 42
      },
      '30j': {
        chart: [
          { month: 'Sem 1', Activity: 400 }, { month: 'Sem 2', Activity: 650 }, { month: 'Sem 3', Activity: 920 }, { month: 'Sem 4', Activity: 1350 }
        ],
        velocity: '+48%', completed: 184
      },
      '1an': {
        chart: [
          { month: 'Jan', Activity: 400 }, { month: 'Avr', Activity: 950 }, { month: 'Juil', Activity: 1600 }, { month: 'Oct', Activity: 2300 }, { month: 'Déc', Activity: 3100 }
        ],
        velocity: '+120%', completed: 1450
      }
    }
  },
  'Design Studio': {
    slug: 'design-studio',
    columns: [
      {
        id: 'col-ds-todo',
        name: 'À faire',
        color: '#0055cc',
        isDone: false,
        items: [
          {
            id: 'ds-task-1',
            title: 'Création des illustrations landing page',
            reference: 'DS-201',
            status: 'not done',
            projetName: 'Branding V2',
            tags: [{ label: 'ILLUSTRATION', colorHex: '#d97706' }, { label: 'VECTOR', colorHex: '#2563eb' }],
            commentairesCount: 4,
            attachmentsCount: 3,
            assignee: { initials: 'CL', colorClass: 'bg-amber-600' }
          },
          {
            id: 'ds-task-2',
            title: 'Prototypes 3D des badges interactifs',
            reference: 'DS-202',
            status: 'not done',
            projetName: 'UI Lab',
            tags: [{ label: '3D MOTION', colorHex: '#9333ea' }],
            commentairesCount: 2,
            assignee: { initials: 'MS', colorClass: 'bg-emerald-600' }
          }
        ]
      },
      {
        id: 'col-ds-progress',
        name: 'En cours',
        color: '#7f5f01',
        isDone: false,
        items: [
          {
            id: 'ds-task-3',
            title: 'Refonte de la charte graphique & Tokens',
            reference: 'DS-203',
            status: 'not done',
            projetName: 'Design System',
            tags: [{ label: 'TOKENS', colorHex: '#059669' }],
            commentairesCount: 8,
            attachmentsCount: 4,
            assignee: { initials: 'CL', colorClass: 'bg-amber-600' }
          }
        ]
      },
      {
        id: 'col-ds-done',
        name: 'Terminé',
        color: '#216e4e',
        isDone: true,
        items: [
          {
            id: 'ds-task-4',
            title: 'Audit UX du funnel de conversion',
            reference: 'DS-200',
            status: 'done',
            projetName: 'UX Research',
            tags: [{ label: 'AUDIT', colorHex: '#dc2626' }],
            commentairesCount: 6,
            assignee: { initials: 'AP', colorClass: 'bg-slate-800' }
          }
        ]
      }
    ],
    analytics: {
      '7j': {
        chart: [
          { month: 'Lun', Activity: 90 }, { month: 'Mar', Activity: 180 }, { month: 'Mer', Activity: 340 },
          { month: 'Jeu', Activity: 290 }, { month: 'Ven', Activity: 440 }, { month: 'Sam', Activity: 190 }, { month: 'Dim', Activity: 310 }
        ],
        velocity: '+14%', completed: 28
      },
      '30j': {
        chart: [
          { month: 'Sem 1', Activity: 280 }, { month: 'Sem 2', Activity: 490 }, { month: 'Sem 3', Activity: 710 }, { month: 'Sem 4', Activity: 1050 }
        ],
        velocity: '+32%', completed: 142
      },
      '1an': {
        chart: [
          { month: 'Jan', Activity: 250 }, { month: 'Avr', Activity: 680 }, { month: 'Juil', Activity: 1150 }, { month: 'Oct', Activity: 1720 }, { month: 'Déc', Activity: 2400 }
        ],
        velocity: '+95%', completed: 980
      }
    }
  },
  'Tech Lab': {
    slug: 'tech-lab',
    columns: [
      {
        id: 'col-tl-todo',
        name: 'À faire',
        color: '#0055cc',
        isDone: false,
        items: [
          {
            id: 'tl-task-1',
            title: 'Migration vers Vue 3.5 & Nuxt 3.12',
            reference: 'TL-301',
            status: 'not done',
            projetName: 'Core Framework',
            tags: [{ label: 'NUXT3', colorHex: '#10b981' }, { label: 'VUE3', colorHex: '#059669' }],
            commentairesCount: 7,
            assignee: { initials: 'AP', colorClass: 'bg-slate-800' }
          },
          {
            id: 'tl-task-2',
            title: 'Suite de tests E2E Playwright',
            reference: 'TL-302',
            status: 'not done',
            projetName: 'Quality Assurance',
            tags: [{ label: 'TESTING', colorHex: '#6366f1' }],
            commentairesCount: 3,
            checklistsTotal: 6,
            checklistsCompleted: 4,
            assignee: { initials: 'MS', colorClass: 'bg-emerald-600' }
          }
        ]
      },
      {
        id: 'col-tl-progress',
        name: 'En cours',
        color: '#7f5f01',
        isDone: false,
        items: [
          {
            id: 'tl-task-3',
            title: 'Microservice d\'analyse de données',
            reference: 'TL-303',
            status: 'not done',
            projetName: 'Analytics Engine',
            tags: [{ label: 'PYTHON', colorHex: '#3b82f6' }, { label: 'FASTAPI', colorHex: '#06b6d4' }],
            commentairesCount: 12,
            attachmentsCount: 5,
            assignee: { initials: 'AP', colorClass: 'bg-slate-800' }
          }
        ]
      },
      {
        id: 'col-tl-done',
        name: 'Terminé',
        color: '#216e4e',
        isDone: true,
        items: [
          {
            id: 'tl-task-4',
            title: 'Optimisation des requêtes GraphQL',
            reference: 'TL-300',
            status: 'done',
            projetName: 'Backend Core',
            tags: [{ label: 'GRAPHQL', colorHex: '#e11d48' }],
            commentairesCount: 4,
            assignee: { initials: 'MS', colorClass: 'bg-emerald-600' }
          },
          {
            id: 'tl-task-5',
            title: 'Pipelines CI/CD GitHub Actions',
            reference: 'TL-299',
            status: 'done',
            projetName: 'DevOps Engine',
            tags: [{ label: 'DEVOPS', colorHex: '#475569' }],
            commentairesCount: 9,
            assignee: { initials: 'AP', colorClass: 'bg-slate-800' }
          }
        ]
      }
    ],
    analytics: {
      '7j': {
        chart: [
          { month: 'Lun', Activity: 210 }, { month: 'Mar', Activity: 420 }, { month: 'Mer', Activity: 380 },
          { month: 'Jeu', Activity: 620 }, { month: 'Ven', Activity: 740 }, { month: 'Sam', Activity: 380 }, { month: 'Dim', Activity: 560 }
        ],
        velocity: '+26%', completed: 68
      },
      '30j': {
        chart: [
          { month: 'Sem 1', Activity: 520 }, { month: 'Sem 2', Activity: 890 }, { month: 'Sem 3', Activity: 1240 }, { month: 'Sem 4', Activity: 1820 }
        ],
        velocity: '+64%', completed: 256
      },
      '1an': {
        chart: [
          { month: 'Jan', Activity: 580 }, { month: 'Avr', Activity: 1250 }, { month: 'Juil', Activity: 2100 }, { month: 'Oct', Activity: 3200 }, { month: 'Déc', Activity: 4500 }
        ],
        velocity: '+150%', completed: 2180
      }
    }
  }
}

const demoBoardColumns = ref<DemoColumn[]>(JSON.parse(JSON.stringify(orgPresets['Gestion Pro']?.columns || [])))

const isCreatingTaskInCol = ref<string | null>(null)
const newInlineTaskTitle = ref('')

const handleAddInlineTask = (colId: string) => {
  if (!newInlineTaskTitle.value.trim()) return
  const col = demoBoardColumns.value.find(c => c.id === colId)
  if (col) {
    const nextNum = Math.floor(Math.random() * 899 + 105)
    col.items.push({
      id: `task-${Date.now()}`,
      title: newInlineTaskTitle.value.trim(),
      reference: `GP-${nextNum}`,
      status: col.isDone ? 'done' : 'not done',
      projetName: 'Démo Sprint',
      tags: [{ label: 'TÂCHE', colorHex: '#0055cc' }],
      commentairesCount: 0,
      assignee: { initials: 'AP', colorClass: 'bg-slate-800' }
    })
  }
  newInlineTaskTitle.value = ''
  isCreatingTaskInCol.value = null
}

const toggleTaskStatus = (task: DemoTask) => {
  task.status = task.status === 'done' ? 'not done' : 'done'
}

const onDragChange = (evt: any, col: DemoColumn) => {
  if (evt.added && evt.added.element) {
    evt.added.element.status = col.isDone ? 'done' : 'not done'
  }
}

const addColumnToDemo = () => {
  const count = demoBoardColumns.value.length + 1
  demoBoardColumns.value.push({
    id: `col-${Date.now()}`,
    name: `Colonne ${count}`,
    color: '#5e4db2',
    isDone: false,
    items: []
  })
}

const deleteColumnFromDemo = (colId: string) => {
  demoBoardColumns.value = demoBoardColumns.value.filter(col => col.id !== colId)
}

// --- Interactive Analytics Preview State ---
const selectedTimeframe = ref<'7j' | '30j' | '1an'>('30j')

const currentAnalytics = computed(() => {
  const defaultAnalytics = {
    chart: [
      { month: 'Sem 1', Activity: 400 },
      { month: 'Sem 2', Activity: 650 },
      { month: 'Sem 3', Activity: 920 },
      { month: 'Sem 4', Activity: 1350 }
    ],
    velocity: '+48%',
    completed: 184
  }
  return orgPresets[activeOrg.value]?.analytics[selectedTimeframe.value] || orgPresets['Gestion Pro']?.analytics[selectedTimeframe.value] || defaultAnalytics
})

const currentChartData = computed(() => currentAnalytics.value.chart)
const currentVelocity = computed(() => currentAnalytics.value.velocity)
const currentCompleted = computed(() => currentAnalytics.value.completed)

const currentOrgSlug = computed(() => orgPresets[activeOrg.value]?.slug || 'gestion-pro')

const categories = {
  Activity: {
    name: 'Activité Globale',
    color: '#0f172a'
  }
}

const xFormatter = (i: number) => currentChartData.value[i]?.month || ''

const selectOrg = (name: string) => {
  activeOrg.value = name
  orgList.value.forEach(o => o.active = o.name === name)
  
  const preset = orgPresets[name]
  if (preset) {
    demoBoardColumns.value = JSON.parse(JSON.stringify(preset.columns))
  }
}

const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    const navOffset = 80
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

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()

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
})
</script>

<template>
  <div class="landing min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-black selection:text-white">

    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-[#F8FAFC]/80 backdrop-blur-md border-b border-slate-200/50">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-3 cursor-pointer" @click="scrollToSection('hero')">
          <img src="/assets/logo_app.svg" alt="Logo" class="w-8 h-8 object-contain">
          <span class="landing-display text-xl font-bold tracking-tight text-slate-900">Gestion Pro</span>
        </div>
        
        <div class="hidden md:flex items-center gap-8">
          <a href="#product" @click.prevent="scrollToSection('product')" class="text-sm font-medium text-slate-600 hover:text-black transition-colors">Produit</a>
          <a href="#features" @click.prevent="scrollToSection('features')" class="text-sm font-medium text-slate-600 hover:text-black transition-colors">Fonctionnalités</a>
          <a href="#resources" @click.prevent="scrollToSection('resources')" class="text-sm font-medium text-slate-600 hover:text-black transition-colors">Ressources</a>
          <a href="#pricing" @click.prevent="scrollToSection('pricing')" class="text-sm font-medium text-slate-600 hover:text-black transition-colors">Tarifs</a>
        </div>

        <div class="flex items-center gap-4">
          <NuxtLink to="/auth/login" class="text-sm font-semibold text-slate-700 hover:text-black transition-colors">Se connecter</NuxtLink>
          <NuxtLink to="/auth/signup" class="text-sm font-bold bg-gradient-to-b from-gray-800 to-black text-white px-6 py-2.5 rounded-full transition-all border border-gray-700/50 neo-emboss hover:brightness-110 active:neo-inset active:scale-[0.98]">Commencer</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <main id="hero" class="relative pt-32 lg:pt-44 pb-20 reveal-on-scroll">
      <div class="max-w-5xl mx-auto px-6 text-center">
        <h1 class="landing-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
          Gérez vos projets avec <span class="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500">précision</span>
        </h1>

        <p class="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          La plateforme tout-en-un pour les équipes exigeantes. Synchronisez, planifiez et exécutez sans friction.
        </p>

        <div class="flex items-center justify-center">
          <NuxtLink to="/auth/signup" class="w-full sm:w-auto px-8 py-4 bg-gradient-to-b from-gray-800 to-black text-white rounded-full font-bold text-lg transition-all border border-gray-700/50 neo-emboss hover:brightness-110 active:neo-inset active:scale-[0.98] flex items-center justify-center gap-2">
            Démarrer gratuitement
            <Icon name="heroicons:arrow-right" class="w-5 h-5" />
          </NuxtLink>
        </div>
      </div>
    </main>

    <!-- Interactive Product Section (macOS Window Mockup Showcase) -->
    <section id="product" class="relative max-w-[1400px] mx-auto px-4 sm:px-6 pb-32 pt-4 reveal-on-scroll">
      <!-- Section Subtitle -->
      <div class="text-center max-w-3xl mx-auto mb-10">
        <p class="text-slate-500 text-base md:text-lg font-medium">Un aperçu direct et fonctionnel de votre futur espace de travail collaboratif.</p>
      </div>
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div class="w-[900px] h-[500px] bg-gradient-to-tr from-slate-200 via-gray-200 to-slate-100 rounded-full blur-3xl opacity-60"></div>
      </div>

      <!-- macOS Browser / App Window Frame -->
      <div class="rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-400/30 overflow-hidden ring-1 ring-slate-900/5 transition-all">
        
        <!-- macOS Window Titlebar -->
        <div class="px-6 py-4 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between backdrop-blur-md">
          <!-- Window Controls (Red, Yellow, Green Traffic Lights) -->
          <div class="flex items-center gap-2.5">
            <span class="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 inline-block shadow-sm"></span>
            <span class="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 inline-block shadow-sm"></span>
            <span class="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 inline-block shadow-sm"></span>
          </div>

          <!-- Browser Address Bar -->
          <div class="flex-1 max-w-lg mx-auto bg-white/90 border border-slate-200/80 rounded-xl px-5 py-1.5 flex items-center justify-between text-xs text-slate-500 shadow-inner">
            <div class="flex items-center gap-2.5 overflow-hidden">
              <Icon name="heroicons:lock-closed" class="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span class="truncate font-medium text-slate-700">app.gestionpro.fr/{{ currentOrgSlug }}/kanban</span>
            </div>
            <Icon name="heroicons:arrow-path" class="w-3.5 h-3.5 text-slate-400 flex-shrink-0 cursor-pointer hover:text-slate-700 transition-colors" />
          </div>

          <!-- App Status Badge -->
          <div class="hidden sm:flex items-center gap-2 bg-white/80 border border-slate-200/60 px-3 py-1 rounded-lg">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-xs font-bold text-slate-600">Application en direct</span>
          </div>
        </div>

        <!-- Window Inner Workspace Grid -->
        <div class="p-6 md:p-10 lg:p-12 bg-[#F8FAFC]">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 relative">
            
            <!-- App-Identical Kanban Board Interactive Showcase (8 Cols) -->
            <div class="lg:col-span-8 p-6 md:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-lg flex flex-col justify-between overflow-hidden">
              <div>
                <!-- Header & Action Bar -->
                <div class="flex flex-wrap items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-200/60">
                  <div class="flex items-center gap-3">
                    <span class="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <div>
                      <h3 class="text-xl font-bold text-slate-900 leading-tight">Tableau Kanban</h3>
                      <span class="text-xs text-slate-500 font-medium">Glissez-déposez les cartes d'une colonne à l'autre</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button 
                      @click="addColumnToDemo"
                      class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 border border-slate-200/60 shadow-sm"
                    >
                      <Icon name="ph:plus" class="w-4 h-4" />
                      Ajouter une colonne
                    </button>
                  </div>
                </div>

                <!-- Kanban Columns Container (Horizontal Scrollable Flex Row) -->
                <div class="flex items-start gap-5 overflow-x-auto pb-4 pt-1 max-w-full scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  
                  <div 
                    v-for="(col, colIndex) in demoBoardColumns" 
                    :key="col.id"
                    class="flex flex-col bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 shadow-sm min-h-[440px] w-[320px] sm:w-[340px] shrink-0"
                  >
                    <!-- Column Header -->
                    <div class="flex items-center justify-between px-2 py-2.5 mb-3 border-b border-slate-200/60">
                      <div class="flex items-center gap-2.5 truncate">
                        <span class="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: col.color }"></span>
                        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 truncate">{{ col.name }}</h4>
                      </div>

                      <div class="flex items-center gap-2 shrink-0">
                        <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-sm">
                          {{ col.items.length }}
                        </span>
                        <Icon v-if="col.isDone" name="ph:check" class="text-emerald-500 text-lg font-bold" />
                        <button 
                          @click="deleteColumnFromDemo(col.id)" 
                          class="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer la colonne"
                          aria-label="Supprimer la colonne"
                        >
                          <Icon name="ph:trash" class="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <!-- Inline Task Creator Trigger / Form -->
                    <div class="mb-4 px-1">
                      <button 
                        v-if="isCreatingTaskInCol !== col.id"
                        @click="isCreatingTaskInCol = col.id"
                        class="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-900 text-xs font-medium flex items-center justify-center gap-2 transition-all bg-white/60 hover:bg-white shadow-sm"
                      >
                        <Icon name="ph:plus" class="w-4 h-4" />
                        Créer une tâche
                      </button>

                      <div v-else class="p-3 bg-white rounded-xl border border-slate-200 flex flex-col gap-2.5 shadow-md">
                        <input 
                          v-model="newInlineTaskTitle"
                          @keyup.enter="handleAddInlineTask(col.id)"
                          placeholder="Intitulé de la tâche..."
                          class="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          autoFocus
                        />
                        <div class="flex items-center justify-end gap-2">
                          <button @click="isCreatingTaskInCol = null" class="text-xs text-slate-500 hover:text-slate-800">Annuler</button>
                          <button @click="handleAddInlineTask(col.id)" class="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm">Ajouter</button>
                        </div>
                      </div>
                    </div>

                    <!-- Draggable Task Cards Area -->
                    <draggable 
                      v-model="col.items" 
                      group="demo-tasks" 
                      item-key="id"
                      class="flex-1 space-y-3 min-h-[220px] pb-4"
                      ghost-class="opacity-30"
                      drag-class="cursor-grabbing"
                      :animation="200"
                      @change="onDragChange($event, col)"
                    >
                      <template #item="{ element: item }">
                        <div 
                          :key="item.id"
                          class="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing group flex flex-col gap-2.5 select-none"
                        >
                            <!-- Header: Title -->
                            <div class="flex justify-between items-start gap-2">
                              <h5 
                                @click="toggleTaskStatus(item)"
                                :class="['text-xs font-bold leading-snug flex-1 cursor-pointer select-none', item.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800']"
                              >
                                {{ item.title }}
                              </h5>
                            </div>

                            <!-- Tags -->
                            <div v-if="item.tags && item.tags.length > 0" class="flex flex-wrap items-center gap-1.5">
                              <span 
                                v-for="tag in item.tags" 
                                :key="tag.label"
                                :style="{ backgroundColor: tag.colorHex + '1A', color: tag.colorHex }"
                                class="px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border border-current/20"
                              >
                                {{ tag.label }}
                              </span>
                            </div>

                            <!-- Project Name (under tags) -->
                            <div class="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider min-w-0">
                              <Icon name="heroicons:folder" class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span class="truncate">{{ item.projetName }}</span>
                            </div>

                            <!-- Footer Metrics & Assignee (Spacious single-line layout) -->
                            <div class="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-0.5 text-[11px]">
                              <!-- Reference & Status -->
                              <div class="flex items-center gap-1.5 shrink-0">
                                <div 
                                  @click.stop="toggleTaskStatus(item)"
                                  class="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-800 transition-colors bg-white shadow-2xs"
                                >
                                  <div v-if="item.status === 'done'" class="w-2 h-2 rounded-full bg-emerald-500"></div>
                                </div>
                                <Icon name="ph:bookmark-simple-fill" class="w-3.5 h-3.5 text-emerald-600" />
                                <span :class="['font-semibold text-[11px]', item.status === 'done' ? 'line-through text-slate-400' : 'text-slate-600']">{{ item.reference }}</span>
                              </div>

                              <!-- Counters & Assignee Avatar -->
                              <div class="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
                                <span v-if="item.commentairesCount" class="flex items-center gap-1 font-medium text-slate-500">
                                  <Icon name="ph:chat-teardrop-text" class="w-3.5 h-3.5 text-slate-400" />
                                  {{ item.commentairesCount }}
                                </span>
                                <span v-if="item.attachmentsCount" class="flex items-center gap-1 font-medium text-slate-500">
                                  <Icon name="ph:paperclip" class="w-3.5 h-3.5 text-slate-400" />
                                  {{ item.attachmentsCount }}
                                </span>
                                <span v-if="item.checklistsTotal" class="flex items-center gap-1 font-medium text-slate-500">
                                  <Icon name="ph:list-checks" class="w-3.5 h-3.5 text-slate-400" />
                                  {{ item.checklistsCompleted }}/{{ item.checklistsTotal }}
                                </span>

                                <div 
                                  :class="['w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs border border-white shrink-0', item.assignee.colorClass]"
                                >
                                  {{ item.assignee.initials }}
                                </div>
                              </div>
                            </div>

                          </div>
                        </template>
                      </draggable>
                  </div>

                  <!-- Add Column Card -->
                  <div 
                    @click="addColumnToDemo"
                    class="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-6 min-h-[440px] w-[260px] shrink-0 cursor-pointer text-slate-400 hover:text-slate-700 hover:bg-slate-50/50 transition-all gap-2 group"
                  >
                    <Icon name="ph:plus-circle" class="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
                    <span class="text-xs font-bold uppercase tracking-wider">Ajouter une colonne</span>
                  </div>

                </div>
              </div>

              <div class="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span class="font-medium flex items-center gap-2">
                  <Icon name="heroicons:sparkles" class="w-4 h-4 text-slate-900" />
                  Structure et logique exactes de l'application
                </span>
                <span class="font-semibold text-emerald-600 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Glisser-déposer actif
                </span>
              </div>
            </div>

            <!-- Interactive Analytics & Org Widget Column (4 Cols) -->
            <div class="lg:col-span-4 space-y-8 flex flex-col justify-between">
              
              <!-- Interactive Analytics Card -->
              <div class="p-7 md:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-lg flex-1 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-6">
                    <div>
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Analytique Réactive</span>
                      <h4 class="text-base font-bold text-slate-900">Performance Équipe</h4>
                    </div>
                    <span class="p-2 rounded-xl bg-slate-900 text-white shadow-md">
                      <Icon name="heroicons:chart-bar" class="w-5 h-5" />
                    </span>
                  </div>

                  <!-- Timeframe Selector Tabs -->
                  <div class="flex bg-slate-100 p-1.5 rounded-2xl mb-6 text-xs font-bold">
                    <button 
                      @click="selectedTimeframe = '7j'"
                      :class="['flex-1 py-2 rounded-xl transition-all', selectedTimeframe === '7j' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']"
                    >
                      7 Jours
                    </button>
                    <button 
                      @click="selectedTimeframe = '30j'"
                      :class="['flex-1 py-2 rounded-xl transition-all', selectedTimeframe === '30j' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']"
                    >
                      30 Jours
                    </button>
                    <button 
                      @click="selectedTimeframe = '1an'"
                      :class="['flex-1 py-2 rounded-xl transition-all', selectedTimeframe === '1an' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']"
                    >
                      1 An
                    </button>
                  </div>

                  <!-- Metrics Counters -->
                  <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vélocité</span>
                      <div class="text-xl md:text-2xl font-extrabold text-emerald-600 mt-1">{{ currentVelocity }}</div>
                    </div>
                    <div class="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tâches Finies</span>
                      <div class="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">{{ currentCompleted }}</div>
                    </div>
                  </div>

                  <!-- Interactive Chart View -->
                  <div class="h-44 w-full relative pt-2">
                    <ClientOnly>
                      <AreaChart
                        :data="currentChartData"
                        :categories="categories"
                        :xFormatter="xFormatter"
                        :height="170"
                        class="w-full h-full"
                      />
                    </ClientOnly>
                  </div>
                </div>
              </div>

              <!-- Interactive Workspace Switcher Sticker -->
              <div class="p-7 md:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Context Switching</span>
                      <h4 class="text-base font-bold text-white">Changer de workspace</h4>
                    </div>
                    <span class="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">Actif: {{ activeOrg }}</span>
                  </div>

                  <div class="space-y-2.5">
                    <div 
                      v-for="org in orgList" 
                      :key="org.id"
                      @click="selectOrg(org.name)"
                      :class="['p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs', org.active ? 'bg-white/20 border-emerald-400/50 text-white font-bold shadow-lg ring-1 ring-emerald-400/40' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white']"
                    >
                      <div class="flex items-center gap-3">
                        <div class="w-7 h-7 rounded-lg bg-white text-slate-900 font-extrabold text-xs flex items-center justify-center shadow-sm">
                          {{ org.name.substring(0,2).toUpperCase() }}
                        </div>
                        <span class="text-sm font-semibold">{{ org.name }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Icon v-if="org.active" name="ph:check-circle-fill" class="w-4 h-4 text-emerald-400" />
                        <span class="text-[11px] opacity-70 bg-white/10 px-2 py-0.5 rounded-md">{{ org.plan }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 bg-white border-t border-slate-100 reveal-on-scroll">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <h2 class="landing-display text-3xl md:text-4xl font-bold mb-4 text-slate-900 tracking-tight">Construit pour l'efficacité</h2>
          <p class="text-slate-500 text-lg">Outils professionnels conçus pour réduire le bruit et augmenter la concentration.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <!-- Feature 1 -->
          <div class="reveal-on-scroll reveal-delay-1 p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div class="w-10 h-10 rounded-lg bg-gray-100 text-gray-900 flex items-center justify-center mb-6">
              <Icon name="heroicons:building-office-2" class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-3">Multi-Workspaces & Équipes</h3>
            <p class="text-slate-500 leading-relaxed text-sm">
              Organisez vos activités avec une flexibilité totale. Basculez instantanément entre plusieurs organisations, espaces de travail (workspaces) et équipes dédiées depuis une interface centralisée.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="reveal-on-scroll reveal-delay-2 p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <Icon name="heroicons:view-columns" class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-3">Vues Kanban</h3>
            <p class="text-slate-500 leading-relaxed text-sm">
              Visualisez le flux de travail avec clarté et précision. Suivez l'avancement en temps réel.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="reveal-on-scroll reveal-delay-3 p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mb-6">
              <Icon name="heroicons:bolt" class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-3">Synchronisation Temps Réel</h3>
            <p class="text-slate-500 leading-relaxed text-sm">
              Vos données sont mises à jour instantanément pour toute l'équipe. Fini les conflits de version.
            </p>
          </div>

          <!-- Feature 4 (Interactive Analytics Illustration) -->
          <div class="reveal-on-scroll reveal-delay-4 p-8 rounded-2xl bg-[#F8FAFC] border border-slate-100 shadow-sm flex flex-col justify-center min-h-[300px]">
             <h3 class="text-sm font-bold text-slate-900 mb-4 tracking-tight uppercase">Analytique Intégrée</h3>
             <div class="flex-1 w-full relative">
               <ClientOnly>
                 <AreaChart
                   :data="currentChartData"
                   :categories="categories"
                   :xFormatter="xFormatter"
                   :height="220"
                   class="w-full h-full"
                 />
               </ClientOnly>
             </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Resources Section -->
    <section id="resources" class="min-h-[calc(100vh-5rem)] flex flex-col justify-center py-20 lg:py-32 bg-[#F8FAFC] border-t border-slate-100 reveal-on-scroll">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <h2 class="landing-display text-3xl md:text-4xl font-bold mb-4 text-slate-900 tracking-tight">Ressources & Documentation</h2>
          <p class="text-slate-500 text-lg">Guides et outils pour optimiser votre utilisation de Gestion Pro.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="reveal-on-scroll reveal-delay-1 p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div class="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mb-6">
              <Icon name="heroicons:document-text" class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">Documentation</h3>
            <p class="text-slate-500 leading-relaxed text-sm mb-4">
              Guides étape par étape pour configurer vos espaces de travail, gérer vos équipes et personnaliser vos flux.
            </p>
            <span class="text-sm font-bold text-black flex items-center gap-1 cursor-pointer hover:underline">En savoir plus <Icon name="heroicons:arrow-right" class="w-4 h-4" /></span>
          </div>

          <div class="reveal-on-scroll reveal-delay-2 p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div class="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mb-6">
              <Icon name="heroicons:academic-cap" class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">Tutoriels Vidéo</h3>
            <p class="text-slate-500 leading-relaxed text-sm mb-4">
              Découvrez les meilleures pratiques de gestion de projet grâce à nos vidéos de formation rapides.
            </p>
            <span class="text-sm font-bold text-black flex items-center gap-1 cursor-pointer hover:underline">Regarder <Icon name="heroicons:arrow-right" class="w-4 h-4" /></span>
          </div>

          <div class="reveal-on-scroll reveal-delay-3 p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div class="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mb-6">
              <Icon name="heroicons:user-group" class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">Communauté</h3>
            <p class="text-slate-500 leading-relaxed text-sm mb-4">
              Rejoignez d'autres utilisateurs pour échanger des conseils, proposer des fonctionnalités et collaborer.
            </p>
            <span class="text-sm font-bold text-black flex items-center gap-1 cursor-pointer hover:underline">Rejoindre <Icon name="heroicons:arrow-right" class="w-4 h-4" /></span>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-24 bg-white border-t border-slate-100 reveal-on-scroll">
      <div class="max-w-6xl mx-auto px-6 text-center">
        <div class="max-w-2xl mx-auto mb-16">
          <h2 class="landing-display text-3xl md:text-4xl font-bold mb-4 text-slate-900 tracking-tight">Tarification Simple</h2>
          <p class="text-slate-500 text-lg">Choisissez le plan adapté à la taille de votre équipe.</p>
        </div>

        <div class="reveal-on-scroll reveal-delay-1 max-w-md mx-auto rounded-3xl bg-white p-8 border border-slate-200 shadow-xl text-left">
          <div class="flex justify-between items-center mb-4">
            <span class="text-xl font-bold text-slate-900">Pro</span>
            <span class="text-xs font-bold uppercase tracking-wider bg-black text-white px-3 py-1 rounded-full">Populaire</span>
          </div>
          <div class="text-4xl font-extrabold text-slate-900 mb-2">Gratuit <span class="text-base font-normal text-slate-500">/ période d'essai</span></div>
          <p class="text-slate-500 text-sm mb-6">Tout ce dont vous avez besoin pour gérer vos espaces de travail.</p>
          <ul class="space-y-3 mb-8 text-sm text-slate-600">
            <li class="flex items-center gap-2">
              <Icon name="heroicons:check" class="w-5 h-5 text-emerald-500" />
              Projets et tâches illimités
            </li>
            <li class="flex items-center gap-2">
              <Icon name="heroicons:check" class="w-5 h-5 text-emerald-500" />
              Tableaux Kanban & Suivi d'équipe
            </li>
            <li class="flex items-center gap-2">
              <Icon name="heroicons:check" class="w-5 h-5 text-emerald-500" />
              Rapports analytiques en temps réel
            </li>
          </ul>
          <NuxtLink to="/auth/signup" class="w-full py-3.5 bg-gradient-to-b from-gray-800 to-black text-white rounded-full font-bold text-center block transition-all border border-gray-700/50 neo-emboss hover:brightness-110 active:neo-inset active:scale-[0.98]">
            Commencer maintenant
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#0F172A] text-slate-300 pt-16 pb-12 border-t border-slate-800 reveal-on-scroll">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          <!-- Brand & Newsletter -->
          <div class="lg:col-span-2 space-y-6">
            <div class="flex items-center gap-3 cursor-pointer" @click="scrollToSection('hero')">
              <img src="/assets/logo_app.svg" alt="Logo" class="w-8 h-8 object-contain">
              <span class="landing-display text-xl font-bold tracking-tight text-white">Gestion Pro</span>
            </div>
            <p class="text-slate-400 text-sm leading-relaxed max-w-sm">
              La plateforme tout-en-un pour organiser vos équipes, planifier vos projets et suivre votre avancement en temps réel.
            </p>
            <div class="pt-2">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Restez informé</h4>
              <form @submit.prevent class="flex gap-2 max-w-sm">
                <input type="email" placeholder="Votre adresse e-mail" class="px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 flex-1" />
                <button type="submit" class="px-4 py-2.5 bg-white text-black font-semibold text-sm rounded-xl hover:bg-slate-200 transition-all flex-shrink-0">
                  S'abonner
                </button>
              </form>
            </div>
          </div>

          <!-- Product Links -->
          <div>
            <h4 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Produit</h4>
            <ul class="space-y-3 text-sm">
              <li><a href="#features" @click.prevent="scrollToSection('features')" class="text-slate-400 hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#product" @click.prevent="scrollToSection('product')" class="text-slate-400 hover:text-white transition-colors">Vue Kanban</a></li>
              <li><a href="#features" @click.prevent="scrollToSection('features')" class="text-slate-400 hover:text-white transition-colors">Multi-Organisations</a></li>
              <li><a href="#pricing" @click.prevent="scrollToSection('pricing')" class="text-slate-400 hover:text-white transition-colors">Tarification</a></li>
              <li><NuxtLink to="/auth/signup" class="text-slate-400 hover:text-white transition-colors">Créer un compte</NuxtLink></li>
            </ul>
          </div>

          <!-- Resources Links -->
          <div>
            <h4 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Ressources</h4>
            <ul class="space-y-3 text-sm">
              <li><a href="#resources" @click.prevent="scrollToSection('resources')" class="text-slate-400 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#resources" @click.prevent="scrollToSection('resources')" class="text-slate-400 hover:text-white transition-colors">Tutoriels Vidéo</a></li>
              <li><a href="#resources" @click.prevent="scrollToSection('resources')" class="text-slate-400 hover:text-white transition-colors">Communauté</a></li>
              <li><a href="#" class="text-slate-400 hover:text-white transition-colors">Centre d'aide</a></li>
              <li><a href="#" class="text-slate-400 hover:text-white transition-colors">Statut du service</a></li>
            </ul>
          </div>

          <!-- Company & Legal -->
          <div>
            <h4 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Entreprise</h4>
            <ul class="space-y-3 text-sm">
              <li><a href="#" class="text-slate-400 hover:text-white transition-colors">À propos</a></li>
              <li><a href="#" class="text-slate-400 hover:text-white transition-colors">Carrières</a></li>
              <li><a href="#" class="text-slate-400 hover:text-white transition-colors">Politique de confidentialité</a></li>
              <li><a href="#" class="text-slate-400 hover:text-white transition-colors">Conditions d'utilisation</a></li>
              <li><a href="#" class="text-slate-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

        </div>

        <!-- Bottom Bar -->
        <div class="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {{ new Date().getFullYear() }} Gestion Pro. Tous droits réservés.
          </div>

          <div class="flex items-center gap-6">
            <a href="#" class="hover:text-slate-300 transition-colors">Confidentialité</a>
            <a href="#" class="hover:text-slate-300 transition-colors">Conditions</a>
            <a href="#" class="hover:text-slate-300 transition-colors">Cookies</a>
            <a href="#" class="hover:text-slate-300 transition-colors">Mentions légales</a>
          </div>
        </div>

      </div>
    </footer>

    <!-- Floating Back to Top Button -->
    <Transition name="fade-top">
      <button 
        v-if="showBackToTop"
        @click="scrollToTop"
        class="fixed bottom-8 right-8 z-50 p-3.5 bg-gradient-to-b from-gray-800 to-black text-white rounded-full border border-gray-700/50 neo-emboss hover:brightness-110 active:neo-inset active:scale-[0.98] transition-all duration-300 group flex items-center justify-center shadow-xl backdrop-blur-md"
        title="Retour en haut"
        aria-label="Retour en haut"
      >
        <Icon name="ph:arrow-up-bold" class="w-5 h-5 text-white group-hover:-translate-y-1 transition-transform duration-300" />
      </button>
    </Transition>

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
html, body {
  scroll-behavior: smooth;
  overflow-x: hidden;
  max-width: 100vw;
}

/* Smooth Scroll Fade In Effect */
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(44px) scale(0.97);
  transition: opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.reveal-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.reveal-delay-1 { transition-delay: 0.12s; }
.reveal-delay-2 { transition-delay: 0.24s; }
.reveal-delay-3 { transition-delay: 0.36s; }
.reveal-delay-4 { transition-delay: 0.48s; }

/* Back to Top Vue Transition */
.fade-top-enter-active,
.fade-top-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-top-enter-from,
.fade-top-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.9);
}
</style>