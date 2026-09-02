import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './guards';
import { Layout } from '@/components/layout/Layout';
import { lazy, Suspense } from 'react';

// Lazy-loaded public & auth pages
const HomePage = lazy(() => import('@/features/listings/pages/HomePage'));
const PropertiesPage = lazy(() => import('@/features/listings/pages/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('@/features/listings/pages/PropertyDetailPage'));
const SalePage = lazy(() => import('@/features/listings/pages/SalePage'));
const RentPage = lazy(() => import('@/features/listings/pages/RentPage'));
const AgenciesPage = lazy(() => import('@/features/agencies/pages/AgenciesPage'));

// Auth & User pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const ProfilePage = lazy(() => import('@/features/auth/pages/ProfilePage'));
const FavoritesPage = lazy(() => import('@/features/favorites/pages/FavoritesPage'));
const SavedSearchesPage = lazy(() => import('@/features/saved-searches/pages/SavedSearchesPage'));
const InquiriesManagementPage = lazy(() => import('@/features/inquiries/pages/InquiriesManagementPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));

const Loader = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
  </div>
);

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<Loader />}>{element}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // ─── Public routes ───
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'properties', element: withSuspense(<PropertiesPage />) },
      { path: 'properties/:id', element: withSuspense(<PropertyDetailPage />) },
      { path: 'sale', element: withSuspense(<SalePage />) },
      { path: 'rent', element: withSuspense(<RentPage />) },
      { path: 'agencies', element: withSuspense(<AgenciesPage />) },

      // Legacy aliases
      { path: 'listings', element: <Navigate to="/properties" replace /> },
      { path: 'listings/:id', element: withSuspense(<PropertyDetailPage />) },

      // ─── Guest-only routes ───
      {
        element: <GuestRoute />,
        children: [
          { path: 'login', element: withSuspense(<LoginPage />) },
          { path: 'register', element: withSuspense(<RegisterPage />) },
          { path: 'forgot-password', element: withSuspense(<ForgotPasswordPage />) },
          { path: 'reset-password', element: withSuspense(<ResetPasswordPage />) },
        ],
      },

      // ─── Protected routes ───
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile', element: withSuspense(<ProfilePage />) },
          { path: 'favorites', element: withSuspense(<FavoritesPage />) },
          { path: 'saved-searches', element: withSuspense(<SavedSearchesPage />) },
          { path: 'inquiries', element: withSuspense(<InquiriesManagementPage />) },
          { path: 'dashboard', element: withSuspense(<DashboardPage />) },
        ],
      },
    ],
  },
]);
