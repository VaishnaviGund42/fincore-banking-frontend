import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import BankingLayout from './components/layout/BankingLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Accounts from './pages/Accounts.jsx'
import Beneficiaries from './pages/Beneficiaries.jsx'
import Dashboard from './pages/Dashboard.jsx'
import FundTransfer from './pages/FundTransfer.jsx'
import Profile from './pages/Profile.jsx'
import Transactions from './pages/Transactions.jsx'
import Login from './pages/auth/login.jsx'
import Register from './pages/auth/register.jsx'
import { getAuthToken } from './utils/authSession.js'
import './App.css'

function GuestRoute() {
  return getAuthToken()
    ? <Navigate to="/dashboard" replace />
    : <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<BankingLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/:accountId" element={<Accounts />} />
            <Route path="/beneficiaries" element={<Beneficiaries />} />
            <Route path="/transfer" element={<FundTransfer />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
