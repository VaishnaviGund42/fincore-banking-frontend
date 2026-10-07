import api from './api.js'

export async function login(credentials) {
  const response = await api.post('/api/auth/login', credentials)
  return response.data
}

export async function register(userDetails) {
  const response = await api.post('/api/auth/register', userDetails)
  return response.data
}

export function getApiErrorMessage(error, fallback) {
  const responseData = error.response?.data

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData
  }

  if (responseData?.message) {
    return responseData.message
  }

  if (responseData?.messages && typeof responseData.messages === 'object') {
    return Object.values(responseData.messages).filter(Boolean).join(' ')
  }

  if (!error.response) {
    return 'Unable to connect to FinCore. Check that the API is running at http://localhost:8080.'
  }

  return fallback
}
