'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileText, Loader } from 'lucide-react';
import Link from 'next/link';

interface Dispute {
  id: string;
  request_id: string;
  opened_by_id: string;
  opened_against_id: string;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminDisputesPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 20;

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
    }
  }, [user, router]);

  // Fetch disputes
  useEffect(() => {
    if (!session) return;

    const fetchDisputes = async () => {
      setIsLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        const statusFilter =
          filter === 'all' ? '' : `&status=${filter === 'open' ? 'open' : 'resolved'}`;
        const url = `/api/v1/admin/disputes?limit=${pageSize}&offset=${offset}${statusFilter}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch disputes');
        }

        const data = await response.json();
        setDisputes(data.disputes || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error('Error fetching disputes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDisputes();
  }, [session, filter, page]);

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      incomplete_work: 'Работата не е завършена',
      poor_quality: 'Лоша качество',
      no_show: 'Не се явил',
      other: 'Друго',
    };
    return labels[reason] || reason;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
            Отворено
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
            Разрешено
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
            Затворено
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
            {status}
          </span>
        );
    }
  };

  if (!user) {
    return null;
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Управление на спорове
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Разглеждайте и разрешавайте отворени спорове
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setFilter('open');
              setPage(1);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              filter === 'open'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Отворени
          </button>
          <button
            onClick={() => {
              setFilter('resolved');
              setPage(1);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              filter === 'resolved'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Разрешени
          </button>
          <button
            onClick={() => {
              setFilter('all');
              setPage(1);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Всички
          </button>
        </div>

        {/* Disputes List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Няма спорове в тази категория
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <Link
                key={dispute.id}
                href={`/dashboard/admin/disputes/${dispute.id}`}
                className="block bg-white dark:bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Спор #{dispute.id.slice(0, 8)}
                      </h3>
                      {getStatusBadge(dispute.status)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {dispute.description || 'Без описание'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        <strong>Причина:</strong> {getReasonLabel(dispute.reason)}
                      </span>
                      <span>
                        <strong>Заявка:</strong> #{dispute.request_id.slice(0, 8)}
                      </span>
                      <span>
                        <strong>Създадено:</strong>{' '}
                        {new Date(dispute.created_at).toLocaleDateString(
                          'bg-BG'
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Преглед
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Предишна
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Страница {page} от {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Следваща
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
