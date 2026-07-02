export interface Organization {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function useOrganizations() {
  const organizations = useState<Organization[]>('organizations', () => []);
  const activeOrganization = useState<Organization | null>('active_organization', () => null);

  const getOrganizations = async () => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: Organization[] } | any>('/api/organizations', {
        method: 'GET'
      });
      organizations.value = data.data ?? data;
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
      return data.data ?? data;
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
      return data.data ?? data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateOrganization = async (id: number | string, name: string, description?: string) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: Organization } | any>(`/api/organizations/${id}`, {
        method: 'PUT',
        body: { name, description }
      });
      return data.data ?? data;
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

  return {
    organizations,
    activeOrganization,
    getOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    setActiveOrganization
  };
}
