export default defineNuxtRouteMiddleware((to, from) => {
  const { organizations, activeOrganization } = useOrganizations()
  const orgId = to.params.org_id

  if (!orgId) {
    return // Not an organization route
  }

  // Ensure organizations are loaded (they should be via auth initialization)
  if (!organizations.value || organizations.value.length === 0) {
    return
  }

  // Verify the user belongs to this org
  const org = organizations.value.find(o => String(o.id) === String(orgId))
  
  if (!org) {
    return navigateTo('/') // Redirect to home/landing
  }

  // Sync state with URL
  if (!activeOrganization.value || String(activeOrganization.value.id) !== String(orgId)) {
    activeOrganization.value = org
  }
})
