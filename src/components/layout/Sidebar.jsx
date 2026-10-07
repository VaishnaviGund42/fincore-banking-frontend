import { Link, NavLink } from 'react-router-dom'

const items = [
  { label: 'Dashboard', to: '/dashboard', icon: 'grid', end: true },
  { label: 'Accounts', to: '/accounts', icon: 'wallet' },
  { label: 'Beneficiaries', to: '/beneficiaries', icon: 'users' },
  { label: 'Fund transfer', to: '/transfer', icon: 'transfer' },
  { label: 'Transactions', to: '/transactions', icon: 'list' },
  { label: 'Profile', to: '/profile', icon: 'user' },
]

const icons = {
  brand: <><path d="M4 18.5h16M6.5 15V9.5M12 15V5.5M17.5 15v-3.5" /><path d="m5 7 6.8-3 7.2 2.7" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18M16 14h2" /><path d="M6 5V3h12v2" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  transfer: <><path d="M7 7h14l-4-4M17 17H3l4 4" /><path d="M21 7H7M3 17h14" /></>,
  list: <><path d="M9 6h12M9 12h12M9 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
}

export function Icon({ name, size = 19 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  )
}

function Sidebar({ onLogout }) {
  return (
    <aside className="banking-sidebar">
      <Link className="banking-brand" to="/dashboard" aria-label="FinCore dashboard">
        <span className="banking-brand-mark"><Icon name="brand" size={21} /></span>
        <span>FinCore</span>
      </Link>
      <div className="sidebar-section-label">Workspace</div>
      <nav className="banking-nav" aria-label="Main navigation">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `banking-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-secure"><Icon name="shield" size={17} /><span>Secure banking</span></div>
        <button className="logout-button" aria-label="Logout" title="Logout" onClick={onLogout} type="button">
          <Icon name="logout" /><span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
