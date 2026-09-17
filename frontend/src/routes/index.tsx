import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute, RoleRoute } from './guards';
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
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const ProfilePage = lazy(() => import('@/features/auth/pages/ProfilePage'));
const FavoritesPage = lazy(() => import('@/features/favorites/pages/FavoritesPage'));
const SavedSearchesPage = lazy(() => import('@/features/saved-searches/pages/SavedSearchesPage'));
const InquiriesManagementPage = lazy(() => import('@/features/inquiries/pages/InquiriesManagementPage'));
const VisitsPage = lazy(() => import('@/features/visits/pages/VisitsPage'));
const RentalsPage = lazy(() => import('@/features/rentals/pages/RentalsPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const MessagesPage = lazy(() => import('@/features/messages/pages/MessagesPage'));

// Tenant dedicated page
const TenantDashboardPage = lazy(() => import('@/features/tenant/pages/TenantDashboardPage'));

// Owner pages
const OwnerLayout = lazy(() =>
  import('@/features/owner/components/OwnerLayout').then((m) => ({ default: m.OwnerLayout })),
);
const OwnerDashboardPage = lazy(() => import('@/features/owner/pages/OwnerDashboardPage'));
const OwnerPropertiesPage = lazy(() => import('@/features/owner/pages/OwnerPropertiesPage'));
const OwnerListingsPage = lazy(() => import('@/features/owner/pages/OwnerListingsPage'));
const OwnerInquiriesPage = lazy(() => import('@/features/owner/pages/OwnerInquiriesPage'));
const OwnerVisitsPage = lazy(() => import('@/features/owner/pages/OwnerVisitsPage'));
const OwnerMessagesPage = lazy(() => import('@/features/owner/pages/OwnerMessagesPage'));

// Agent & Agency Admin pages
const AgentLayout = lazy(() =>
  import('@/features/agent/components/AgentLayout').then((m) => ({ default: m.AgentLayout })),
);
const AgentDashboardPage = lazy(() => import('@/features/agent/pages/AgentDashboardPage'));
const AgentPropertiesPage = lazy(() => import('@/features/agent/pages/AgentPropertiesPage'));
const AgentListingsPage = lazy(() => import('@/features/agent/pages/AgentListingsPage'));
const AgentClientsPage = lazy(() => import('@/features/agent/pages/AgentClientsPage'));
const AgentInquiriesPage = lazy(() => import('@/features/agent/pages/AgentInquiriesPage'));
const AgentVisitsPage = lazy(() => import('@/features/agent/pages/AgentVisitsPage'));
const AgentTransactionsPage = lazy(() => import('@/features/agent/pages/AgentTransactionsPage'));
const AgentCommissionsPage = lazy(() => import('@/features/agent/pages/AgentCommissionsPage'));
const AgentTeamPage = lazy(() => import('@/features/agent/pages/AgentTeamPage'));
const AgentStatsPage = lazy(() => import('@/features/agent/pages/AgentStatsPage'));

// Admin pages
const AdminLayout = lazy(() =>
  import('@/features/admin/components/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage'));
const AdminAgenciesPage = lazy(() => import('@/features/admin/pages/AdminAgenciesPage'));
const AdminPropertiesPage = lazy(() => import('@/features/admin/pages/AdminPropertiesPage'));
const AdminListingsPage = lazy(() => import('@/features/admin/pages/AdminListingsPage'));
const AdminTransactionsPage = lazy(() => import('@/features/admin/pages/AdminTransactionsPage'));
const AdminPaymentsPage = lazy(() => import('@/features/admin/pages/AdminPaymentsPage'));
const AdminReportsPage = lazy(() => import('@/features/admin/pages/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('@/features/admin/pages/AdminSettingsPage'));

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
      { path: 'verify-email', element: withSuspense(<VerifyEmailPage />) },

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

      // ─── Protected routes (Common) ───
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile', element: withSuspense(<ProfilePage />) },
          { path: 'favorites', element: withSuspense(<FavoritesPage />) },
          { path: 'saved-searches', element: withSuspense(<SavedSearchesPage />) },
          { path: 'inquiries', element: withSuspense(<InquiriesManagementPage />) },
          { path: 'visits', element: withSuspense(<VisitsPage />) },
          { path: 'rentals', element: withSuspense(<RentalsPage />) },
          { path: 'messages', element: withSuspense(<MessagesPage />) },
          { path: 'dashboard', element: withSuspense(<DashboardPage />) },
        ],
      },

      // ─── Protected Tenant Space (LOCATAIRE) ───
      {
        path: 'tenant',
        element: <RoleRoute allowedRoles={['LOCATAIRE', 'CLIENT', 'ADMIN']} />,
        children: [
          { index: true, element: <Navigate to="/tenant/dashboard" replace /> },
          { path: 'dashboard', element: withSuspense(<TenantDashboardPage />) },
        ],
      },
    ],
  },

  // ─── Dedicated Owner Space (Protected: PROPRIETAIRE / OWNER / ADMIN) ───
  {
    path: '/owner',
    element: <RoleRoute allowedRoles={['PROPRIETAIRE', 'OWNER', 'ADMIN']} />,
    children: [
      {
        element: withSuspense(<OwnerLayout />),
        children: [
          { index: true, element: <Navigate to="/owner/dashboard" replace /> },
          { path: 'dashboard', element: withSuspense(<OwnerDashboardPage />) },
          { path: 'properties', element: withSuspense(<OwnerPropertiesPage />) },
          { path: 'listings', element: withSuspense(<OwnerListingsPage />) },
          { path: 'inquiries', element: withSuspense(<OwnerInquiriesPage />) },
          { path: 'visits', element: withSuspense(<OwnerVisitsPage />) },
          { path: 'messages', element: withSuspense(<OwnerMessagesPage />) },
        ],
      },
    ],
  },

  // ─── Dedicated Agent / Agency Admin Space (Protected) ───
  {
    path: '/agent',
    element: <RoleRoute allowedRoles={['AGENT', 'AGENCY_ADMIN', 'ADMIN']} />,
    children: [
      {
        element: withSuspense(<AgentLayout />),
        children: [
          { index: true, element: <Navigate to="/agent/dashboard" replace /> },
          { path: 'dashboard', element: withSuspense(<AgentDashboardPage />) },
          { path: 'properties', element: withSuspense(<AgentPropertiesPage />) },
          { path: 'listings', element: withSuspense(<AgentListingsPage />) },
          { path: 'clients', element: withSuspense(<AgentClientsPage />) },
          { path: 'inquiries', element: withSuspense(<AgentInquiriesPage />) },
          { path: 'visits', element: withSuspense(<AgentVisitsPage />) },
          { path: 'transactions', element: withSuspense(<AgentTransactionsPage />) },
          { path: 'commissions', element: withSuspense(<AgentCommissionsPage />) },
          { path: 'team', element: withSuspense(<AgentTeamPage />) },
          { path: 'stats', element: withSuspense(<AgentStatsPage />) },
        ],
      },
    ],
  },

  // ─── Dedicated Admin Space (Protected: ADMIN strictly) ───
  {
    path: '/admin',
    element: <RoleRoute allowedRoles={['ADMIN']} />,
    children: [
      {
        element: withSuspense(<AdminLayout />),
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: withSuspense(<AdminDashboardPage />) },
          { path: 'users', element: withSuspense(<AdminUsersPage />) },
          { path: 'agencies', element: withSuspense(<AdminAgenciesPage />) },
          { path: 'properties', element: withSuspense(<AdminPropertiesPage />) },
          { path: 'listings', element: withSuspense(<AdminListingsPage />) },
          { path: 'transactions', element: withSuspense(<AdminTransactionsPage />) },
          { path: 'payments', element: withSuspense(<AdminPaymentsPage />) },
          { path: 'reports', element: withSuspense(<AdminReportsPage />) },
          { path: 'settings', element: withSuspense(<AdminSettingsPage />) },
        ],
      },
    ],
  },
]);
