'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RequestForm from '@/components/forms/RequestForm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewRequestPage() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const [regions, setRegions] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (profile && profile.role !== 'customer') {
      router.push('/dashboard');
      return;
    }

    // Fetch regions
    const fetchRegions = async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching regions:', error);
      } else {
        setRegions(data || []);
      }

      setLoading(false);
    };

    fetchRegions();
  }, [session, profile, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Зареждане...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Създай нова заявка
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Попълнете формата, за да публикувате заявка за отвоз на боклук
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <RequestForm regions={regions} />
        </div>
      </div>
    </div>
  );
}
