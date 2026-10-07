import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorMessage, LoadingMessage, PageHeading } from '../components/layout/BankingLayout.jsx'
import api from '../services/api.js'
import { errorMessage, formatDate, formatMoney, getCustomerId, maskAccount } from '../utils/banking.js'

function FundTransfer() {
  const customerId = getCustomerId()
  const [accounts, setAccounts] = useState([])
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(Boolean(customerId))
  const [submitting, setSubmitting] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [error, setError] = useState('')
  const [refreshError, setRefreshError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!customerId) return undefined
    let active = true
    api.get(`/api/accounts/customer/${customerId}`)
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('The accounts API returned an unexpected response.')
        if (!active) return
        const activeAccounts = data.filter((account) => account.status === 'ACTIVE')
        setAccounts(activeAccounts)
        if (activeAccounts[0]) setFromAccountId(String(activeAccounts[0].id))
        if (activeAccounts[1]) setToAccountId(String(activeAccounts[1].id))
      })
      .catch((requestError) => {
        if (active) setError(requestError.isAxiosError
          ? errorMessage(requestError, 'Unable to load your accounts.')
          : requestError.message || 'Unable to load your accounts.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [customerId])

  const fromAccount = accounts.find((account) => String(account.id) === fromAccountId)
  const toAccount = accounts.find((account) => String(account.id) === toAccountId)

  function reviewTransfer(event) {
    event.preventDefault()
    setError('')
    setRefreshError('')
    setResult(null)
    const parsedAmount = Number(amount)
    if (!fromAccount || !toAccount || fromAccountId === toAccountId) {
      setError('Choose two different active accounts.')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      setError('Enter a transfer amount of at least ₹1.00.')
      return
    }
    if (parsedAmount > Number(fromAccount.balance)) {
      setError('The transfer amount exceeds the available balance.')
      return
    }
    setReviewing(true)
  }

  function cancelReview() {
    setReviewing(false)
    setError('')
  }

  async function confirmTransfer() {
    setSubmitting(true)
    setError('')
    setRefreshError('')
    try {
      const { data } = await api.post('/api/transfers', {
        fromAccountId: Number(fromAccountId),
        toAccountId: Number(toAccountId),
        amount: Number(amount),
        remarks: remarks.trim(),
      })
      setResult(data)
      setReviewing(false)
      setAmount('')
      setRemarks('')

      try {
        const { data: refreshedAccounts } = await api.get(`/api/accounts/customer/${customerId}`)
        if (!Array.isArray(refreshedAccounts)) {
          throw new Error('The accounts API returned an unexpected response.')
        }
        setAccounts(refreshedAccounts.filter((account) => account.status === 'ACTIVE'))
      } catch (refreshRequestError) {
        const message = refreshRequestError.isAxiosError
          ? errorMessage(refreshRequestError, 'Unable to refresh account balances.')
          : refreshRequestError.message || 'Unable to refresh account balances.'
        setRefreshError(`Transfer succeeded, but account balances could not be refreshed. ${message}`)
      }
    } catch (requestError) {
      setError(errorMessage(requestError, 'The transfer could not be completed.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!customerId) return <div className="page-stack"><PageHeading eyebrow="PAYMENTS" title="Fund transfer" /><div className="onboarding-banner"><div><strong>Set up your profile first</strong><p>Your accounts must be available to make an internal transfer.</p></div><Link className="button-primary" to="/profile">Set up profile</Link></div></div>
  if (loading) return <LoadingMessage>Loading your accounts…</LoadingMessage>

  return (
    <div className="page-stack">
      <PageHeading eyebrow="PAYMENTS" title="Fund transfer" />
      <div className="transfer-notice"><strong>Internal transfers only</strong><p>The existing transfer API accepts account IDs and only supports transfers between active accounts. Beneficiary transfers are not supported by this endpoint.</p></div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {refreshError && <ErrorMessage>{refreshError}</ErrorMessage>}
      {result && (
        <div className="transfer-success" role="status">
          <strong>Transfer {result.status}</strong>
          <span>Reference: <b>{result.transactionReference}</b></span>
          <span>Amount: {formatMoney(result.amount)}</span>
          {result.createdAt && <span>Date: {formatDate(result.createdAt)}</span>}
          <Link className="text-link" to="/transactions">View transactions</Link>
        </div>
      )}
      {accounts.length < 2 ? (
        error
          ? <EmptyState title="Unable to load accounts">Retry the page after checking your connection or account profile.</EmptyState>
          : <EmptyState title="Two active accounts are required">The current API transfers between accounts only. Add another active account before making an internal transfer.</EmptyState>
      ) : (
        <>
          <form className="form-panel banking-form transfer-form" onSubmit={reviewTransfer}>
            <h3>Transfer between your accounts</h3>
            <label>From account
              <select disabled={reviewing || submitting} value={fromAccountId} onChange={(event) => setFromAccountId(event.target.value)} required>
                <option value="">Select account</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.accountType} · {maskAccount(account.accountNumber)} · {formatMoney(account.balance)}</option>)}
              </select>
            </label>
            <label>To account
              <select disabled={reviewing || submitting} value={toAccountId} onChange={(event) => setToAccountId(event.target.value)} required>
                <option value="">Select account</option>
                {accounts.filter((account) => String(account.id) !== fromAccountId).map((account) => <option key={account.id} value={account.id}>{account.accountType} · {maskAccount(account.accountNumber)}</option>)}
              </select>
            </label>
            {fromAccount && <p className="balance-hint">Available balance: <strong>{formatMoney(fromAccount.balance)}</strong></p>}
            <label>Amount (INR)
              <input disabled={reviewing || submitting} type="number" min="1" max={fromAccount?.balance} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </label>
            <label>Remarks (optional)<input disabled={reviewing || submitting} maxLength="255" value={remarks} onChange={(event) => setRemarks(event.target.value)} /></label>
            <p className="form-footnote field-wide">Please verify the selected accounts and amount. Transfers are processed immediately after confirmation.</p>
            {!reviewing ? (
              <button className="button-primary" type="submit" disabled={submitting}>Review transfer</button>
            ) : (
              <div className="transfer-review">
                <h4>Confirm transfer details</h4>
                <div><span>From</span><strong>{fromAccount.accountType} · {maskAccount(fromAccount.accountNumber)}</strong></div>
                <div><span>To</span><strong>{toAccount.accountType} · {maskAccount(toAccount.accountNumber)}</strong></div>
                <div><span>Amount</span><strong>{formatMoney(amount)}</strong></div>
                {remarks.trim() && <div><span>Remarks</span><strong>{remarks.trim()}</strong></div>}
                <div className="transfer-review-actions">
                  <button className="button-primary" type="button" disabled={submitting} onClick={confirmTransfer}>{submitting ? 'Processing…' : 'Confirm and transfer'}</button>
                  <button className="button-secondary" type="button" disabled={submitting} onClick={cancelReview}>Cancel</button>
                </div>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  )
}

export default FundTransfer
