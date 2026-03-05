'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Dashboard() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'customer') {
        router.push('/dashboard/customer');
      } else if (profile.role === 'provider') {
        router.push('/dashboard/provider');
      } else if (profile.role === 'admin') {
        router.push('/dashboard/admin');
      }
    }
  }, [profile, loading, router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
