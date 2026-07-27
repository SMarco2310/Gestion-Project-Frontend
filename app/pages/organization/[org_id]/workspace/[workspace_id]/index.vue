<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { DashboardCard } from '~/components/CardDashboard.vue'
import { TaskPriority } from '~/utils/enums'
import useAuth from '~/composables/useAuth'
import useOrganizations from '~/composables/useOrganizations'
import useTasks from '~/composables/useTasks'
import useProjets from '~/composables/useProjets'
import useCommentaire from '~/composables/useCommentaire'
import useWorkspaces from '~/composables/useWorkspaces'
import { useTour } from '~/composables/useTour'

definePageMeta({
  layout: 'custom',
//   middleware: 'auth',
})

const route = useRoute()
const { user, getProfile } = useAuth()
const { tasks, getTasks } = useTasks()
const { projets, getProjets, createProjet } = useProjets()
const { commentaires, getCommentaires } = useCommentaire()
const { activeOrganization, getOrganization, setActiveOrganization } = useOrganizations()
const { activeWorkspace, getWorkspace, setActiveWorkspace } = useWorkspaces()
const { continueTourIfPending } = useTour()

const kanbanColumns = computed<string[]>(() => {
  return activeWorkspace.value?.kanban_columns !== undefined && activeWorkspace.value?.kanban_columns !== null
    ? activeWorkspace.value.kanban_columns 
    : ['À faire', 'En cours', 'Terminé']
})

const doneStatus = computed(() => kanbanColumns.value[kanbanColumns.value.length - 1] || 'Terminé')
const isDone = (status: string) => status === doneStatus.value || status.toLowerCase() === 'terminé' || status.toLowerCase() === 'done'

const isCreateProjectModalOpen = ref(false)
const isTaskModalOpen = ref(false)
const selectedTaskId = ref<string | null>(null)

const handleTaskClick = (taskId: string) => {
  selectedTaskId.value = taskId
  isTaskModalOpen.value = true
}

const handleCreateProjectSubmit = async (payload: any) => {
  try {
    await createProjet(
      payload.name,
      payload.description,
      payload.status,
      payload.start_date,
      payload.end_date,
      payload.color || 'blue',
      payload.team_ids,
      payload.user_ids
    )
    await getProjets()
    isCreateProjectModalOpen.value = false
    navigateTo(`/organization/${route.params.org_id}/projects`)
  } catch (err) {
    console.error('Failed to create project', err)
  }
}

const userName = computed(() => ((user.value?.last_name ?? '') + ' ' + (user.value?.first_name ?? '')).trim() || 'Utilisateur')

const doneCount = computed(() => tasks.value.filter((task) => isDone(task.status)).length)
const createdCount = computed(() => tasks.value.length)
const openCount = computed(() => tasks.value.filter((task) => !isDone(task.status)).length)
const projectsCount = computed(() => projets.value.length)
const commentsCount = computed(() => commentaires.value.length)

const orgMembersCount = ref(0)

const totalUsersCount = computed(() => {
  return orgMembersCount.value || (activeOrganization.value as any)?.users?.length || (activeOrganization.value as any)?.members?.length || 1
})

const activeProjectsCount = computed(() => {
  return projets.value.filter(p => !isDone(p.status) && !p.is_archived).length
})

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
  const colors = [
    { class: 'bg-[#FFB78C]', code: '#FFB78C' },
    { class: 'bg-[#8CA8F9]', code: '#8CA8F9' },
    { class: 'bg-[#A6C4FF]', code: '#A6C4FF' },
    { class: 'bg-[#C4A6FF]', code: '#C4A6FF' },
    { class: 'bg-[#FFA6C4]', code: '#FFA6C4' }
  ]

  if (total === 0) {
    return kanbanColumns.value.slice(0, 3).map((col, i) => ({
      label: col, percentage: '0%', colorClass: colors[i % colors.length]?.class || 'bg-[#FFB78C]', colorCode: colors[i % colors.length]?.code || '#FFB78C', rawPercent: 0
    }))
  }

  return kanbanColumns.value.slice(0, 3).map((col, i) => {
    let count = 0
    tasks.value.forEach((task) => {
      // Determine which column this task belongs to
      let assignedCol = null
      if (task.board_column && kanbanColumns.value.includes(task.board_column)) {
        assignedCol = task.board_column
      } else if (task.status) {
        const matched = kanbanColumns.value.find(c => c.toLowerCase() === task.status.toLowerCase())
        if (matched) assignedCol = matched
      }
      
      // If it belongs to THIS column, increment
      if (assignedCol === col) {
        count++
      }
    })
    
    return {
      label: col,
      percentage: `${total > 0 ? Math.round((count / total) * 100) : 0}%`,
      colorClass: colors[i % colors.length]?.class || 'bg-[#FFB78C]',
      colorCode: colors[i % colors.length]?.code || '#FFB78C',
      rawPercent: total > 0 ? (count / total) * 100 : 0
    }
  })
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
    const done = projectTasks.filter((task) => isDone(task.status)).length
    const progress = total ? Math.round((done / total) * 100) : 0

    return {
      id: project.id,
      reference_code: project.reference_code || String(project.id),
      title: project.name,
      progress,
      badgeBg: progress > 65 ? 'bg-primary/10' : 'bg-orange-500/10',
      badgeText: progress > 65 ? 'text-blue-400' : 'text-orange-400',
      barColor: progress > 65 ? 'bg-[#A6C4FF]' : 'bg-[#FFB78C]',
    }
  }).slice(0, 3)
})

const upcomingTasks = computed(() => {
  const now = new Date().getTime()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  
  return tasks.value
    .filter(t => !isDone(t.status) && t.due_date)
    .filter(t => {
      const dueDate = new Date(t.due_date as string).getTime()
      return dueDate >= now - (24 * 60 * 60 * 1000) && dueDate <= now + sevenDays
    })
    .sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime())
    .slice(0, 4)
})

const projectTaskStats = computed(() => {
  return projets.value.map((project) => {
    const projectTasks = tasks.value.filter((task) => String(task.projet_id) === String(project.id))
    const total = projectTasks.length
    const done = projectTasks.filter((task) => isDone(task.status)).length
    return {
      name: project.reference_code || project.name.substring(0, 8),
      Total: total,
      Complété: done
    }
  })
})

const recentCommentsData = computed(() => {
  return commentaires.value
    .filter(c => c.created_at)
    .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())
    .slice(0, 4)
    .map(c => ({
      id: c.id,
      content: c.content,
      author: (c.user?.last_name ? c.user.last_name + ' ' : '') + (c.user?.first_name || ''),
      time: new Date(c.created_at as string).toLocaleDateString('fr-FR'),
      taskId: c.tache_id
    }))
})

const topProjects = computed(() => {
  return (projets.value || [])
    .filter((p: any) => !p.is_archived)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
})

const getProjectMetrics = (projectId: number | string) => {
  const projectTasks = tasks.value.filter(t => String(t.projet_id) === String(projectId))
  const totalTasks = projectTasks.length
  const doneTasks = projectTasks.filter(t => isDone(t.status)).length
  const todoTasks = projectTasks.filter(t => !isDone(t.status)).length
  const inProgressTasks = 0
  const tasksProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  return { totalTasks, doneTasks, inProgressTasks, todoTasks, tasksProgress }
}

const getProjectUsers = (p: any) => {
  const usersMap = new Map()
  if (p.users && Array.isArray(p.users)) {
    p.users.forEach((u: any) => usersMap.set(u.id, u))
  }
  if (p.teams && Array.isArray(p.teams)) {
    p.teams.forEach((t: any) => {
      if (t.members && Array.isArray(t.members)) {
        t.members.forEach((u: any) => usersMap.set(u.id, u))
      }
    })
  }
  return Array.from(usersMap.values())
}

onMounted(async () => {
  const orgId = route.params.org_id as string
  const wsId = route.params.workspace_id as string

  // Initialize contexts if needed
  if (!activeOrganization.value || String(activeOrganization.value.id) !== orgId) {
    const org = await getOrganization(orgId).catch(() => null)
    if (org) setActiveOrganization(org)
  }
  
  if (!activeWorkspace.value || String(activeWorkspace.value.id) !== wsId) {
    const ws = await getWorkspace(wsId).catch(() => null)
    if (ws) setActiveWorkspace(ws)
  }

  if (activeWorkspace.value) {
     orgMembersCount.value = activeWorkspace.value?.users?.length || 1
  }

  await Promise.all([
    getProfile().catch(() => null),
    getTasks().catch(() => null),
    getProjets().catch(() => null),
    getCommentaires().catch(() => null),
  ])

  // Resume the onboarding tour if it was navigated here during Phase 2
  continueTourIfPending('dashboard')
})
</script>

<template>
    <div>
        <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex flex-col gap-2">
            <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Dashboard</h1>
            <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1">Bienvenue sur votre tableau de bord, {{ userName }}</p>
          </div>
          <button id="tour-dashboard-create-project" @click="isCreateProjectModalOpen = true" class="px-4 py-2 btn-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 self-end sm:self-auto neo-emboss">
            <Icon name="heroicons:plus" class="w-4 h-4" />
            Créer un projet
          </button>
        </section>
    <br>
    <section id="tour-dashboard-stats">
        <!-- Stats Cards with only numbers -->
        <CardDashboard :cards="cards" />
    </section>
    <br>
    <section>
        <DashboardAnalytics 
          :totalUsers="totalUsersCount"
          :activeProjects="activeProjectsCount"
          :tasks="tasks"
          :kanbanColumns="kanbanColumns"
          @taskClick="handleTaskClick"
        />
    </section>
    <br>
    <section>
        <!-- Stats Cards with graphs -->
        <CardV2Dashboard
          :totalIssues="createdCount"
          :statusMetrics="statusMetrics"
          :projectTaskStats="projectTaskStats"
          :priorities="priorities"
          :epics="epics"
          :upcomingTasks="upcomingTasks"
          :recentComments="recentCommentsData"
          @taskClick="handleTaskClick"
        />
    </section>
    <br>


    <section v-if="topProjects.length > 0">
        <div class="flex items-center justify-between mb-4 mt-2">
            <h2 class="text-xl font-bold text-main dark:text-gray-200">Projets récents</h2>
            <NuxtLink :to="`/organization/${$route.params.org_id}/workspace/${$route.params.workspace_id}/projects`" class="text-[10px] font-bold text-[#0B0E11] uppercase tracking-widest hover:underline">
                Tous les projets
            </NuxtLink>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            <ProjetCard
              v-for="p in topProjects" :key="p.id"
              :id="p.id"
              :user_id="(p as any).user_id"
              :reference_code="p.reference_code"
              :name="p.name"
              :description="p.description"
              :status="(p as any).status || 'à faire'"
              :color="p.color"
              :is_archived="p.is_archived"
              :end_date="(p as any).end_date || ''"
              :metrics="getProjectMetrics(p.id)"
              :users="getProjectUsers(p)"
              @cardClick="navigateTo(`/organization/${$route.params.org_id}/workspace/${$route.params.workspace_id}/projects/${p.id}`)"
            />
        </div>
    </section>
    
    
    
    <CreateProjectModal
      :is-open="isCreateProjectModalOpen"
      @close="isCreateProjectModalOpen = false"
      @submit="handleCreateProjectSubmit"
    />
    <TaskModal
      :is-open="isTaskModalOpen"
      :task-id="selectedTaskId"
      @close="isTaskModalOpen = false"
      @update="getTasks"
    />
    </div>
</template>