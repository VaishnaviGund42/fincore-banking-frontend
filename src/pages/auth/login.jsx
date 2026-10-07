import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import FormField from '../../components/auth/FormField.jsx'
import { getApiErrorMessage, login } from '../../services/auth.js'
import { getAuthToken } from '../../utils/authSession.js'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const registrationSuccess = location.state?.registrationSuccess

  if (getAuthToken()) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login({ email, password })

      if (!result?.token) {
        throw new Error('The authentication response did not contain a token.')
      }

      localStorage.setItem('token', result.token)
      localStorage.setItem('email', result.email || email)
      localStorage.setItem('role', result.role || '')
      const returnTo = location.state?.from
      const destination = returnTo?.pathname?.startsWith('/')
        ? `${returnTo.pathname}${returnTo.search || ''}${returnTo.hash || ''}`
        : '/dashboard'
      navigate(destination, { replace: true })
    } catch (requestError) {
      const message = requestError.message === 'The authentication response did not contain a token.'
        ? requestError.message
        : getApiErrorMessage(requestError, 'Unable to sign in. Please try again.')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to FinCore"
      description="Enter your details to securely access your account."
      footer={(
        <p className="auth-switch">
          New to FinCore?
          <Link to="/register">Create an account</Link>
        </p>
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {registrationSuccess && <p className="form-alert form-alert-success" role="status">{registrationSuccess}</p>}
        {error && <p className="form-alert" role="alert">{error}</p>}
        <FormField
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? 'Signing in…' : 'Sign in securely'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Login