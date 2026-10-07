import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import FormField from '../../components/auth/FormField.jsx'
import { getApiErrorMessage, register } from '../../services/auth.js'
import { getAuthToken } from '../../utils/authSession.js'

function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (getAuthToken()) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const message = await register({ fullName, email, password })
      navigate('/login', {
        replace: true,
        state: {
          registrationSuccess: typeof message === 'string' && message.trim()
            ? message
            : 'Registration successful. You can now sign in.',
        },
      })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to create your account. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      description="A few details are all you need to get started with FinCore."
      footer={(
        <p className="auth-switch">
          Already have an account?
          <Link to="/login">Sign in</Link>
        </p>
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-alert" role="alert">{error}</p>}
        <FormField
          id="fullName"
          label="Full name"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Your full name"
          autoComplete="name"
        />
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
          placeholder="Create a password"
          autoComplete="new-password"
        />
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? 'Creating your account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Register
