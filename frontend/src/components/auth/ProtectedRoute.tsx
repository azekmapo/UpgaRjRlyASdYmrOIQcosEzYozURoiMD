import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Suspense } from 'react';
import LoadingSpinner from '../loading-spinner';
import type { UserRole } from '@/config';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  roles?: UserRole[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: React.ComponentType<any>;
}


export default function ProtectedRoute({ 
  children, 
  roles, 
  component: Component 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0) {
    const hasRequiredRole = user?.role && roles.includes(user.role as UserRole);
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (Component) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Component />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children || <Outlet />}
    </Suspense>
  );
}
