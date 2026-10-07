import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorMessage, LoadingMessage, PageHeading } from '../components/layout/BankingLayout.jsx'
import api from '../services/api.js'
import { errorMessage, formatDate, formatMoney, getCustomerId, maskAccount } from '../utils/banking.js'

function Transactions() {
  const customerId = getCustomerId()
  const [searchParams] = useSearchParams()
  const requestedAccountId = searchParams.get('accountId') || ''
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState(requestedAccountId)
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(Boolean(customerId))
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  useEffect(() => {
    if (!customerId) return undefined
    let active = true

    async function loadTransactions() {
      setLoading(true)
      setError('')
      setWarning('')
      setTransactions([])
      try {
        const { data } = await api.get(`/api/accounts/customer/${customerId}`)
        if (!Array.isArray(data)) {
          throw new Error('The accounts API returned an unexpected response.')
        }
        if (!active) return
        setAccounts(data)

        if (selectedAccountId && !data.some((account) => String(account.id) === selectedAccountId)) {
          setError('The selected account is not in your customer-scoped account list.')
          return
        }

        const selectedAccounts = selectedAccountId
          ? data.filter((account) => String(account.id) === selectedAccountId)
          : data
        if (selectedAccounts.length === 0) return

        const historyResults = await Promise.allSettled(selectedAccounts.map(async (account) => {
          const { data: history } = await api.get(`/api/transactions/account/${account.id}`)
          if (!Array.isArray(history)) {
            throw new Error(`Transaction history for account ${maskAccount(account.accountNumber)} returned an unexpected response.`)
          }
          return history.map((transaction) => ({
            ...transaction,
            activityAccountId: account.id,
            activityAccountNumber: account.accountNumber,
          }))
        }))
        if (!active) return

        const successfulHistories = historyResults
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => result.value)
        successfulHistories.sort((first, second) => (
          new Date(second.transactionDate).getTime() - new Date(first.transactionDate).getTime()
        ))
        setTransactions(successfulHistories)

        const failedCount = historyResults.filter((result) => result.status === 'rejected').length
        if (failedCount > 0 && successfulHistories.length > 0) {
          setWarning(`Transaction history could not be loaded for ${failedCount} of the selected account${failedCount === 1 ? '' : 's'}. Showing the available results.`)
        } else if (failedCount > 0) {
          const failedResult = historyResults.find((result) => result.status === 'rejected')
          const failure = failedResult.reason
          setError(failure.isAxiosError
            ? errorMessage(failure, 'Unable to load transaction history.')
            : failure.message || 'Unable to load transaction history.')
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.isAxiosError
            ? errorMessage(requestError, 'Unable to load your accounts and transaction history.')
            : requestError.message || 'Unable to load your accounts and transaction history.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadTransactions()
    return () => { active = false }
  }, [customerId, selectedAccountId])

  if (!customerId) return <div className="page-stack"><PageHeading eyebrow="YOUR ACCOUNT" title="Transactions" /><div className="onboarding-banner"><div><strong>Set up your profile first</strong><p>Transaction history is available for your linked accounts.</p></div><Link className="button-primary" to="/profile">Set up profile</Link></div></div>

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase()
  const visibleTransactions = transactions.filter((transaction) => {
    const matchesFilters = (!selectedType || transaction.transactionType === selectedType)
      && (!selectedStatus || transaction.status === selectedStatus)
    if (!matchesFilters || !normalizedSearch) return matchesFilters

    const searchableValues = [
      transaction.transactionDate,
      transaction.transactionReference,
      transaction.fromAccountNumber,
      transaction.toAccountNumber,
      transaction.amount,
      transaction.transactionType,
      transaction.status,
      transaction.remarks,
    ]
    return searchableValues.some((value) => String(value ?? '').toLocaleLowerCase().includes(normalizedSearch))
  })

  return (
    <div className="page-stack">
      <PageHeading eyebrow="YOUR ACCOUNT" title="Transaction history">
        <div className="transaction-filters">
          <label className="transaction-search">
            <span>Search transactions</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search reference, account, amount…"
              aria-label="Search transactions"
            />
          </label>
          <label className="filter-select">Account
            <select value={selectedAccountId} onChange={(event) => setSelectedAccountId(event.target.value)}>
              <option value="">All your accounts</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.accountType} · {maskAccount(account.accountNumber)}</option>)}
            </select>
          </label>
          <label className="filter-select">Type
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
              <option value="">All types</option>
              <option value="DEBIT">Debit</option>
              <option value="CREDIT">Credit</option>
            </select>
          </label>
          <label className="filter-select">Status
            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </label>
        </div>
      </PageHeading>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {warning && <p className="transaction-warning" role="status">{warning}</p>}
      {loading ? <LoadingMessage>Loading transaction history…</LoadingMessage> : visibleTransactions.length ? (
        <div className="table-wrap transaction-table-wrap">
          <table className="banking-table transaction-table">
            <thead>
              <tr><th>Date</th><th>Transaction reference</th><th>From account</th><th>To account</th><th className="align-right">Amount</th><th>Debit/Credit</th><th>Status</th><th>Remarks</th></tr>
            </thead>
            <tbody>
              {visibleTransactions.map((transaction, index) => (
                <tr key={`${transaction.transactionId}-${transaction.activityAccountId}-${index}`}>
                  <td>{formatDate(transaction.transactionDate)}</td>
                  <td><strong>{transaction.transactionReference || `#${transaction.transactionId}`}</strong></td>
                  <td>{maskAccount(transaction.fromAccountNumber)}</td>
                  <td>{maskAccount(transaction.toAccountNumber)}</td>
                  <td className={`align-right amount-${String(transaction.transactionType || '').toLowerCase()}`}>
                    {transaction.transactionType === 'DEBIT' ? '−' : transaction.transactionType === 'CREDIT' ? '+' : ''}{formatMoney(transaction.amount)}
                  </td>
                  <td><span className={`transaction-type ${String(transaction.transactionType || '').toLowerCase()}`}>{transaction.transactionType || '—'}</span></td>
                  <td><span className={`status-pill ${String(transaction.status || '').toLowerCase()}`}>{transaction.status || '—'}</span></td>
                  <td>{transaction.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !error ? (
        <EmptyState title={transactions.length ? 'No matching transactions' : 'No transactions found'}>
          {transactions.length ? 'Change or clear your search and filters to see more results.' : 'Completed transfers for your selected accounts will appear here.'}
        </EmptyState>
      ) : null}
      {!loading && !error && transactions.length > 0 && (
        <p className="transaction-count" role="status">Showing {visibleTransactions.length} of {transactions.length} account activities</p>
      )}
    </div>
  )
}

export default Transactions
