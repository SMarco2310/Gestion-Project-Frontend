// plugins/api.ts
export default defineNuxtPlugin(() => {
  const token = useCookie('auth_token')

  const USE_MOCK_DATA = false; // Set to false to revert to real API

  const mockUser = {
    id: 1, name: 'Test User', email: 'test@example.com', bio: 'Mocked user profile', profile_picture: '', role: 'member' // Change to 'owner' to test owner features
  };

  // Generic mock fetch function
  const mockApi = async <T = any>(url: string, options: any = {}): Promise<T> => {
    console.log('[MOCK API]', options.method || 'GET', url);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network latency

    if (url.includes('/login') || url.includes('/me') || url.includes('/update') || url.includes('/signup')) {
      return { user: mockUser, token: 'mock-token', message: 'Success' } as any;
    }
    
    if (url.includes('/invitations')) {
      return {
        invitations: [
          { id: 1, organization: { id: 2, name: 'Global Industries' }, role: 'member', status: 'pending' }
        ]
      } as any;
    }
    
    if (url.includes('/projets')) {
      const mockProject = { id: 1, name: 'Projet Alpha', description: 'Description alpha', reference_code: 'P-01', status: 'en cours', start_date: '2026-07-01', end_date: '2026-07-15' };
      return { 
        projets: [mockProject, { ...mockProject, id: 2, name: 'Projet Beta', reference_code: 'P-02', status: 'à faire' }],
        projet: mockProject,
        success: true 
      } as any;
    }
    
    if (url.includes('/taches')) {
      const urlObj = new URL(url, 'http://localhost');
      const projetIdStr = urlObj.searchParams.get('projet_id');

      let tasksList = [
        { id: 1, title: 'Tâche 1 (Projet 1)', description: 'Description', status: 'à faire', priority: 'moyen', projet_id: 1, reference_code: 'T-01' },
        { id: 2, title: 'Tâche 2 (Projet 1)', description: 'Description', status: 'en cours', priority: 'haute', projet_id: 1, reference_code: 'T-02' },
        { id: 3, title: 'Tâche 3 (Projet 2)', description: 'Description', status: 'à faire', priority: 'basse', projet_id: 2, reference_code: 'T-03' },
        { id: 4, title: 'Tâche 4 (Projet 2)', description: 'Description', status: 'terminé', priority: 'haute', projet_id: 2, reference_code: 'T-04' },
      ];

      if (projetIdStr) {
        tasksList = tasksList.filter(t => String(t.projet_id) === projetIdStr);
      }

      return {
        tasks: tasksList,
        tache: tasksList[0] || {},
        task: tasksList[0] || {}
      } as any;
    }
    
    if (url.includes('/organizations')) {
      return {
        organizations: [{ id: 1, name: 'Organisation Mock' }],
        organization: { id: 1, name: 'Organisation Mock' }
      } as any;
    }
    
    if (url.includes('/teams')) {
      return {
        teams: [{ id: 1, name: 'Team Alpha', organization_id: 1 }],
        team: { id: 1, name: 'Team Alpha', organization_id: 1 }
      } as any;
    }

    if (url.includes('/tags')) {
      return [{ id: 1, name: 'Bug', color: '#ff0000' }, { id: 2, name: 'Feature', color: '#00ff00' }] as any;
    }

    if (url.includes('/users/')) {
      return {
        user: { id: parseInt(url.split('/').pop() || '1'), name: 'Alice Smith', email: 'alice@example.com', bio: 'Développeuse Frontend passionnée.', role: 'Membre', created_at: '2025-01-01' }
      } as any;
    }

    // Default fallback
    return { success: true, message: 'Mocked request' } as any;
  };

  const api = (USE_MOCK_DATA ? mockApi : $fetch.create({
    baseURL: 'http://localhost:8000/',
    onRequest({ options }) {
      if (token.value) {
        options.headers.set('Authorization', `Bearer ${token.value}`)
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        token.value = null
        // navigateTo('/auth/login') // Uncomment when reverting mock
      }
    },
  })) as typeof $fetch

  return { provide: { api } }
})