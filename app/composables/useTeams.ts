export interface Team {
  id: string | number;
  name: string;
  description?: string;
  reference_code?: string;
  organization_id: string | number;
  created_at: string;
  updated_at: string;
}

export default function useTeams() {
  const teams = useState<Team[]>('teams', () => []);

  const getTeams = async (orgId: number | string) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: Team[] } | any>(`/organizations/${orgId}/teams`, {
        method: 'GET'
      });
      teams.value = data.data ?? data;
      return teams.value;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const getTeam = async (orgId: number | string, teamId: number | string) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: Team } | any>(`/organizations/${orgId}/teams/${teamId}`, {
        method: 'GET'
      });
      return data.data ?? data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const createTeam = async (orgId: number | string, name: string, description?: string) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: Team } | any>(`/organizations/${orgId}/teams`, {
        method: 'POST',
        body: { name, description }
      });
      return data.data ?? data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateTeam = async (orgId: number | string, teamId: number | string, name: string, description?: string) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ data: Team } | any>(`/organizations/${orgId}/teams/${teamId}`, {
        method: 'PUT',
        body: { name, description }
      });
      return data.data ?? data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const deleteTeam = async (orgId: number | string, teamId: number | string) => {
    try {
      const { $api } = useNuxtApp();
      const data = await $api<{ message: string } | any>(`/organizations/${orgId}/teams/${teamId}`, {
        method: 'DELETE'
      });
      teams.value = teams.value.filter(team => String(team.id) !== String(teamId));
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return {
    teams,
    getTeams,
    getTeam,
    createTeam,
    updateTeam,
    deleteTeam
  };
}
