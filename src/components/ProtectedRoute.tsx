'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/database.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/auth/signin');
    }

    if (!loading && profile && requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(profile.role)) {
        router.push('/dashboard');
      }
    }
  }, [session, profile, loading, router, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Зареждане...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
