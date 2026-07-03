
interface User {
  id: number
  name: string
  email: string
  bio: string
  email_verified_at: string
  created_at: string
  updated_at: string
  profile_picture?: string
  role?: string // e.g. 'owner', 'member', 'admin'
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
  
  // Basic RBAC properties
  const isOwner = computed(() => user.value?.role === 'owner')
  const isMember = computed(() => user.value?.role === 'member')

  const formatUser = (u: User | null) => {
    if (u && u.profile_picture && !u.profile_picture.startsWith('http')) {
      u.profile_picture = `http://localhost:8000${u.profile_picture}`
    }
    return u
  }

  const setAuth = (authUser: User | null, authToken: string | null) => {
    user.value = formatUser(authUser)
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

      user.value = formatUser(data.user)
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
      const data = await $api<{ user: User; message: string }>('/api/users/profile', {
        method: 'PUT',
        body: { name, email, bio },
        headers: {Authorization: `Bearer ${token.value}`},
      })

      user.value = formatUser(data.user)
      return data
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  const uploadProfilePicture = async (file: File) => {
    if (!token.value) {
      return null
    }

    const { $api } = useNuxtApp()
    const formData = new FormData()
    formData.append('profile_picture', file)

    try {
      const data = await $api<{ user: User; message: string }>('/api/users/profile-picture', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token.value}` },
      })

      user.value = formatUser(data.user)
      return data
    } catch (error) {
      console.error('Failed to upload profile picture:', error)
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

  const verifyEmail = async (verifyUrl: string) => {
    const { $api } = useNuxtApp()
    try {
      // The verifyUrl might be a full URL, we extract the path
      let endpoint = verifyUrl;
      try {
          const urlObj = new URL(verifyUrl);
          endpoint = urlObj.pathname + urlObj.search;
      } catch (e) {
          // If it's not a full URL, use it as is
      }
      
      const data = await $api<{ message: string, success: boolean }>(endpoint, {
        method: 'GET',
      })
      // If successful, update the user state
      if (user.value) {
        user.value.email_verified_at = new Date().toISOString()
      }
      return data
    } catch (error) {
      console.error('Email verification failed:', error)
      throw error
    }
  }

  const resendVerificationEmail = async () => {
    const { $api } = useNuxtApp()
    try {
      const data = await $api<{ message: string, success: boolean }>('/api/email/verification-notification', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` }
      })
      return data
    } catch (error) {
      console.error('Failed to resend verification email:', error)
      throw error
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isOwner,
    isMember,
    login,
    signup,
    logout,
    getProfile,
    updateProfile,
    uploadProfilePicture,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
  }
}