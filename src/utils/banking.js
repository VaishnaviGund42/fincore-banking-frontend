import { getApiErrorMessage } from '../services/auth.js'

export const getCustomerId = () => localStorage.getItem('customerId')

export const toArray = (data) => Array.isArray(data) ? data : []

export const formatMoney = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(Number(amount || 0))

export const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export const errorMessage = (error, fallback) => getApiErrorMessage(error, fallback)

export const maskAccount = (accountNumber) => {
  const value = String(accountNumber || '')
  return value.length > 4 ? `•••• ${value.slice(-4)}` : value
}
