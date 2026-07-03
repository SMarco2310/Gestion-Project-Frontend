export interface Organization {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  reminder_days_before_start?: number;
  reminder_days_before_end?: number;
  reminder_time_start?: string;
  reminder_time_end?: string;
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
      const data = await $api<{ data: Organization[] } | any>('/api/organizations', {
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
      const data = await $api<{ data: Organization } | any>(`/api/organizations/${id}`, {
        method: 'GET'
      });
      return data.organization ?? data.data ?? data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const createOrganization = async (name: string, description?: string) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: Organization } | any>('/api/organizations', {
        method: 'POST',
        body: { name, description }
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
      const data = await $api<{ data: Organization } | any>(`/api/organizations/${id}`, {
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
      const data = await $api<{ message: string } | any>(`/api/organizations/${id}`, {
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
      
      const data = await $api<{ organization: Organization } | any>(`/api/organizations/${id}/logo`, {
        method: 'POST',
        body: formData
      });
      return data.organization ?? data.data ?? data;
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
    uploadLogo
  };
}
