import { ref } from 'vue'

export default function useWorkspaces() {
  const { $api } = useNuxtApp()
  const activeWorkspace = useState<any>('activeWorkspace', () => null)
  const workspaces = ref<any[]>([])

  const getWorkspaces = async (orgId: string) => {
    try {
      const response = await $api<any>(`/workspaces?organization_id=${orgId}`)
      workspaces.value = response.data?.data || response.data || []
      return workspaces.value
    } catch (error) {
      console.error('Failed to fetch workspaces:', error)
      throw error
    }
  }

  const getWorkspace = async (id: string) => {
    try {
      const response = await $api<any>(`/workspaces/${id}`)
      return response.data?.workspace || response.workspace || response.data
    } catch (error) {
      console.error('Failed to fetch workspace details:', error)
      throw error
    }
  }

  const createWorkspace = async (name: string, description: string, orgId: string) => {
    try {
      const response = await $api<any>('/workspaces', {
        method: 'POST',
        body: { name, description, organization_id: orgId },
      })
      return response.data?.workspace || response.workspace || response.data
    } catch (error) {
      console.error('Failed to create workspace:', error)
      throw error
    }
  }

  const updateWorkspace = async (id: string, updates: any) => {
    try {
      const response = await $api<any>(`/workspaces/${id}`, {
        method: 'PUT',
        body: updates,
      })
      return response.data?.workspace || response.workspace || response.data
    } catch (error) {
      console.error('Failed to update workspace:', error)
      throw error
    }
  }

  const deleteWorkspace = async (id: string) => {
    try {
      await $api(`/workspaces/${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Failed to delete workspace:', error)
      throw error
    }
  }

  const setActiveWorkspace = (workspace: any) => {
    activeWorkspace.value = workspace
  }

  const addMember = async (workspaceId: string, userId: string, role: string = 'member') => {
    try {
      await $api(`/workspaces/${workspaceId}/members`, {
        method: 'POST',
        body: { user_id: userId, role }
      })
    } catch (error) {
      console.error('Failed to add member:', error)
      throw error
    }
  }

  const removeMember = async (workspaceId: string, userId: string) => {
    try {
      await $api(`/workspaces/${workspaceId}/members/${userId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Failed to remove member:', error)
      throw error
    }
  }

  const getWorkspaceTeams = async (workspaceId: string) => {
    try {
      const data = await $api<{ data: any[] } | any>(`/workspaces/${workspaceId}/teams`, { method: 'GET' })
      return data.data ?? data
    } catch (error) {
      console.error('Failed to fetch workspace teams:', error)
      throw error
    }
  }

  const createWorkspaceTeam = async (workspaceId: string, name: string, description?: string) => {
    try {
      const data = await $api<{ team: any } | any>(`/workspaces/${workspaceId}/teams`, {
        method: 'POST',
        body: { name, description }
      })
      return data.team ?? data
    } catch (error) {
      console.error('Failed to create workspace team:', error)
      throw error
    }
  }

  const attachWorkspaceTeam = async (workspaceId: string, teamId: string) => {
    try {
      const data = await $api<{ team: any } | any>(`/workspaces/${workspaceId}/teams/attach`, {
        method: 'POST',
        body: { team_id: teamId }
      })
      return data.team ?? data
    } catch (error) {
      console.error('Failed to attach workspace team:', error)
      throw error
    }
  }

  const detachWorkspaceTeam = async (workspaceId: string, teamId: string) => {
    try {
      await $api(`/workspaces/${workspaceId}/teams/${teamId}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Failed to detach workspace team:', error)
      throw error
    }
  }

  const updateKanbanColumns = async (id: string, columns: string[], colors?: Record<string, string>, renames?: Record<string, string>) => {
    try {
      const payload: any = { kanban_columns: columns, renames: renames || {} }
      if (colors) {
        payload.kanban_colors = colors
      }
      
      const data = await $api<{ kanban_columns: string[], kanban_colors?: Record<string, string> } | any>(`/workspaces/${id}/kanban-columns`, {
        method: 'PUT',
        body: payload
      })
      // Update local state if it's the active workspace
      if (activeWorkspace.value && String(activeWorkspace.value.id) === String(id)) {
        activeWorkspace.value.kanban_columns = data.kanban_columns
        if (data.kanban_colors) {
          activeWorkspace.value.kanban_colors = data.kanban_colors
        }
      }
      return data
    } catch (error) {
      console.error('Failed to update workspace kanban columns:', error)
      throw error
    }
  }

  return {
    workspaces,
    activeWorkspace,
    getWorkspaces,
    getWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setActiveWorkspace,
    addMember,
    removeMember,
    getWorkspaceTeams,
    createWorkspaceTeam,
    attachWorkspaceTeam,
    detachWorkspaceTeam,
    updateKanbanColumns
  }
}
