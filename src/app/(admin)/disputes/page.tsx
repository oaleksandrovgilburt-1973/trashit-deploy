'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface Dispute {
  id: string;
  reason: string;
  status: string;
  opened_by_id: string;
  opened_against_id: string;
  created_at: string;
  resolved_at?: string;
}

export default function AdminDisputesPage() {
  const { user, session } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 20;

  // Fetch disputes
  useEffect(() => {
    if (!session) return;

    const fetchDisputes = async () => {
      setIsLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        const params = new URLSearchParams({
          limit: pageSize.toString(),
          offset: offset.toString(),
        });

        if (status) params.append('status', status);

        const response = await fetch(`/api/v1/admin/disputes?${params}`, {
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
  }, [session, status, page]);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
            Отворен
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
            Разрешен
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
            Затворен
          </span>
        );
      default:
        return null;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      incomplete_work: 'Незавършена работа',
      poor_quality: 'Лошо качество',
      no_show: 'Не се появи',
      other: 'Други',
    };
    return reasons[reason] || reason;
  };

  const totalPages = Math.ceil(total / pageSize);

  if (!user) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Управление на спорове
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Преглед и разрешение на всички спорове
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Статус:
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Всички</option>
            <option value="open">Отворени</option>
            <option value="resolved">Разрешени</option>
            <option value="closed">Затворени</option>
          </select>
        </div>
      </div>

      {/* Disputes Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Няма намерени спорове
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Причина
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Отворен
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Действие
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {disputes.map((dispute) => (
                  <tr
                    key={dispute.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getReasonLabel(dispute.reason)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(dispute.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(dispute.created_at).toLocaleDateString(
                          'bg-BG'
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/disputes/${dispute.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Преглед
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  );
}
