import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import type { Role } from '@/types';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/profile" replace /> : <Outlet />;
}

export function RoleRoute({ allowedRoles }: { allowedRoles: (Role | string)[] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = user.role;
  const isAllowed = allowedRoles.some(
    (r) =>
      r === role ||
      (r === 'PROPRIETAIRE' && role === 'OWNER') ||
      (r === 'OWNER' && role === 'PROPRIETAIRE') ||
      (r === 'LOCATAIRE' && role === 'CLIENT') ||
      (r === 'CLIENT' && role === 'LOCATAIRE'),
  );

  if (!isAllowed) {
    // Rediriger vers l'espace correspondant au profil réel de l'utilisateur
    if (role === 'LOCATAIRE' || role === 'CLIENT') {
      return <Navigate to="/tenant/dashboard" replace />;
    }
    if (role === 'PROPRIETAIRE' || role === 'OWNER') {
      return <Navigate to="/owner/dashboard" replace />;
    }
    if (role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}
