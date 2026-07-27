export interface Organization {
  id: string | number;
  name: string;
  description?: string;
  logo?: string;
  primary_color?: string;
  owner_id?: number | string;
  reminder_days_before_start?: number;
  reminder_days_before_end?: number;
  reminder_time_start?: string;
  reminder_time_end?: string;
  kanban_columns?: string[];
  kanban_colors?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export default function useOrganizations() {
  const organizations = useState<Organization[]>('organizations', () => []);
  const activeOrganization = useCookie<Organization | null>('active_organization', { default: () => null, watch: true, sameSite: 'lax' });

  // Auto-recover corrupted cookie states from previous bugs
  if (activeOrganization.value && (activeOrganization.value as any).organization) {
    activeOrganization.value = (activeOrganization.value as any).organization;
  }
  
  if (activeOrganization.value && (activeOrganization.value as any).data) {
    activeOrganization.value = (activeOrganization.value as any).data;
  }

  const getOrganizations = async () => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: Organization[] } | any>('/organizations', {
        method: 'GET'
      });
      // Handle both paginated and non-paginated responses
      organizations.value = data.data?.data ?? data.data ?? data;
      return organizations.value;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const getOrganization = async (id: number | string) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: Organization } | any>(`/organizations/${id}`, {
        method: 'GET'
      });
      return data.organization ?? data.data ?? data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const createOrganization = async (payload: Partial<Organization>) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: Organization } | any>('/organizations', {
        method: 'POST',
        body: payload
      });
      return data.organization ?? data.data ?? data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateOrganization = async (id: number | string, payload: Partial<Organization>) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: Organization } | any>(`/organizations/${id}`, {
        method: 'PUT',
        body: payload
      });
      return data.organization ?? data.data ?? data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const deleteOrganization = async (id: number | string) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ message: string } | any>(`/organizations/${id}`, {
        method: 'DELETE'
      });
      organizations.value = organizations.value.filter(org => String(org.id) !== String(id));
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const setActiveOrganization = (org: Organization | null) => {
    activeOrganization.value = org;
  };

  const uploadLogo = async (id: number | string, file: File) => {
    try {
      const { $api } = useNuxtApp();
      const formData = new FormData();
      formData.append('logo', file);
      
      const data = await $api<{ organization: Organization } | any>(`/organizations/${id}/logo`, {
        method: 'POST',
        body: formData
      });
      return data.organization ?? data.data ?? data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateKanbanColumns = async (id: number | string, columns: string[], colors?: Record<string, string>, renames?: Record<string, string>) => {
    try {
      const { $api } = useNuxtApp();
      const payload: any = { kanban_columns: columns, renames: renames || {} };
      if (colors) {
        payload.kanban_colors = colors;
      }
      
      const data = await $api<{ kanban_columns: string[], kanban_colors?: Record<string, string> } | any>(`/organizations/${id}/kanban-columns`, {
        method: 'PUT',
        body: payload
      });
      // Update local state if it's the active org
      if (activeOrganization.value && String(activeOrganization.value.id) === String(id)) {
        activeOrganization.value.kanban_columns = data.kanban_columns;
        if (data.kanban_colors) {
          activeOrganization.value.kanban_colors = data.kanban_colors;
        }
      }
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const getMembers = async (orgId: number | string) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: any[] } | any>(`/organizations/${orgId}/members`, {
        method: 'GET'
      });
      return data.data ?? data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const removeMember = async (orgId: number | string, userId: number | string) => {
    try {
      const { $api } = useNuxtApp();
      await $api(`/organizations/${orgId}/members/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateMemberRole = async (orgId: number | string, userId: number | string, role: string) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api(`/organizations/${orgId}/members/${userId}`, {
        method: 'PUT',
        body: { role }
      });
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return {
    organizations,
    activeOrganization,
    getOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    setActiveOrganization,
    uploadLogo,
    getMembers,
    removeMember,
    updateMemberRole,
    updateKanbanColumns
  };
}
