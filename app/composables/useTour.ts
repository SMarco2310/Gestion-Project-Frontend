/**
 * useTour — Full-app Driver.js onboarding tour
 *
 * Complete tour route:
 *   Phase 1  /organizations           (3 steps)
 *   Phase 2A dashboard                (4 steps → navigates to projects)
 *   Phase 2B /projects                (3 steps → navigates to tasks)
 *   Phase 2C /tasks (kanban)          (3 steps → navigates to calendar)
 *   Phase 2D /calendar                (2 steps → navigates to team)
 *   Phase 2E /team                    (3 steps → navigates to notifications)
 *   Phase 2F /notifications           (2 steps → DONE)
 *
 * Cross-page continuation:
 *   localStorage key 'tour_pending_step' stores the next page to activate.
 *   Each page calls continueTourIfPending(pageName) in onMounted.
 *
 * Cancellation:
 *   The X button is always visible (allowClose: true).
 *   Clicking it calls onDestroyStarted → markTourCompleted() → tour won't restart.
 *   Pressing "Terminer 🎉" on the last step also marks it complete.
 *
 * State keys (localStorage):
 *   tour_completed    — 'true' once done or cancelled
 *   tour_phase2_done  — 'true' prevents auto-relaunch of Phase 2
 *   tour_pending_step — pending page identifier for cross-page continuation
 */

const TOUR_KEY = 'tour_completed'
const PHASE2_KEY = 'tour_phase2_done'
const PENDING_KEY = 'tour_pending_step'

type TourPage = 'dashboard' | 'projects' | 'tasks' | 'calendar' | 'team' | 'notifications' | 'workspaces' | 'settings'

export function useTour() {

  // ─── State helpers ────────────────────────────────────────────────────────

  const isTourCompleted = computed(() => {
    if (!process.client) return true
    return localStorage.getItem(TOUR_KEY) === 'true'
  })

  const markTourCompleted = () => {
    if (!process.client) return
    localStorage.setItem(TOUR_KEY, 'true')
    localStorage.removeItem(PENDING_KEY)
  }

  const resetTourFlag = () => {
    if (!process.client) return
    localStorage.setItem(TOUR_KEY, 'false')
    localStorage.setItem(PHASE2_KEY, 'false')
    localStorage.removeItem(PENDING_KEY)
  }

  const getPendingStep = (): string | null => {
    if (!process.client) return null
    return localStorage.getItem(PENDING_KEY)
  }

  const setPendingStep = (step: string) => {
    if (!process.client) return
    localStorage.setItem(PENDING_KEY, step)
  }

  const clearPendingStep = () => {
    if (!process.client) return
    localStorage.removeItem(PENDING_KEY)
  }

  // ─── Driver.js factory ────────────────────────────────────────────────────

  const createDriver = async () => {
    const { driver } = await import('driver.js')
    await import('driver.js/dist/driver.css')

    return driver({
      showProgress: true,
      animate: true,
      overlayOpacity: 0.55,
      smoothScroll: true,
      allowClose: true,          // X button always visible — clicking it cancels the tour
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'gp-tour-popover',
      nextBtnText: 'Suivant →',
      prevBtnText: '← Précédent',
      doneBtnText: 'Terminer 🎉',
      // Fires when user clicks X or the overlay, or when we manually destroy
      onDestroyStarted: (_el: any, _step: any, { driver: d }: any) => {
        markTourCompleted()   // Always mark done — prevents re-auto-start
        d.destroy()
      },
    })
  }

  // Helper: build path relative to current workspace URL
  const workspacePath = (tail: string) => {
    if (!process.client) return '/'
    const m = window.location.pathname.match(/^(\/organization\/[^/]+\/workspace\/[^/]+)/)
    return m ? `${m[1]}${tail}` : '/'
  }

  // Helper: build notifications path
  const notificationsPath = () => {
    if (!process.client) return '/'
    const m = window.location.pathname.match(/^\/organization\/([^/]+)/)
    return m ? `/organization/${m[1]}/notifications` : '/'
  }

  // ─── Phase 1: Organizations page ──────────────────────────────────────────

  const startPhase1Tour = async () => {
    if (!process.client) return
    const d = await createDriver()
    d.setSteps([
      {
        popover: {
          title: '👋 Bienvenue sur Gestion Pro !',
          description:
            'Ce guide vous présente toutes les fonctionnalités en quelques minutes. Vous pouvez l\'annuler à tout moment en cliquant sur la croix ✕ ou le relancer depuis votre profil.',
          side: 'over' as any,
          align: 'center',
        },
      },
      {
        element: '#tour-org-list',
        popover: {
          title: '🏢 Vos Organisations',
          description:
            'Chaque organisation est un espace de travail indépendant pour votre équipe. Vous pouvez en appartenir à plusieurs et basculer facilement entre elles.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-create-org-btn',
        popover: {
          title: '✨ Créer une Organisation',
          description:
            'Cliquez ici pour créer votre première organisation — donnez-lui un nom, un logo et une couleur de marque. Une fois créée, vous entrez dans votre espace de travail.',
          side: 'top',
          align: 'center',
        },
      },
    ])
    d.drive()
  }

  // ─── Phase 2A: Dashboard ──────────────────────────────────────────────────

  const startDashboardTour = async () => {
    if (!process.client) return
    clearPendingStep()
    const d = await createDriver()
    const currentPath = window.location.pathname

    d.setSteps([
      {
        element: '#tour-sidebar-org',
        popover: {
          title: '🗂️ Espace de Travail',
          description:
            'Ce panneau vous permet de basculer entre vos espaces de travail et vos organisations. Chaque workspace regroupe ses propres projets, tâches et équipes.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-nav-dashboard',
        popover: {
          title: '📊 Tableau de Bord',
          description:
            'Votre page d\'accueil : tâches récentes, métriques de performance, avancement des projets. Tout est visible d\'un seul coup d\'œil.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-dashboard-create-project',
        popover: {
          title: '📁 Créer un Projet',
          description:
            'Lancez un nouveau projet depuis le dashboard. Un projet regroupe vos tâches, une équipe assignée et une date de début/fin.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '#tour-dashboard-stats',
        popover: {
          title: '📈 Statistiques en Temps Réel',
          description:
            'Ces cartes affichent le nombre de tâches terminées, mises à jour, créées et les activités récentes de votre équipe — rafraîchies automatiquement.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-nav-projects',
        popover: {
          title: '➡️ Section Projets',
          description:
            'Découvrons maintenant comment créer et gérer vos projets.',
          side: 'right',
          align: 'start',
          onNextClick: () => {
            setPendingStep('projects')
            d.destroy()
            navigateTo(currentPath.replace(/\/[^/]*$/, '/projects'))
          },
        },
      },
    ])
    d.drive()
  }

  // ─── Phase 2B: Projects ───────────────────────────────────────────────────

  const startProjectsTour = async () => {
    if (!process.client) return
    clearPendingStep()
    const d = await createDriver()
    const currentPath = window.location.pathname

    d.setSteps([
      {
        element: '#tour-projects-header',
        popover: {
          title: '📁 Vos Projets',
          description:
            'La page Projets liste tous les projets de votre workspace. Chaque projet a un statut, une équipe assignée et une barre de progression.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-create-project-btn',
        popover: {
          title: '➕ Créer un Projet',
          description:
            'Ouvrez le formulaire de création ici. Définissez un nom, une description, des dates de début/fin, une couleur et assignez des membres ou équipes.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '#tour-nav-tasks',
        popover: {
          title: '➡️ Tableau Kanban',
          description:
            'Passons maintenant au cœur de votre workflow quotidien — le tableau Kanban des tâches.',
          side: 'right',
          align: 'start',
          onNextClick: () => {
            setPendingStep('tasks')
            d.destroy()
            navigateTo(currentPath.replace('/projects', '/tasks'))
          },
        },
      },
    ])
    d.drive()
  }

  // ─── Phase 2C: Tasks / Kanban ─────────────────────────────────────────────

  const startTasksTour = async () => {
    if (!process.client) return
    clearPendingStep()
    const d = await createDriver()
    const currentPath = window.location.pathname

    d.setSteps([
      {
        element: '#tour-tasks-header',
        popover: {
          title: '✅ Vos Tâches',
          description:
            'La page Tâches affiche votre Kanban interactif. Chaque colonne représente une étape de votre workflow.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-create-task-btn',
        popover: {
          title: '➕ Créer une Tâche',
          description:
            'Créez une tâche avec un responsable, une priorité (haute, moyenne, faible), une date d\'échéance, des étiquettes et un projet parent.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '#tour-kanban-board',
        popover: {
          title: '🗃️ Glisser-Déposer',
          description:
            'Faites glisser les cartes d\'une colonne à l\'autre pour changer leur statut. Cliquez sur une carte pour voir ses détails, commenter ou modifier les assignés.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-nav-calendar',
        popover: {
          title: '➡️ Planning',
          description:
            'Voyons maintenant le Planning — une vue calendrier de toutes vos tâches et échéances.',
          side: 'right',
          align: 'start',
          onNextClick: () => {
            setPendingStep('calendar')
            d.destroy()
            navigateTo(currentPath.replace('/tasks', '/calendar'))
          },
        },
      },
    ])
    d.drive()
  }

  // ─── Phase 2D: Calendar ───────────────────────────────────────────────────

  const startCalendarTour = async () => {
    if (!process.client) return
    clearPendingStep()
    const d = await createDriver()
    const currentPath = window.location.pathname

    d.setSteps([
      {
        element: '#tour-calendar-header',
        popover: {
          title: '📅 Planning',
          description:
            'La vue Planning affiche toutes vos tâches et projets sur un calendrier mensuel ou hebdomadaire. Idéal pour visualiser les délais et planifier la charge de travail.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-calendar-add-btn',
        popover: {
          title: '➕ Ajouter depuis le Calendrier',
          description:
            'Cliquez ici pour créer directement une tâche ou un projet depuis le calendrier. Vous pouvez aussi glisser-déposer des tâches existantes sur le calendrier pour modifier leur date d\'échéance.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '#tour-nav-calendar',
        popover: {
          title: '🔄 Navigation Calendrier',
          description:
            'Naviguez entre les semaines et les mois. Les tâches et projets avec date d\'échéance apparaissent automatiquement — glissez-les pour changer leurs dates.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-nav-team',
        popover: {
          title: '➡️ Équipes',
          description:
            'Passons maintenant à la gestion des équipes et des membres.',
          side: 'right',
          align: 'start',
          onNextClick: () => {
            setPendingStep('team')
            d.destroy()
            navigateTo(currentPath.replace('/calendar', '/team'))
          },
        },
      },
    ])
    d.drive()
  }

  // ─── Phase 2E: Team ───────────────────────────────────────────────────────

  const startTeamTour = async () => {
    if (!process.client) return
    clearPendingStep()
    const d = await createDriver()

    d.setSteps([
      {
        element: '#tour-team-header',
        popover: {
          title: '👥 Vos Équipes',
          description:
            'Chaque équipe regroupe des membres et peut être assignée à plusieurs projets. Cliquez sur une carte d\'équipe pour voir ses membres et gérer les accès.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-create-team-btn',
        popover: {
          title: '➕ Créer une Équipe',
          description:
            'Cliquez ici pour créer une nouvelle équipe. Donnez-lui un nom et une description, puis assignez-la à vos projets pour organiser la collaboration par groupe de travail.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        popover: {
          title: '🔗 Associer une Équipe Existante',
          description:
            'Le bouton "Associer une équipe" permet d\'ajouter une équipe déjà créée dans votre organisation à cet espace de travail — pratique si vous partagez des équipes entre plusieurs projets.',
          side: 'over' as any,
          align: 'center',
        },
      },
      {
        element: '#tour-nav-notifications',
        popover: {
          title: '➡️ Notifications',
          description:
            'Dernière étape — les notifications pour rester informé de toute l\'activité de votre équipe.',
          side: 'right',
          align: 'start',
          onNextClick: () => {
            setPendingStep('notifications')
            d.destroy()
            navigateTo(notificationsPath())
          },
        },
      },
    ])
    d.drive()
  }

  // ─── Phase 2F: Notifications ──────────────────────────────────────────────

  const startNotificationsTour = async () => {
    if (!process.client) return
    clearPendingStep()
    const d = await createDriver()
    const m = window.location.pathname.match(/^\/organization\/([^/]+)/)
    const orgId = m ? m[1] : ''

    d.setSteps([
      {
        element: '#tour-notifications-header',
        popover: {
          title: '🔔 Notifications',
          description:
            'Toutes vos alertes ici : rappels de tâches, mentions d\'équipe, mises à jour de projets et nouvelles invitations. Les notifications non lues sont marquées en bleu.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        popover: {
          title: '➡️ Espaces de Travail (Workspaces)',
          description:
            'Découvrons comment gérer plusieurs espaces de travail au sein de votre organisation.',
          side: 'over' as any,
          align: 'center',
          onNextClick: () => {
            setPendingStep('workspaces')
            d.destroy()
            if (orgId) {
              navigateTo(`/organization/${orgId}/workspaces`)
            } else {
              navigateTo('/organizations')
            }
          },
        },
      },
    ])
    d.drive()
  }

  // ─── Phase 2G: Workspaces ─────────────────────────────────────────────────

  const startWorkspacesTour = async () => {
    if (!process.client) return
    clearPendingStep()
    const d = await createDriver()
    const m = window.location.pathname.match(/^\/organization\/([^/]+)/)
    const orgId = m ? m[1] : ''

    d.setSteps([
      {
        element: '#tour-workspaces-header',
        popover: {
          title: '🏢 Workspaces',
          description:
            'Ici, vous pouvez voir et basculer entre tous les espaces de travail de cette organisation.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-create-workspace-btn',
        popover: {
          title: '➕ Nouveau Workspace',
          description:
            'Vous pouvez créer des workspaces séparés pour différents départements, clients, ou grandes initiatives.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        popover: {
          title: '➡️ Paramètres de l\'Organisation',
          description:
            'Enfin, voyons où configurer votre organisation.',
          side: 'over' as any,
          align: 'center',
          onNextClick: () => {
            setPendingStep('settings')
            d.destroy()
            if (orgId) {
              navigateTo(`/organization/${orgId}/settings`)
            } else {
              navigateTo('/organizations')
            }
          },
        },
      },
    ])
    d.drive()
  }

  // ─── Phase 2H: Settings ───────────────────────────────────────────────────

  const startSettingsTour = async () => {
    if (!process.client) return
    clearPendingStep()
    const d = await createDriver()

    d.setSteps([
      {
        element: '#tour-settings-tabs',
        popover: {
          title: '⚙️ Paramètres',
          description:
            'Naviguez entre ces onglets pour gérer les informations générales, inviter des membres, ou configurer vos étiquettes et rappels.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-settings-members-tab',
        popover: {
          title: '✉️ Inviter des Membres',
          description:
            'Dans l\'onglet Membres, vous pouvez inviter de nouveaux collaborateurs à rejoindre votre organisation. Notez que seul le créateur, un propriétaire ou un administrateur possède les droits nécessaires pour envoyer des invitations.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        popover: {
          title: '🎉 Vous êtes prêt !',
          description:
            'Vous avez parcouru toute la plateforme ! Retrouvez ce guide à tout moment depuis votre profil en cliquant sur "Relancer le guide". Bonne productivité 🚀',
          side: 'over' as any,
          align: 'center',
          onNextClick: () => {
            markTourCompleted()
            d.destroy()
          },
        },
      },
    ])
    d.drive()
  }

  // ─── Cross-page dispatcher ────────────────────────────────────────────────

  /**
   * Call this in onMounted on every page that participates in Phase 2.
   * Checks localStorage for the pending step and launches the correct sub-tour.
   */
  const continueTourIfPending = async (page: TourPage) => {
    if (!process.client) return
    const pending = getPendingStep()
    if (pending !== page) return

    setTimeout(async () => {
      if (page === 'dashboard')      await startDashboardTour()
      else if (page === 'projects')  await startProjectsTour()
      else if (page === 'tasks')     await startTasksTour()
      else if (page === 'calendar')  await startCalendarTour()
      else if (page === 'team')      await startTeamTour()
      else if (page === 'notifications') await startNotificationsTour()
      else if (page === 'workspaces') await startWorkspacesTour()
      else if (page === 'settings') await startSettingsTour()
    }, 900)
  }

  // ─── Phase 2 entry (from custom layout on first org entry) ────────────────

  const startPhase2Tour = async () => {
    if (!process.client) return
    setPendingStep('dashboard')
    setTimeout(async () => startDashboardTour(), 900)
  }

  // ─── Replay from Profile page ─────────────────────────────────────────────

  const restartTour = () => {
    if (!process.client) return
    resetTourFlag()
    navigateTo('/organizations')
  }

  return {
    isTourCompleted,
    startPhase1Tour,
    startPhase2Tour,
    startDashboardTour,
    startProjectsTour,
    startTasksTour,
    startCalendarTour,
    startTeamTour,
    startNotificationsTour,
    startWorkspacesTour,
    startSettingsTour,
    continueTourIfPending,
    restartTour,
    markTourCompleted,
    resetTourFlag,
  }
}
