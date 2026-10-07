export function getAuthToken() {
  return localStorage.getItem('token')?.trim() || null
}

export function clearAuthSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('email')
  localStorage.removeItem('role')
  localStorage.removeItem('customerId')
}
