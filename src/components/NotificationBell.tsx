'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, X, Check } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export function NotificationBell() {
  const { user, session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!session) return;

    try {
      const response = await fetch('/api/v1/notifications?limit=10&unread_only=false', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      setNotifications(data.notifications || []);

      // Calculate unread count
      const unread = (data.notifications || []).filter(
        (n: Notification) => !n.read
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch unread count periodically
  useEffect(() => {
    if (!user || !session) return;

    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [user, session]);

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

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/v1/notifications?action=mark_all_read', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) return;

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
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

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        aria-label="Известия"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Известия
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Няма известия
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !notification.read
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleDateString(
                          'bg-BG',
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={() =>
                            handleMarkAsRead(notification.id)
                          }
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                          title="Маркирай като прочетено"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                        title="Изтрий"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <button
                onClick={handleMarkAllAsRead}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Маркирай всички като прочетени
              </button>
              <Link
                href="/dashboard/notifications"
                className="flex-1 px-3 py-2 text-sm font-medium text-center bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              >
                Всички известия
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
