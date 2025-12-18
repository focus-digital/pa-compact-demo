import { Suspense } from 'react'
import { Navigate, useLocation, useRoutes } from 'react-router-dom'
import { NotFoundPage } from '@/pages/not-found-page'
import { AppLayout } from './layout'
import { HomePage } from '@/pages/home/home-page'
import { LoginPage } from '@/pages/auth/login-page'
import { DemoLoginPage } from '@/pages/auth/demo-login-page'
import { useAuth } from '@/shared/hooks/auth-queries'
import { ApplyPage } from '@/pages/apply/apply-page'
import { LicenseHomePage } from '@/pages/license/license-home'

const ROUTES = [    
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: '/apply',
        element: <ApplyPage />
      },
      {
        path: '/licenses',
        element: <LicenseHomePage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/demo-login',
        element: <DemoLoginPage />,
      },
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />,
  }, 
];

export function AppRouter() {
  const location = useLocation();
  const { user } = useAuth();
  const element = useRoutes(ROUTES);

  const path = window.location.pathname;
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/demo-login');

  const next = `${location.pathname}${location.search}${location.hash}`;
  if (!user && !isAuthRoute) {
    return <Navigate to="/demo-login" replace state={{ from: next }} />;
  } else if (user && isAuthRoute) {
    return <Navigate to="/licenses" replace state={{ from: next }} />;
  }

  return <Suspense fallback={<div>Loading...</div>}>{element}</Suspense>
}
