'use client';

import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!user || profile?.role !== 'admin')) {
      router.push('/sign-in');
    }
  }, [user, profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
