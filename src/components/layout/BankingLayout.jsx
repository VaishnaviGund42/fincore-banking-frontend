import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar.jsx'
import Sidebar, { Icon } from './Sidebar.jsx'
import { clearAuthSession } from '../../utils/authSession.js'

export function PageHeading({ eyebrow, title, children }) {
  return (
    <div className="page-heading">
      <div>
        <p className="section-overline">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  )
}

export function LoadingMessage({ children = 'Loading your information…' }) {
  return <div className="state-card" role="status"><span className="spinner dark-spinner" />{children}</div>
}

export function ErrorMessage({ children }) {
  return <p className="form-alert" role="alert">{children}</p>
}

export function EmptyState({ title, children }) {
  return <div className="empty-state"><span className="empty-state-icon"><Icon name="wallet" size={21} /></span><strong>{title}</strong><p>{children}</p></div>
}

function BankingLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = localStorage.getItem('email') || 'FinCore customer'
  const role = localStorage.getItem('role') || 'Customer'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  function logout() {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="banking-layout">
      <Sidebar onLogout={logout} />
      <main className="banking-main">
        <Navbar email={email} role={role} onLogout={logout} />
        <div className="banking-page-content"><Outlet /></div>
        <footer className="dashboard-footer">
          <Icon name="shield" size={15} /><span>Your connection to FinCore is protected</span>
          <button onClick={logout} type="button">Log out</button>
        </footer>
      </main>
    </div>
  )
}

export default BankingLayout
