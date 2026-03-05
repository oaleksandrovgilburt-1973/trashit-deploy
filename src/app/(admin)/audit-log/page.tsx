'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, AlertCircle } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_name: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  created_at: string;
}

export default function AdminAuditLogPage() {
  const { user, session } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 50;

  // Fetch audit logs
  useEffect(() => {
    if (!session) return;

    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        const params = new URLSearchParams({
          limit: pageSize.toString(),
          offset: offset.toString(),
        });

        if (search) params.append('search', search);
        if (entityType) params.append('entity_type', entityType);
        if (action) params.append('action', action);

        const response = await fetch(`/api/v1/admin/audit-log?${params}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }

        const data = await response.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [session, search, entityType, action, page]);

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      request: 'Заявка',
      dispute: 'Спор',
      user: 'Потребител',
      payment: 'Плащане',
      payout: 'Изплащане',
      message: 'Съобщение',
    };
    return labels[type] || type;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: 'Създадено',
      updated: 'Актуализирано',
      deleted: 'Изтрито',
      status_changed: 'Статус променен',
      accepted: 'Приемане',
      completed: 'Завършено',
      resolved: 'Разрешено',
      approved: 'Одобрено',
      suspended: 'Спряно',
      banned: 'Забранено',
    };
    return labels[action] || action;
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
          Дневник на аудита
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Преглед на всички системни събития и действия
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Търсене
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Търсене в описанието..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Тип сущност
            </label>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Всички типове</option>
              <option value="request">Заявка</option>
              <option value="dispute">Спор</option>
              <option value="user">Потребител</option>
              <option value="payment">Плащане</option>
              <option value="payout">Изплащане</option>
              <option value="message">Съобщение</option>
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Действие
            </label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Всички действия</option>
              <option value="created">Създадено</option>
              <option value="updated">Актуализирано</option>
              <option value="deleted">Изтрито</option>
              <option value="status_changed">Статус променен</option>
              <option value="accepted">Приемане</option>
              <option value="completed">Завършено</option>
              <option value="resolved">Разрешено</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setEntityType('');
                setAction('');
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Изчистване на филтри
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Няма намерени записи в дневника
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Актьор
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Действие
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Описание
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Дата
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.actor_name}
                        </p>
                        {log.actor_email && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {log.actor_email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        {getEntityTypeLabel(log.entity_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {log.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleDateString('bg-BG')}{' '}
                        {new Date(log.created_at).toLocaleTimeString('bg-BG')}
                      </p>
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

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Общо записи
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {total}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Записи на страница
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {logs.length}
          </p>
        </div>
      </div>
    </div>
  );
}
