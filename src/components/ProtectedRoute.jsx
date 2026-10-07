import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getAuthToken } from '../utils/authSession.js'

function ProtectedRoute() {
  const location = useLocation()

  return getAuthToken()
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location }} />
}

export default ProtectedRoute
