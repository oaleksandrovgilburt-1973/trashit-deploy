'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Trash2, CheckCircle, Circle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export default function NotificationsPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 20;

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
    }
  }, [user, router]);

  // Fetch notifications
  useEffect(() => {
    if (!session) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        const unreadOnly = filter === 'unread';
        const url = `/api/v1/notifications?limit=${pageSize}&offset=${offset}&unread_only=${unreadOnly}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [session, filter, page]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/v1/notifications', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: notificationId, read: true }),
      });

      if (!response.ok) return;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch('/api/v1/notifications', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: notificationId }),
      });

      if (!response.ok) return;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications =
    filter === 'read'
      ? notifications.filter((n) => n.read)
      : filter === 'unread'
        ? notifications.filter((n) => !n.read)
        : notifications;

  const totalPages = Math.ceil(total / pageSize);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Известия
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управлявайте вашите известия
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
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
          <button
            onClick={() => {
              setFilter('unread');
              setPage(1);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              filter === 'unread'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Непрочетени
          </button>
          <button
            onClick={() => {
              setFilter('read');
              setPage(1);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              filter === 'read'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Прочетени
          </button>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Няма известия</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors ${
                  !notification.read
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {!notification.read ? (
                      <Circle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleDateString(
                        'bg-BG',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                      >
                        Маркирай като прочетено
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Изтрий"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
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
