import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyState, ErrorMessage, LoadingMessage, PageHeading } from '../components/layout/BankingLayout.jsx'
import api from '../services/api.js'
import { errorMessage, formatDate, formatMoney, getCustomerId, maskAccount } from '../utils/banking.js'

function Accounts() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const customerId = getCustomerId()
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(Boolean(customerId))
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [error, setError] = useState('')
  const [transactionsError, setTransactionsError] = useState('')
  const [balanceLoadingId, setBalanceLoadingId] = useState(null)
  const [accountType, setAccountType] = useState('SAVINGS')
  const [initialBalance, setInitialBalance] = useState('0')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!customerId) return undefined
    let active = true

    async function loadAccounts() {
      try {
        const { data } = await api.get(`/api/accounts/customer/${customerId}`)
        if (!Array.isArray(data)) {
          throw new Error('The accounts API returned an unexpected response.')
        }
        if (!active) return
        setAccounts(data)

        if (accountId) {
          const scopedAccount = data.find((account) => String(account.id) === accountId)
          if (!scopedAccount) {
            setError('This account is not in your customer-scoped account list.')
            return
          }

          setSelectedAccount(scopedAccount)
          setTransactionsLoading(true)

          const [detailsResult, historyResult] = await Promise.allSettled([
            api.get(`/api/accounts/${scopedAccount.id}/details`),
            api.get(`/api/transactions/account/${scopedAccount.id}`),
          ])
          if (!active) return

          if (detailsResult.status === 'fulfilled') {
            setSelectedAccount(detailsResult.value.data)
          } else {
            setError(errorMessage(detailsResult.reason, 'Unable to load account details.'))
          }

          if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value.data)) {
            setTransactions(historyResult.value.data)
            setTransactionsError('')
          } else if (historyResult.status === 'fulfilled') {
            setTransactionsError('The transaction history API returned an unexpected response.')
          } else {
            setTransactionsError(errorMessage(historyResult.reason, 'Unable to load account transaction history.'))
          }
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.isAxiosError
            ? errorMessage(requestError, 'Unable to load accounts.')
            : requestError.message || 'Unable to load accounts.')
        }
      } finally {
        if (active) {
          setLoading(false)
          setTransactionsLoading(false)
        }
      }
    }

    loadAccounts()
    return () => { active = false }
  }, [accountId, customerId])

  async function refreshBalance(id) {
    setBalanceLoadingId(id)
    setError('')
    try {
      const { data } = await api.get(`/api/accounts/${id}/balance`)
      setAccounts((current) => current.map((account) => (
        String(account.id) === String(id) ? { ...account, ...data } : account
      )))
      if (String(selectedAccount?.id) === String(id)) {
        setSelectedAccount((current) => ({ ...current, ...data }))
      }
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to refresh account balance.'))
    } finally {
      setBalanceLoadingId(null)
    }
  }

  async function createAccount(event) {
    event.preventDefault()
    if (!customerId) return
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/api/accounts', {
        customerId: Number(customerId),
        accountType,
        initialBalance: Number(initialBalance),
      })
      setAccounts((current) => [...current, data])
      setInitialBalance('0')
      navigate(`/accounts/${data.id}`)
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to open an account.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!customerId) {
    return (
      <div className="page-stack">
        <PageHeading eyebrow="YOUR FINANCES" title="Accounts" />
        <div className="onboarding-banner">
          <div><strong>Set up your customer profile first</strong><p>Accounts are linked to your FinCore customer profile.</p></div>
          <Link className="button-primary" to="/profile">Set up profile</Link>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingMessage>Loading your accounts…</LoadingMessage>

  if (accountId) {
    return (
      <div className="page-stack">
        <PageHeading eyebrow="YOUR FINANCES" title="Account details">
          <Link className="text-link" to="/accounts">← All accounts</Link>
        </PageHeading>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!selectedAccount ? (
          !error && <EmptyState title="Account not found">This account is not in your customer-scoped account list.</EmptyState>
        ) : (
          <>
            <div className="account-detail-card">
              <div>
                <span className="overview-account-type">{selectedAccount.accountType} ACCOUNT</span>
                <h3>{formatMoney(selectedAccount.balance)}</h3>
                <span>Current balance</span>
              </div>
              <span className={`status-pill ${String(selectedAccount.status).toLowerCase()}`}>{selectedAccount.status}</span>
            </div>
            <div className="account-detail-actions">
              <button className="refresh-button" type="button" disabled={balanceLoadingId === selectedAccount.id} onClick={() => refreshBalance(selectedAccount.id)}>
                <span aria-hidden="true">↻</span> {balanceLoadingId === selectedAccount.id ? 'Refreshing…' : 'Refresh balance'}
              </button>
              <Link className="text-link" to={`/transactions?accountId=${selectedAccount.id}`}>View all transactions →</Link>
            </div>
            <div className="detail-grid">
              <div className="detail-item"><span>Account number</span><strong>{maskAccount(selectedAccount.accountNumber)}</strong></div>
              <div className="detail-item"><span>IFSC code</span><strong>{selectedAccount.ifscCode || '—'}</strong></div>
              <div className="detail-item"><span>Account type</span><strong>{selectedAccount.accountType}</strong></div>
              <div className="detail-item"><span>Created date</span><strong>{formatDate(selectedAccount.createdAt)}</strong></div>
              <div className="detail-item"><span>Customer name</span><strong>{selectedAccount.customerName || '—'}</strong></div>
              <div className="detail-item"><span>Customer ID</span><strong>{selectedAccount.customerId || customerId}</strong></div>
            </div>
            <section className="dashboard-section" aria-labelledby="account-transactions-title">
              <PageHeading eyebrow="ACCOUNT ACTIVITY" title="Transaction history">
                <Link className="text-link" to={`/transactions?accountId=${selectedAccount.id}`}>View all →</Link>
              </PageHeading>
              {transactionsError && <ErrorMessage>{transactionsError}</ErrorMessage>}
              {transactionsLoading ? <LoadingMessage>Loading account activity…</LoadingMessage> : transactions.length ? (
                <div className="table-wrap">
                  <table className="banking-table">
                    <thead><tr><th>Transaction</th><th>Reference</th><th>Date</th><th>Status</th><th className="align-right">Amount</th></tr></thead>
                    <tbody>{transactions.slice(0, 5).map((transaction) => (
                      <tr key={transaction.transactionId}>
                        <td><strong>{transaction.remarks || (transaction.transactionType === 'DEBIT' ? 'Transfer sent' : 'Transfer received')}</strong></td>
                        <td>{transaction.transactionReference || transaction.transactionId}</td>
                        <td>{formatDate(transaction.transactionDate)}</td>
                        <td><span className={`status-pill ${String(transaction.status || '').toLowerCase()}`}>{transaction.status || '—'}</span></td>
                        <td className={`align-right amount-${String(transaction.transactionType).toLowerCase()}`}>
                          {transaction.transactionType === 'DEBIT' ? '−' : '+'}{formatMoney(transaction.amount)}
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : !transactionsError ? <EmptyState title="No transactions yet">Activity for this account will appear here.</EmptyState> : null}
            </section>
          </>
        )}
      </div>
    )
  }

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0)

  return (
    <div className="page-stack">
      <PageHeading eyebrow="YOUR FINANCES" title="Accounts">
        <span className="muted-text">{accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}</span>
      </PageHeading>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {accounts.length > 0 && (
        <div className="accounts-summary">
          <div><span>COMBINED BALANCE</span><strong>{formatMoney(totalBalance)}</strong></div>
          <div><span>ACTIVE ACCOUNTS</span><strong>{accounts.filter((account) => account.status === 'ACTIVE').length}</strong></div>
        </div>
      )}
      {accounts.length ? (
        <div className="account-list">
          {accounts.map((account) => (
            <article className="account-list-card" key={account.id}>
              <span className="unavailable-icon" aria-hidden="true">₹</span>
              <div className="account-list-name">
                <strong>{account.accountType} account</strong>
                <span><span className="account-meta-label">Account number</span> {maskAccount(account.accountNumber)}</span>
                <span><span className="account-meta-label">IFSC</span> {account.ifscCode || '—'}</span>
                <span><span className="account-meta-label">Created</span> {formatDate(account.createdAt)}</span>
              </div>
              <div className="account-list-amount"><small>AVAILABLE BALANCE</small><strong>{formatMoney(account.balance)}</strong></div>
              <span className={`status-pill ${String(account.status || '').toLowerCase()}`}>{account.status || '—'}</span>
              <div className="account-list-actions">
                <Link className="button-secondary" to={`/accounts/${account.id}`}>View details</Link>
                <button className="button-quiet" type="button" disabled={balanceLoadingId !== null} onClick={() => refreshBalance(account.id)}>
                  {balanceLoadingId === account.id ? 'Refreshing…' : 'View balance'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : !error ? (
        <EmptyState title="No accounts yet">Open your first account using the secure account form below.</EmptyState>
      ) : null}
      <section className="form-panel">
        <h3>Open a new account</h3>
        <p>Choose an account type. New accounts are created through the existing FinCore account API.</p>
        <form className="banking-form compact-form" onSubmit={createAccount}>
          <label>Account type
            <select value={accountType} onChange={(event) => setAccountType(event.target.value)}>
              <option value="SAVINGS">Savings</option><option value="CURRENT">Current</option>
            </select>
          </label>
          <label>Initial deposit (INR)
            <input type="number" min="0" step="0.01" value={initialBalance} onChange={(event) => setInitialBalance(event.target.value)} required />
          </label>
          <button className="button-primary" disabled={submitting} type="submit">{submitting ? 'Opening…' : 'Open account'}</button>
        </form>
      </section>
    </div>
  )
}

export default Accounts
