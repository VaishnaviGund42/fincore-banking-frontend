import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorMessage, LoadingMessage, PageHeading } from '../components/layout/BankingLayout.jsx'
import api from '../services/api.js'
import { errorMessage, getCustomerId } from '../utils/banking.js'

const emptyProfile = {
  fullName: '',
  email: localStorage.getItem('email') || '',
  phone: '',
  address: '',
  panNumber: '',
  aadhaarNumber: '',
}

function Profile() {
  const [customerId, setCustomerId] = useState(getCustomerId)
  const [reloadKey, setReloadKey] = useState(0)
  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(Boolean(customerId))
  const [profileLoadFailed, setProfileLoadFailed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const email = localStorage.getItem('email') || ''
  const role = localStorage.getItem('role') || 'Customer'

  useEffect(() => {
    if (!customerId) return undefined

    let active = true
    api.get(`/api/customers/${customerId}`)
      .then(({ data }) => {
        if (active) setProfile(data)
      })
      .catch((requestError) => {
        if (active) {
          setProfileLoadFailed(true)
          setError(errorMessage(requestError, 'Unable to load your customer profile.'))
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [customerId, reloadKey])

  function updateField(event) {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function saveProfile(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    const payload = {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      panNumber: profile.panNumber,
      aadhaarNumber: profile.aadhaarNumber,
    }
    try {
      if (customerId) {
        const { data } = await api.put(`/api/customers/${customerId}`, payload)
        setProfile(data)
        setSuccess('Your profile has been updated.')
      } else {
        const { data } = await api.post('/api/customers', payload)
        localStorage.setItem('customerId', String(data.id))
        setLoading(true)
        setProfileLoadFailed(false)
        setCustomerId(String(data.id))
        setSuccess('Your profile is ready. Your account information is now linked.')
      }
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to save your profile.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingMessage>Loading your profile…</LoadingMessage>

  return (
    <div className="page-stack">
      <PageHeading eyebrow="YOUR INFORMATION" title="Profile" />
      <section className="profile-identity-card" aria-label="Signed-in account">
        <div className="profile-identity-avatar" aria-hidden="true">{email.slice(0, 1).toUpperCase() || 'U'}</div>
        <div><span>FINCORE LOGIN</span><strong>{email || 'Email unavailable'}</strong><small>Role: {role}</small></div>
        <span className="status-pill active">Signed in</span>
      </section>
      {customerId ? (
        <>
          <div className="data-unavailable-card profile-notice"><span className="unavailable-icon">i</span><div><h3>Your FinCore customer profile</h3><p>Your customer record is loaded using the ID returned when you created it in this browser. The API currently does not associate registered user accounts with customer records automatically.</p></div></div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {profileLoadFailed ? (
            <div className="profile-load-failed">
              <p>Customer details are unavailable. Editing is disabled until the existing record loads successfully.</p>
              <button className="button-secondary" type="button" onClick={() => {
                setError('')
                setLoading(true)
                setProfileLoadFailed(false)
                setReloadKey((current) => current + 1)
              }}>Retry loading profile</button>
            </div>
          ) : (
            <>
              {success && <p className="form-alert form-alert-success" role="status">{success}</p>}
              <form className="form-panel banking-form" onSubmit={saveProfile}>
                <h3>Personal details</h3>
                <label>Full name<input name="fullName" value={profile.fullName || ''} onChange={updateField} required /></label>
                <label>Email address<input type="email" name="email" value={profile.email || ''} readOnly /></label>
                <label>Phone number<input name="phone" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" value={profile.phone || ''} onChange={updateField} required /></label>
                <label className="field-wide">Address<textarea name="address" rows="3" value={profile.address || ''} onChange={updateField} /></label>
                <div className="sensitive-info"><span>PAN</span><strong>{profile.panNumber ? `••••••${profile.panNumber.slice(-4)}` : 'Not available'}</strong><span>Aadhaar</span><strong>{profile.aadhaarNumber ? `••••••••${profile.aadhaarNumber.slice(-4)}` : 'Not available'}</strong></div>
                <button className="button-primary" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save profile'}</button>
              </form>
            </>
          )}
        </>
      ) : (
        <>
          <div className="data-unavailable-card profile-notice"><span className="unavailable-icon">i</span><div><h3>Complete your customer profile</h3><p>The current registration API creates a login only. FinCore needs a separate customer profile before it can safely load your accounts. Your identity details are sent directly to the existing customer API.</p></div></div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <p className="form-alert form-alert-success" role="status">{success}</p>}
          <form className="form-panel banking-form" onSubmit={saveProfile}>
            <h3>Set up your profile</h3>
            <label>Full name<input name="fullName" value={profile.fullName} onChange={updateField} autoComplete="name" required /></label>
            <label>Email address<input type="email" name="email" value={profile.email} readOnly /></label>
            <label>Phone number<input name="phone" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" placeholder="10-digit mobile number" value={profile.phone} onChange={updateField} required /></label>
            <label className="field-wide">Address<textarea name="address" rows="3" value={profile.address} onChange={updateField} /></label>
            <label>PAN number<input name="panNumber" maxLength="10" autoCapitalize="characters" placeholder="10-character PAN" pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]" value={profile.panNumber} onChange={(event) => setProfile((current) => ({ ...current, panNumber: event.target.value.toUpperCase() }))} required /></label>
            <label>Aadhaar number<input name="aadhaarNumber" inputMode="numeric" pattern="[0-9]{12}" maxLength="12" placeholder="12-digit Aadhaar" value={profile.aadhaarNumber} onChange={updateField} required /></label>
            <p className="form-footnote field-wide">PAN and Aadhaar are required by the existing profile API. They are not stored in browser storage.</p>
            <button className="button-primary" type="submit" disabled={submitting}>{submitting ? 'Creating profile…' : 'Create customer profile'}</button>
          </form>
        </>
      )}
      {customerId && <div className="profile-links"><Link to="/accounts">Manage accounts</Link><Link to="/beneficiaries">Manage beneficiaries</Link></div>}
    </div>
  )
}

export default Profile
