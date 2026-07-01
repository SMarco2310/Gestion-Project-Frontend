<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { DashboardCard } from '~/components/CardDashboard.vue'
import { TaskStatus, TaskPriority } from '~/utils/enums'
import useAuth from '~/composables/useAuth'
import useTasks from '~/composables/useTasks'
import useProjets from '~/composables/useProjets'
import useCommentaire from '~/composables/useCommentaire'

definePageMeta({
  layout: 'custom',
//   middleware: 'auth',
})

const { user, getProfile } = useAuth()
const { tasks, getTasks } = useTasks()
const { projets, getProjets } = useProjets()
const { commentaires, getCommentaires } = useCommentaire()
const { createProjet } = useProjets()

const isCreateProjectModalOpen = ref(false)

const handleCreateProjectSubmit = async (payload: any) => {
  try {
    await createProjet(
      payload.name,
      payload.description,
      payload.status,
      payload.start_date,
      payload.end_date
    )
    await getProjets()
    isCreateProjectModalOpen.value = false
    navigateTo('/projets')
  } catch (err) {
    console.error('Failed to create project', err)
  }
}

const userName = computed(() => user.value?.name ?? 'Utilisateur')

const doneCount = computed(() => tasks.value.filter((task) => task.status === TaskStatus.DONE).length)
const createdCount = computed(() => tasks.value.length)
const openCount = computed(() => tasks.value.filter((task) => task.status !== TaskStatus.DONE).length)
const projectsCount = computed(() => projets.value.length)
const commentsCount = computed(() => commentaires.value.length)

const recentCount = computed(() => {
  const now = Date.now()
  const twentyFourHours = 24 * 60 * 60 * 1000

  const updatedTasks = tasks.value.filter((task) => {
    if (!task.updated_at) return false
    const date = new Date(task.updated_at).getTime()
    return !Number.isNaN(date) && now - date <= twentyFourHours
  }).length

  const recentComments = commentaires.value.filter((comment) => {
    if (!comment.created_at) return false
    const date = new Date(comment.created_at).getTime()
    return !Number.isNaN(date) && now - date <= twentyFourHours
  }).length

  return Math.max(updatedTasks, recentComments, 0)
})

const cards = computed<DashboardCard[]>(() => [
  {
    title: 'TERMINÉS',
    value: doneCount.value,
    subtitle: `${createdCount.value ? Math.round((doneCount.value / Math.max(createdCount.value, 1)) * 100) : 0}% du total`,
    subtitleIcon: 'ph:trend-up',
    icon: 'ph:check-circle',
    iconClass: 'text-blue-400',
    type: 'default',
  },
  {
    title: 'MIS À JOUR',
    value: recentCount.value,
    subtitle: 'Dernières 24 heures',
    icon: 'ph:clock-counter-clockwise',
    iconClass: 'text-blue-400',
    type: 'default',
  },
  {
    title: 'CRÉÉS',
    value: createdCount.value,
    subtitle: `${projectsCount.value} projets actifs`,
    icon: 'ph:plus-circle',
    iconClass: 'text-gray-400',
    type: 'default',
  },
  {
    title: 'OUVERTES',
    value: openCount.value,
    subtitle: `${commentsCount.value} commentaires`,
    icon: 'ph:warning',
    iconClass: 'text-rose-300',
    type: 'danger',
  },
])

const statusMetrics = computed(() => {
  const total = tasks.value.length
  if (total === 0) {
    return [
      { label: 'À faire', percentage: '0%', colorClass: 'bg-[#FFB78C]', colorCode: '#FFB78C', rawPercent: 0 },
      { label: 'En cours', percentage: '0%', colorClass: 'bg-[#8CA8F9]', colorCode: '#8CA8F9', rawPercent: 0 },
      { label: 'Terminées', percentage: '0%', colorClass: 'bg-[#A6C4FF]', colorCode: '#A6C4FF', rawPercent: 0 },
    ]
  }

  const todo = tasks.value.filter((task) => task.status === TaskStatus.TO_DO).length
  const inProgress = tasks.value.filter((task) => task.status === TaskStatus.IN_PROGRESS).length
  const done = tasks.value.filter((task) => task.status === TaskStatus.DONE).length

  return [
    { label: 'À faire', percentage: `${Math.round((todo / total) * 100)}%`, colorClass: 'bg-[#FFB78C]', colorCode: '#FFB78C', rawPercent: (todo / total) * 100 },
    { label: 'En cours', percentage: `${Math.round((inProgress / total) * 100)}%`, colorClass: 'bg-[#8CA8F9]', colorCode: '#8CA8F9', rawPercent: (inProgress / total) * 100 },
    { label: 'Terminées', percentage: `${Math.round((done / total) * 100)}%`, colorClass: 'bg-[#A6C4FF]', colorCode: '#A6C4FF', rawPercent: (done / total) * 100 },
  ]
})

const priorities = computed(() => {
  const counts = {
    [TaskPriority.HIGH]: 0,
    [TaskPriority.MEDIUM]: 0,
    [TaskPriority.LOW]: 0,
  }

  tasks.value.forEach((task) => {
    if (task.priority in counts) {
      counts[task.priority as TaskPriority]++
    }
  })

  const maxCount = Math.max(counts[TaskPriority.HIGH], counts[TaskPriority.MEDIUM], counts[TaskPriority.LOW], 1)

  return [
    { label: 'Élevé', count: counts[TaskPriority.HIGH], icon: 'ph:caret-double-up', iconColor: 'text-rose-400', barColor: 'bg-rose-300', percent: Math.round((counts[TaskPriority.HIGH] / maxCount) * 100) },
    { label: 'Moyen', count: counts[TaskPriority.MEDIUM], icon: 'ph:equals', iconColor: 'text-blue-400', barColor: 'bg-blue-300', percent: Math.round((counts[TaskPriority.MEDIUM] / maxCount) * 100) },
    { label: 'Faible', count: counts[TaskPriority.LOW], icon: 'ph:caret-down', iconColor: 'text-gray-400', barColor: 'bg-gray-400', percent: Math.round((counts[TaskPriority.LOW] / maxCount) * 100) },
  ]
})

const epics = computed(() => {
  return projets.value.map((project) => {
    const projectTasks = tasks.value.filter((task) => String(task.projet_id) === String(project.id))
    const total = projectTasks.length
    const done = projectTasks.filter((task) => task.status === TaskStatus.DONE).length
    const progress = total ? Math.round((done / total) * 100) : 0

    return {
      id: String(project.id),
      title: project.name,
      progress,
      badgeBg: progress > 65 ? 'bg-blue-500/10' : 'bg-orange-500/10',
      badgeText: progress > 65 ? 'text-blue-400' : 'text-orange-400',
      barColor: progress > 65 ? 'bg-[#A6C4FF]' : 'bg-[#FFB78C]',
    }
  }).slice(0, 3)
})

onMounted(async () => {
  await Promise.all([
    getProfile().catch(() => null),
    getTasks().catch(() => null),
    getProjets().catch(() => null),
    getCommentaires().catch(() => null),
  ])
})
</script>

<template>
    <div>
        <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex flex-col gap-2">
            <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Dashboard</h1>
            <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1">Bienvenue sur votre tableau de bord, {{ userName }}</p>
          </div>
          <button @click="isCreateProjectModalOpen = true" class="px-4 py-2 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 self-start sm:self-auto neo-emboss">
            <Icon name="heroicons:plus" class="w-4 h-4" />
            Créer un projet
          </button>
        </section>
    <br>
    <section>
        <!-- Stats Cards with only numbers -->
        <CardDashboard :cards="cards" />
    </section>
    <br>
    <section>
        <!-- Stats Cards with graphs -->
        <CardV2Dashboard
          :totalIssues="createdCount"
          :statusMetrics="statusMetrics"
          :priorities="priorities"
          :epics="epics"
        />
    </section>
    
    <CreateProjectModal
      :is-open="isCreateProjectModalOpen"
      @close="isCreateProjectModalOpen = false"
      @submit="handleCreateProjectSubmit"
    />
    </div>
</template>