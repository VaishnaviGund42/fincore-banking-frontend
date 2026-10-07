import { Link } from 'react-router-dom'

function Brand({ className = '' }) {
  return (
    <Link className={`brand ${className}`} to="/login" aria-label="FinCore home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none">
          <path d="M4 18.5h16M6.5 15V9.5M12 15V5.5M17.5 15v-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m5 7 6.8-3 7.2 2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="brand-name">FinCore</span>
    </Link>
  )
}

function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div className="aside-copy">
          <p className="aside-kicker">Banking, with clarity</p>
          <h2>Your money.<br />Moving forward.</h2>
          <p>A thoughtful way to manage your finances, built around what matters to you.</p>
        </div>
        <div className="aside-footer">A more considered banking experience.</div>
      </aside>

      <main className="auth-main">
        <section className="auth-content" aria-labelledby="auth-title">
          <Brand className="mobile-brand" />
          <p className="form-eyebrow">{eyebrow}</p>
          <h1 className="auth-title" id="auth-title">{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
          {footer}
          <div className="security-note">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
              <path d="M8 1.8 13 3.7v3.7c0 3.2-2.1 5.5-5 6.8-2.9-1.3-5-3.6-5-6.8V3.7l5-1.9Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="m5.8 7.9 1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Your information is protected with secure encryption
          </div>
        </section>
      </main>
    </div>
  )
}

export default AuthLayout
