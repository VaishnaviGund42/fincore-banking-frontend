import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorMessage, LoadingMessage, PageHeading } from '../components/layout/BankingLayout.jsx'
import api from '../services/api.js'
import { errorMessage, formatDate, formatMoney, getCustomerId, maskAccount } from '../utils/banking.js'

function Dashboard() {
  const email = localStorage.getItem('email') || 'FinCore customer'
  const customerId = getCustomerId()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [activeBeneficiaryCount, setActiveBeneficiaryCount] = useState(null)
  const [accountsLoading, setAccountsLoading] = useState(Boolean(customerId))
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [accountsError, setAccountsError] = useState('')
  const [transactionsError, setTransactionsError] = useState('')
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(Boolean(customerId))
  const [beneficiariesError, setBeneficiariesError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!customerId) return undefined
    let active = true

    api.get(`/api/beneficiaries/customer/${customerId}`)
      .then(({ data }) => {
        if (!Array.isArray(data)) {
          throw new Error('The beneficiaries API returned an unexpected response.')
        }
        if (active) {
          setActiveBeneficiaryCount(data.filter((beneficiary) => beneficiary.status === 'ACTIVE').length)
        }
      })
      .catch((requestError) => {
        if (!active) return
        setActiveBeneficiaryCount(null)
        setBeneficiariesError(
          requestError.isAxiosError
            ? errorMessage(requestError, 'Unable to load your beneficiaries.')
            : requestError.message || 'Unable to load your beneficiaries.',
        )
      })
      .finally(() => {
        if (active) setBeneficiariesLoading(false)
      })

    return () => { active = false }
  }, [customerId, refreshKey])

  useEffect(() => {
    if (!customerId) return undefined

    let active = true

    async function loadDashboard() {
      setAccountsLoading(true)
      setAccountsError('')
      setTransactionsError('')

      try {
        const { data } = await api.get(`/api/accounts/customer/${customerId}`)
        if (!Array.isArray(data)) {
          throw new Error('The accounts API returned an unexpected response.')
        }
        if (!active) return

        setAccounts(data)
        setAccountsLoading(false)

        if (!data.length) {
          setTransactions([])
          setTransactionsLoading(false)
          return
        }

        setTransactionsLoading(true)
        const historyResults = await Promise.allSettled(data.map(async (account) => {
          const { data: history } = await api.get(`/api/transactions/account/${account.id}`)
          if (!Array.isArray(history)) {
            throw new Error(`Transaction history for account ${maskAccount(account.accountNumber)} returned an unexpected response.`)
          }
          return history
        }))

        if (!active) return

        const fulfilledHistory = historyResults
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => result.value)
        const rejectedHistory = historyResults.filter((result) => result.status === 'rejected')

        const transactionsById = new Map()
        fulfilledHistory.forEach((transaction) => {
          const key = transaction.transactionId ?? transaction.transactionReference
          if (key !== undefined && !transactionsById.has(key)) {
            transactionsById.set(key, transaction)
          }
        })
        const recentTransactions = [...transactionsById.values()]
          .sort((first, second) => new Date(second.transactionDate) - new Date(first.transactionDate))
          .slice(0, 5)
        setTransactions(recentTransactions)

        if (rejectedHistory.length) {
          const firstFailure = rejectedHistory[0].reason
          const failureMessage = firstFailure.isAxiosError
            ? errorMessage(firstFailure, 'Some transaction history could not be loaded.')
            : firstFailure.message || 'Some transaction history could not be loaded.'
          setTransactionsError(`${failureMessage} Available results are still shown.`)
        }
      } catch (requestError) {
        if (active) {
          setAccounts([])
          setTransactions([])
          setAccountsError(
            requestError.isAxiosError
              ? errorMessage(requestError, 'Unable to load your accounts.')
              : requestError.message || 'Unable to load your accounts.',
          )
        }
      } finally {
        if (active) {
          setAccountsLoading(false)
          setTransactionsLoading(false)
        }
      }
    }

    loadDashboard()
    return () => { active = false }
  }, [customerId, refreshKey])

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0)
  const activeAccounts = accounts.filter((account) => account.status === 'ACTIVE').length
  const dashboardRefreshing = accountsLoading || beneficiariesLoading
  const customerName = accounts.find((account) => account.customerName)?.customerName

  return (
    <div className="page-stack dashboard-page">
      <PageHeading eyebrow="YOUR FINANCES" title="Dashboard" />
      <section className="welcome-section">
        <div>
          <p className="welcome-eyebrow">PERSONAL OVERVIEW</p>
          <h2>{customerName ? `Welcome back, ${customerName}` : 'Welcome back'}</h2>
          <p className="welcome-subtitle">{email}</p>
        </div>
        <div className="profile-status">
          <span className="status-dot ready" />
          Your secure session is active
        </div>
      </section>

      {!customerId && (
        <div className="onboarding-banner">
          <div>
            <strong>Finish setting up your banking profile</strong>
            <p>Create your customer profile to securely connect your accounts and banking activity.</p>
          </div>
          <Link className="button-primary" to="/profile">Set up profile</Link>
        </div>
      )}

      <section className="dashboard-metrics" aria-label="Account summary">
          <article className="dashboard-metric-card balance-metric">
            <span className="metric-icon" aria-hidden="true">₹</span>
            <div>
              <span className="metric-label">TOTAL BALANCE</span>
              <strong>{!customerId ? '—' : accountsLoading ? 'Loading…' : accountsError ? 'Unavailable' : formatMoney(totalBalance)}</strong>
              <small>{!customerId ? 'Complete your profile to view' : `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} in total`}</small>
            </div>
          </article>
          <article className="dashboard-metric-card">
            <span className="metric-icon accounts-metric-icon" aria-hidden="true">▤</span>
            <div>
              <span className="metric-label">TOTAL ACCOUNTS</span>
              <strong>{!customerId || accountsLoading || accountsError ? '—' : accounts.length}</strong>
              <small>{!customerId ? 'Complete your profile to view' : accountsLoading ? 'Loading accounts' : accountsError ? 'Could not load' : `${activeAccounts} active`}</small>
            </div>
          </article>
          <article className="dashboard-metric-card">
            <span className="metric-icon beneficiaries-metric-icon" aria-hidden="true">♧</span>
            <div>
              <span className="metric-label">ACTIVE BENEFICIARIES</span>
              <strong>{!customerId || beneficiariesLoading ? '—' : activeBeneficiaryCount ?? '—'}</strong>
              <small>{!customerId ? 'Complete your profile to view' : beneficiariesError ? 'Could not load' : beneficiariesLoading ? 'Loading beneficiaries' : 'Ready for payments'}</small>
            </div>
          </article>
      </section>

      <section className="dashboard-section" aria-labelledby="accounts-heading">
        <PageHeading eyebrow="YOUR FINANCES" title="Accounts overview">
          <div className="section-actions">
            {customerId && (
              <button
                className="refresh-button"
                onClick={() => {
                  setAccountsLoading(true)
                  setBeneficiariesLoading(true)
                  setBeneficiariesError('')
                  setRefreshKey((key) => key + 1)
                }}
                type="button"
                disabled={dashboardRefreshing}
              >
                <span aria-hidden="true">↻</span> {dashboardRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            )}
            <Link className="text-link" to="/accounts">View accounts <span aria-hidden="true">→</span></Link>
          </div>
        </PageHeading>

        {accountsError && <ErrorMessage>{accountsError}</ErrorMessage>}
        {accountsLoading ? <LoadingMessage>Loading your accounts…</LoadingMessage> : customerId ? (
          accounts.length ? (
            <>
              <div className="overview-grid">
                {accounts.slice(0, 3).map((account) => (
                  <Link className="overview-account-card" to={`/accounts/${account.id}`} key={account.id}>
                    <span className="overview-account-heading">
                      <span className="account-type-icon" aria-hidden="true">▤</span>
                      <span className="overview-account-type">{account.accountType} ACCOUNT</span>
                      <span className={`status-pill ${String(account.status || '').toLowerCase()}`}>{account.status || '—'}</span>
                    </span>
                    <strong>{formatMoney(account.balance)}</strong>
                    <span>{maskAccount(account.accountNumber)} <span aria-hidden="true">↗</span></span>
                  </Link>
                ))}
              </div>
              <div className="account-summary-line">
                <span><strong>{activeAccounts}</strong> active {activeAccounts === 1 ? 'account' : 'accounts'}</span>
                {accounts.length > 2 && <Link to="/accounts">See all {accounts.length} accounts</Link>}
              </div>
            </>
          ) : (
            <div className="dashboard-empty-panel">
              <EmptyState title="No accounts yet">Open your first account to start using FinCore.</EmptyState>
              <Link className="button-primary" to="/accounts">Open an account</Link>
            </div>
          )
        ) : (
          <div className="dashboard-empty-panel">
            <EmptyState title="Accounts will appear here">Complete your profile to connect accounts to your FinCore login.</EmptyState>
            <Link className="button-primary" to="/profile">Set up profile</Link>
          </div>
        )}
        {beneficiariesError && (
          <p className="dashboard-inline-error" role="status">
            Beneficiary count unavailable: {beneficiariesError}
          </p>
        )}
      </section>

      <section className="dashboard-section" aria-labelledby="activity-heading">
        <PageHeading eyebrow="YOUR ACCOUNT" title="Recent activity">
          <Link className="text-link" to="/transactions">All transactions <span aria-hidden="true">→</span></Link>
        </PageHeading>
        {transactionsError && <ErrorMessage>{transactionsError}</ErrorMessage>}
        {accountsLoading || transactionsLoading ? <LoadingMessage>Loading recent activity…</LoadingMessage> : !customerId || !accounts.length ? (
          <EmptyState title={accountsError ? 'Activity is unavailable' : 'Activity will appear here'}>
            {accountsError ? 'Resolve the account loading error above to see recent activity.' : 'Transactions are shown for your accounts only.'}
          </EmptyState>
        ) : transactions.length ? (
          <div className="table-wrap">
            <table className="banking-table">
              <thead><tr><th>Transaction</th><th>Accounts</th><th>Date</th><th>Status</th><th className="align-right">Amount</th></tr></thead>
              <tbody>{transactions.map((transaction, index) => (
                <tr key={`${transaction.transactionId || transaction.transactionReference}-${index}`}>
                  <td>
                    <strong>{transaction.remarks || 'Fund transfer'}</strong>
                    <small>Ref. {transaction.transactionReference || transaction.transactionId}</small>
                  </td>
                  <td>
                    <span className="transaction-accounts">
                      {accounts.some((account) => String(account.id) === String(transaction.fromAccountId))
                        ? <Link className="table-account-link" to={`/accounts/${transaction.fromAccountId}`}>{maskAccount(transaction.fromAccountNumber)}</Link>
                        : <span>{maskAccount(transaction.fromAccountNumber)}</span>}
                      <span aria-label="to">→</span>
                      {accounts.some((account) => String(account.id) === String(transaction.toAccountId))
                        ? <Link className="table-account-link" to={`/accounts/${transaction.toAccountId}`}>{maskAccount(transaction.toAccountNumber)}</Link>
                        : <span>{maskAccount(transaction.toAccountNumber)}</span>}
                    </span>
                  </td>
                  <td>{formatDate(transaction.transactionDate)}</td>
                  <td><span className={`status-pill ${String(transaction.status || '').toLowerCase()}`}>{transaction.status || '—'}</span></td>
                  <td className="align-right">{formatMoney(transaction.amount)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No transactions yet">Completed transfers for your accounts will appear here.</EmptyState>
        )}
      </section>

      <section className="quick-actions" aria-label="Quick actions">
        <span>Quick actions</span>
        <Link to="/transfer"><span aria-hidden="true">↗</span> Make a transfer</Link>
        <Link to="/beneficiaries"><span aria-hidden="true">＋</span> Manage beneficiaries</Link>
        <Link to="/accounts"><span aria-hidden="true">＋</span> Open an account</Link>
      </section>
    </div>
  )
}

export default Dashboard
