import { Suspense } from 'react'
import { Navigate, useLocation, useRoutes } from 'react-router-dom'
import { NotFoundPage } from '@/pages/not-found-page'
import { AppLayout } from './layout'
import { HomePage } from '@/pages/home/home-page'
import { LoginPage } from '@/pages/auth/login-page'
import { useAuth } from '@/shared/hooks/auth-queries'
import { ApplyPage } from '@/pages/apply/apply-page'

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
        path: '/login',
        element: <LoginPage />,
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

  const isAlreadyOnLogin = window.location.pathname.includes('/login')

  const next = `${location.pathname}${location.search}${location.hash}`
  if (!user && !isAlreadyOnLogin) {
    return <Navigate to="/login" replace state={{ from: next }} />
  }
  else if (user && isAlreadyOnLogin) {
    return <Navigate to="/" replace state={{ from: next }} />
  }  

  return <Suspense fallback={<div>Loading...</div>}>{element}</Suspense>
}