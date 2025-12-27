import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Dashboard } from '../pages/Dashboard'
import { Dispatch } from '../pages/Dispatch'
import { ControlTower } from '../pages/ControlTower'
import { Reconciliation } from '../pages/Reconciliation'
import { CarriersWrapper } from '../pages/CarriersWrapper'
import { LocationsWrapper } from '../pages/LocationsWrapper'
import { RoutesWrapper } from '../pages/RoutesWrapper'
import { Alerts } from '../pages/Alerts'
import { Settings } from '../pages/Settings'
import { Profile } from '../pages/Profile'
import { Login } from '../pages/Login'
import { NoOrganization } from '../pages/NoOrganization'
import { AuthRedirect } from '../pages/AuthRedirect'
import AppLayout from '../layouts/AppLayout'
import { ProtectedRoute } from '../components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/no-organization',
    element: (
      <ProtectedRoute>
        <NoOrganization />
      </ProtectedRoute>
    ),
  },
  {
    path: '/auth/redirect',
    element: <AuthRedirect />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute requireOrgMember>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Navigate
            to='/dashboard'
            replace
          />
        ),
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'dispatch',
        element: <Dispatch />,
      },
      {
        path: 'control-tower',
        element: <ControlTower />,
      },
      {
        path: 'financials',
        element: <Reconciliation />,
      },
      {
        path: 'carriers',
        element: <CarriersWrapper />,
      },
      {
        path: 'locations',
        element: <LocationsWrapper />,
      },
      {
        path: 'routes',
        element: <RoutesWrapper />,
      },
      {
        path: 'alerts',
        element: <Alerts />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
])
