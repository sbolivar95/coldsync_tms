import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Dashboard } from '../pages/Dashboard';
import { DispatchListPage } from '../pages/dispatch/DispatchListPage';
import { DispatchOrderCreatePage } from '../pages/dispatch/DispatchOrderCreatePage';
import { DispatchRedirect } from '../pages/dispatch/DispatchRedirect';
import { ControlTowerListPage } from '../pages/control_tower/ControlTowerListPage';
import { Reconciliation } from '../pages/Reconciliation';
import { Carriers } from '../pages/Carriers';
import { CarriersListPage } from '../pages/carriers/CarriersListPage';
import { CarrierDetailPage } from '../pages/carriers/CarrierDetailPage';
import { CarrierCreatePage } from '../pages/carriers/CarrierCreatePage';
import { FleetListPage } from '../pages/carriers/fleet/FleetListPage';
import { VehicleDetailPage } from '../pages/carriers/fleet/VehicleDetailPage';
import { VehicleCreatePage } from '../pages/carriers/fleet/VehicleCreatePage';
import { DriverDetailPage } from '../pages/carriers/fleet/DriverDetailPage';
import { DriverCreatePage } from '../pages/carriers/fleet/DriverCreatePage';
import { TrailerDetailPage } from '../pages/carriers/fleet/TrailerDetailPage';
import { TrailerCreatePage } from '../pages/carriers/fleet/TrailerCreatePage';
import { HardwareCreatePage } from '../pages/carriers/fleet/HardwareCreatePage';
import { HardwareDetailPage } from '../pages/carriers/fleet/HardwareDetailPage';
import { LocationsListPage } from '../pages/locations/LocationsListPage';
import { LocationCreatePage } from '../pages/locations/LocationCreatePage';
import { LocationDetailPage } from '../pages/locations/LocationDetailPage';
import { LanesListPage } from '../pages/lanes/LanesListPage';
import { LaneCreatePage } from '../pages/lanes/LaneCreatePage';
import { LaneDetailPage } from '../pages/lanes/LaneDetailPage';
import { OrdersListPage } from '../pages/orders/OrdersListPage';
import { Alerts } from '../pages/Alerts';
import { Settings } from '../pages/Settings';
import { Profile } from '../pages/Profile';
import { Login } from '../pages/Login';
import { SetPassword } from '../pages/SetPassword';
import { ResetPassword } from '../pages/ResetPassword';
import AppLayout from '../layouts/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/set-password',
    element: <SetPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'dispatch',
        element: <Outlet />,
        children: [
          {
            index: true,
            element: <DispatchRedirect />,
          },
          {
            path: 'gantt',
            element: <DispatchListPage />,
          },
          {
            path: 'list',
            element: <DispatchListPage />,
          },
          {
            path: 'new',
            element: <DispatchOrderCreatePage />,
          },
          // TODO: Add detail route when DispatchDetailPage is created
          // {
          //   path: ':orderId',
          //   element: <DispatchDetailPage />,
          // }
        ]
      },
      {
        path: 'control-tower/:unitId?',
        element: (
          <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
            <ControlTowerListPage />
          </APIProvider>
        ),
      },
      {
        path: 'financials',
        element: <Reconciliation />,
      },
      {
        path: 'carriers',
        element: <Carriers />,
        children: [
          {
            index: true,
            element: <CarriersListPage />,
          },
          {
            path: 'new',
            element: <CarrierCreatePage />,
          },
          {
            path: ':carrierId',
            element: <Outlet />,
            children: [
              {
                index: true,
                element: <CarrierDetailPage />,
              },
              {
                path: 'fleet',
                children: [
                  {
                    index: true,
                    element: <Navigate to="trailers" replace />,
                  },
                  {
                    path: 'vehicles',
                    element: <FleetListPage />,
                  },
                  {
                    path: 'vehicles/new',
                    element: <VehicleCreatePage />,
                  },
                  {
                    path: 'vehicles/:vehicleId',
                    element: <VehicleDetailPage />,
                  },
                  {
                    path: 'drivers',
                    element: <FleetListPage />,
                  },
                  {
                    path: 'drivers/new',
                    element: <DriverCreatePage />,
                  },
                  {
                    path: 'drivers/:driverId',
                    element: <DriverDetailPage />,
                  },
                  {
                    path: 'trailers',
                    element: <FleetListPage />,
                  },
                  {
                    path: 'trailers/new',
                    element: <TrailerCreatePage />,
                  },
                  {
                    path: 'trailers/:trailerId',
                    element: <TrailerDetailPage />,
                  },
                  {
                    path: 'hardware',
                    element: <FleetListPage />,
                  },
                  {
                    path: 'hardware/new',
                    element: <HardwareCreatePage />,
                  },
                  {
                    path: 'hardware/:hardwareId',
                    element: <HardwareDetailPage />,
                  },
                  {
                    path: 'assignments',
                    element: <FleetListPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: 'locations',
        element: (
          <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
            <Outlet />
          </APIProvider>
        ),
        children: [
          {
            index: true,
            element: <LocationsListPage />,
          },
          {
            path: 'new',
            element: <LocationCreatePage />,
          },
          {
            path: ':locationId',
            element: <LocationDetailPage />,
          }
        ]
      },
      {
        path: 'lanes',
        children: [
          {
            index: true,
            element: <LanesListPage />,
          },
          {
            path: 'new',
            element: <LaneCreatePage />,
          },
          {
            path: ':laneId',
            element: <LaneDetailPage />,
          }
        ]
      },
      {
        path: 'orders/:orderId?',
        element: <OrdersListPage />,
      },

      {
        path: 'alerts',
        element: <Alerts />,
      },
      {
        path: 'settings',
        element: <Settings />,
        children: [
          {
            path: 'organizations',
            element: <></>,
            children: [
              {
                path: 'new',
                element: <></>,
              },
              {
                path: ':orgId',
                element: <></>,
              },
            ],
          },
          {
            path: 'users',
            element: <></>,
            children: [
              {
                path: 'new',
                element: <></>,
              },
              {
                path: 'invite',
                element: <></>,
              },
              {
                path: ':userId',
                element: <></>,
                children: [
                  {
                    path: 'edit',
                    element: <></>,
                  }
                ]
              },
            ],
          },
          {
            path: 'thermal-profiles',
            element: <></>,
            children: [
              {
                path: 'new',
                element: <></>,
              },
              {
                path: ':profileId',
                element: <></>,
                children: [
                  {
                    path: 'edit',
                    element: <></>,
                  }
                ]
              },
            ],
          },
          {
            path: 'products',
            element: <></>,
            children: [
              {
                path: 'new',
                element: <></>,
              },
              {
                path: ':productId',
                element: <></>,
                children: [
                  {
                    path: 'edit',
                    element: <></>,
                  }
                ]
              },
            ],
          },
          {
            path: 'rate-cards',
            element: <></>,
            children: [
              {
                path: 'new',
                element: <></>,
              },
              {
                path: ':rateCardId',
                element: <></>,
              },
            ],
          },

        ],
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
]);

