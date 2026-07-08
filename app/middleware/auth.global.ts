export default defineNuxtRouteMiddleware(async (to) => {
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
  })

  const { user, getProfile } = useAuth()

  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forget-password', '/auth/reset-password']
  const isPublicRoute = publicRoutes.includes(to.path) || to.path === '/'
  const isInviteRoute = to.path.startsWith('/invite')

  if (!token.value && !isPublicRoute && !isInviteRoute) {
    return navigateTo('/auth/login')
    // return navigateTo('/organisations')

  }

  // Hydrate user state if token exists but user is not loaded
  if (token.value && !user.value) {
    try {
      await getProfile()
    } catch (error) {
      // Token is likely expired or invalid
      token.value = null
      return navigateTo('/auth/login')
    }
  }

  // Ensure user has an active organization before accessing protected routes (except profile and invite)
  if (token.value && !isPublicRoute && !to.path.startsWith('/organizations') && !to.path.startsWith('/profile') && !isInviteRoute) {
    const { activeOrganization } = useOrganizations()
    if (!activeOrganization.value) {
      return navigateTo('/organizations')
    }
  }

  if (token.value && isPublicRoute) {
    return navigateTo('/dashboard')
  }
  
})