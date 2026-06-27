
interface User {
  id: number
  name: string
  email: string
  bio: string
  email_verified_at: string
  created_at: string
  updated_at: string
}

export default function useAuth() {
  const user = useState<User | null>('auth_user', () => null)
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: process.client ? window.location.protocol === 'https:' : false,
  })

  const isAuthenticated = computed(() => Boolean(token.value))

  const setAuth = (authUser: User | null, authToken: string | null) => {
    user.value = authUser
    token.value = authToken
  }

  const login = async (email: string, password: string) => {
    const { $api } = useNuxtApp()

    const data = await $api<{ user: User; token: string; message: string }>('/api/login', {
      method: 'POST',
      body: { email, password },
    })

    setAuth(data.user, data.token)
    return data.message
  }

  const signup = async (name: string, email: string, password: string) => {
    const { $api } = useNuxtApp()

    const data = await $api<{ user: User; token: string; message: string }>('/api/signup', {
      method: 'POST',
      body: { name, email, password },
    })

    setAuth(data.user, data.token)
    return data
  }

  const logout = async () => {
    const { $api } = useNuxtApp()

    try {
      if (token.value) {
        await $api<{ message: string }>('/api/logout', {
          method: 'POST',
        })
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setAuth(null, null)
    }
  }

  const getProfile = async () => {
    if (!token.value) {
      setAuth(null, null)
      return null
    }

    const { $api } = useNuxtApp()

    try {
      const data = await $api<{ user: User; message: string }>('/api/me', {
        method: 'GET',
        headers: {Authorization: `Bearer ${token.value}`},
      })

      user.value = data.user
      return data
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      setAuth(null, null)
      throw error
    }
  }

  const updateProfile = async (name: string, email: string, bio: string) => {
    if (!token.value) {
      return null
    }

    const { $api } = useNuxtApp()

    try {
      const data = await $api<{ user: User; message: string }>('/api/update', {
        method: 'PUT',
        body: { name, email, bio },
      })

      user.value = data.user
      return data
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  /**
   * Send a password reset link to the given email.
   */
  const forgotPassword = async (email: string) => {
    const { $api } = useNuxtApp()

    const data = await $api<{ message: string }>('/api/forgot-password', {
      method: 'POST',
      body: { email },
    })

    return data.message
  }

  /**
   * Reset the password using the token received by email.
   */
  const resetPassword = async (
    tokenValue: string,
    email: string,
    password: string,
    password_confirmation: string
  ) => {
    const { $api } = useNuxtApp()

    const data = await $api<{ message: string }>('/api/reset-password', {
      method: 'POST',
      body: { token: tokenValue, email, password, password_confirmation },
    })

    return data.message
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    signup,
    logout,
    getProfile,
    updateProfile,
    forgotPassword,
    resetPassword,
  }
}