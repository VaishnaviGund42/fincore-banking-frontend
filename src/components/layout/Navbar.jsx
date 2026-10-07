import { Link } from 'react-router-dom'
import { Icon } from './Sidebar.jsx'

function Navbar({ email, role, onLogout }) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-title">
        <Link className="mobile-header-brand" to="/dashboard" aria-label="FinCore dashboard">
          <span className="banking-brand-mark"><Icon name="brand" size={19} /></span>
          <span>FinCore</span>
        </Link>
      </div>
      <div className="navbar-user">
        <div className="header-account">
          <span className="avatar" aria-hidden="true">{email.slice(0, 1).toUpperCase() || 'U'}</span>
          <span className="header-user-details">
            <span className="header-email">{email}</span>
            <span className="header-role">{role || 'Customer'}</span>
          </span>
        </div>
        <button className="navbar-logout" onClick={onLogout} type="button">
          <Icon name="logout" size={17} />
          <span>Log out</span>
        </button>
      </div>
    </header>
  )
}

export default Navbar
