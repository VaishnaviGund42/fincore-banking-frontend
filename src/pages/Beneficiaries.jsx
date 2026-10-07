import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorMessage, LoadingMessage, PageHeading } from '../components/layout/BankingLayout.jsx'
import api from '../services/api.js'
import { errorMessage, getCustomerId, maskAccount, toArray } from '../utils/banking.js'

const emptyForm = { beneficiaryName: '', accountNumber: '', ifscCode: '', bankName: '' }

function Beneficiaries() {
  const customerId = getCustomerId()
  const [beneficiaries, setBeneficiaries] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [loading, setLoading] = useState(Boolean(customerId))
  const [submitting, setSubmitting] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!customerId) return undefined
    let active = true
    api.get(`/api/beneficiaries/customer/${customerId}`)
      .then(({ data }) => { if (active) setBeneficiaries(toArray(data)) })
      .catch((requestError) => { if (active) setError(errorMessage(requestError, 'Unable to load beneficiaries.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [customerId])

  function beginEdit(beneficiary) {
    setEditingId(beneficiary.id)
    setForm({
      beneficiaryName: beneficiary.beneficiaryName || '',
      accountNumber: beneficiary.accountNumber || '',
      ifscCode: beneficiary.ifscCode || '',
      bankName: beneficiary.bankName || '',
    })
    setError('')
    setSuccess('')
    setConfirmingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function saveBeneficiary(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const payload = { ...form, customerId: Number(customerId) }
      if (editingId === null) {
        const { data } = await api.post('/api/beneficiaries', payload)
        setBeneficiaries((current) => [...current, data])
        setSuccess('Beneficiary added.')
      } else {
        const { data } = await api.put(`/api/beneficiaries/${editingId}`, payload)
        setBeneficiaries((current) => current.map((item) => item.id === editingId ? data : item))
        setSuccess('Beneficiary details updated.')
      }
      cancelEdit()
    } catch (requestError) {
      setError(errorMessage(requestError, editingId === null ? 'Unable to add beneficiary.' : 'Unable to update beneficiary.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function deactivate(beneficiary) {
    setDeactivatingId(beneficiary.id)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/api/beneficiaries/${beneficiary.id}`)
      setBeneficiaries((current) => current.map((item) => (
        item.id === beneficiary.id ? { ...item, status: 'INACTIVE' } : item
      )))
      setSuccess(`${beneficiary.beneficiaryName} was deactivated.`)
      setConfirmingId(null)
      if (editingId === beneficiary.id) cancelEdit()
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to deactivate beneficiary.'))
    } finally {
      setDeactivatingId(null)
    }
  }

  if (!customerId) return <div className="page-stack"><PageHeading eyebrow="PAYMENTS" title="Beneficiaries" /><div className="onboarding-banner"><div><strong>Set up your profile first</strong><p>Beneficiaries are linked to your FinCore customer profile.</p></div><Link className="button-primary" to="/profile">Set up profile</Link></div></div>
  if (loading) return <LoadingMessage>Loading beneficiaries…</LoadingMessage>

  const activeCount = beneficiaries.filter((beneficiary) => beneficiary.status === 'ACTIVE').length
  const inactiveCount = beneficiaries.length - activeCount

  return (
    <div className="page-stack">
      <PageHeading eyebrow="PAYMENTS" title="Beneficiaries" />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <p className="form-alert form-alert-success" role="status">{success}</p>}
      <div className="accounts-summary beneficiary-summary" aria-label="Beneficiary summary">
        <div><span>ACTIVE BENEFICIARIES</span><strong>{activeCount}</strong></div>
        <div><span>INACTIVE BENEFICIARIES</span><strong>{inactiveCount}</strong></div>
      </div>
      {beneficiaries.length ? (
        <div className="beneficiary-list">
          {beneficiaries.map((beneficiary) => (
            <div className="beneficiary-card" key={beneficiary.id}>
              <span className="beneficiary-avatar" aria-hidden="true">{beneficiary.beneficiaryName?.slice(0, 1).toUpperCase() || '?'}</span>
              <div className="beneficiary-info">
                <strong>{beneficiary.beneficiaryName}</strong>
                <span>{beneficiary.bankName} · {maskAccount(beneficiary.accountNumber)}</span>
                <small>IFSC {beneficiary.ifscCode}</small>
              </div>
              <span className={`status-pill ${String(beneficiary.status).toLowerCase()}`}>{beneficiary.status}</span>
              <div className="beneficiary-actions">
                {confirmingId === beneficiary.id ? (
                  <>
                    <span className="deactivate-confirmation">Deactivate this recipient?</span>
                    <button
                      className="button-quiet danger-text"
                      type="button"
                      disabled={deactivatingId === beneficiary.id}
                      onClick={() => deactivate(beneficiary)}
                    >
                      {deactivatingId === beneficiary.id ? 'Deactivating…' : 'Confirm'}
                    </button>
                    <button className="button-quiet" type="button" onClick={() => setConfirmingId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="button-quiet" type="button" onClick={() => beginEdit(beneficiary)}>Edit</button>
                    {beneficiary.status === 'ACTIVE' && (
                      <button className="button-quiet danger-text" type="button" onClick={() => setConfirmingId(beneficiary.id)}>Deactivate</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState title="No beneficiaries yet">Add a recipient to make them available for future transactions.</EmptyState>}
      <section className="form-panel">
        <h3>{editingId === null ? 'Add a beneficiary' : 'Edit beneficiary details'}</h3>
        <p>Check the recipient details carefully before saving.</p>
        <form className="banking-form" onSubmit={saveBeneficiary}>
          <label>Beneficiary name<input autoComplete="name" value={form.beneficiaryName} onChange={(event) => setForm({ ...form, beneficiaryName: event.target.value })} required /></label>
          <label>Bank name<input autoComplete="organization" value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} required /></label>
          <label>Account number<input inputMode="numeric" autoComplete="off" value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })} required /></label>
          <label>IFSC code<input maxLength="11" autoCapitalize="characters" value={form.ifscCode} onChange={(event) => setForm({ ...form, ifscCode: event.target.value.toUpperCase() })} required /></label>
          <div className="beneficiary-form-actions">
            <button className="button-primary" disabled={submitting || deactivatingId !== null} type="submit">
              {submitting ? 'Saving…' : editingId === null ? 'Add beneficiary' : 'Save changes'}
            </button>
            {editingId !== null && <button className="button-secondary" disabled={submitting} type="button" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      </section>
    </div>
  )
}

export default Beneficiaries
