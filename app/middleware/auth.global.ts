export default defineNuxtRouteMiddleware(async (to) => {
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
  })

  const { user, getProfile, setAuth } = useAuth()

  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forget-password', '/auth/reset-password', '/auth/verify-email']
  const isPublicRoute = publicRoutes.includes(to.path) || to.path === '/'
  const isInviteRoute = to.path.startsWith('/invite')

  if (!token.value && !isPublicRoute && !isInviteRoute) {
    return navigateTo('/auth/login')
  }

  // Hydrate user state if token exists but user is not loaded
  if (token.value && !user.value) {
    try {
      await getProfile()
    } catch (error) {
      // Token is likely expired or invalid
      token.value = null
      setAuth(null, null)
      if (to.path !== '/auth/login') {
        return navigateTo('/auth/login')
      }
    }
  }

  // Only run authenticated checks if user was successfully loaded
  if (token.value && user.value) {
    // Ensure user has an active organization before accessing protected routes (except profile and invite)
    if (!isPublicRoute && !to.path.startsWith('/organizations') && !to.path.startsWith('/profile') && !isInviteRoute) {
      const { activeOrganization } = useOrganizations()
      if (!activeOrganization.value) {
        return navigateTo('/organizations')
      }
    }

    if (isPublicRoute && to.path !== '/auth/verify-email') {
      const { activeOrganization } = useOrganizations()
      if (activeOrganization.value) {
        return navigateTo(`/organization/${activeOrganization.value.id}`)
      }
      return navigateTo('/organizations')
    }
  }
})