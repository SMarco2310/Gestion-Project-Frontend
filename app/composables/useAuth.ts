// composables/useAuth.ts

interface User {
  id: string;
  email: string;
  nom: string;
  emailVerified: boolean;
  avatar: string | null;
}

// This runs ONCE per server request (SSR) or once on the client.
// If you want global shared state, this is correct.
const user = useState<User | null>('auth_user', () => null)
const token = useState<string | null>('auth_token', () => null)

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value)

  async function login(email: string, password: string) {
    const { data, error } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    if (error.value) throw error.value
    user.value = data.value as User
    // token.value = data.value.token
    return data.value
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const data = await $fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      user.value = data as User
    } catch {
      token.value = null
      user.value = null
    }
  }


  function logout() {
    user.value = null
    navigateTo('/auth/login')
  }

  return { user, isLoggedIn, token, login, fetchUser, logout }
}