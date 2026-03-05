'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface UserDetail {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  provider_status?: string;
  is_blocked: boolean;
  is_banned: boolean;
  created_at: string;
  bio?: string;
  avatar_url?: string;
}

interface Request {
  id: string;
  description: string;
  status: string;
  created_at: string;
}

export default function AdminUserDetailPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  // Fetch user details
  useEffect(() => {
    if (!user || !session) return;

    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/v1/admin/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }

        const data = await response.json();
        setUserDetail(data.user);
        setRequests(data.requests || []);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Грешка при зареждане на потребител');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [user, session, userId]);

  // Handle user actions
  const handleAction = async (action: string) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при обработка');
      }

      setUserDetail(data.user);
      setSuccess(data.message);
      setReason('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Грешка при обработка');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div>
        <Link
          href="/admin/users"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Назад към потребители
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Потребителят не е намерен
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Назад към потребители
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {userDetail.full_name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {userDetail.email}
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-200">
              Грешка
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-200">
              Успех
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {success}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Информация
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Роля
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {userDetail.role === 'customer'
                    ? 'Клиент'
                    : userDetail.role === 'provider'
                      ? 'Доставчик'
                      : 'Администратор'}
                </p>
              </div>
              {userDetail.role === 'provider' && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Статус на доставчик
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {userDetail.provider_status === 'pending'
                      ? 'Очаква одобрение'
                      : 'Одобрен'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Телефон
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {userDetail.phone || 'Не е предоставен'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Регистриран
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {new Date(userDetail.created_at).toLocaleDateString(
                    'bg-BG'
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Статус
                </p>
                <div className="mt-1">
                  {userDetail.is_banned && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                      Забранен
                    </span>
                  )}
                  {userDetail.is_blocked && !userDetail.is_banned && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200">
                      Спрян
                    </span>
                  )}
                  {!userDetail.is_blocked && !userDetail.is_banned && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                      Активен
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Requests */}
          {requests.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Последни работи
              </h2>
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {req.description}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(req.created_at).toLocaleDateString('bg-BG')} -{' '}
                      {req.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Действия
            </h2>

            <div className="space-y-3">
              {/* Approve Provider */}
              {userDetail.role === 'provider' &&
                userDetail.provider_status === 'pending' && (
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Одобряване...
                      </>
                    ) : (
                      'Одобри доставчик'
                    )}
                  </button>
                )}

              {/* Suspend Button */}
              {!userDetail.is_blocked && !userDetail.is_banned && (
                <div>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Причина за спиране..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm mb-2"
                  />
                  <button
                    onClick={() => handleAction('suspend')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Спиране...
                      </>
                    ) : (
                      'Спрете потребител'
                    )}
                  </button>
                </div>
              )}

              {/* Unsuspend Button */}
              {userDetail.is_blocked && !userDetail.is_banned && (
                <button
                  onClick={() => handleAction('unsuspend')}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Възстановяване...
                    </>
                  ) : (
                    'Възстановете потребител'
                  )}
                </button>
              )}

              {/* Ban Button */}
              {!userDetail.is_banned && (
                <div>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Причина за забрана..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm mb-2"
                  />
                  <button
                    onClick={() => handleAction('ban')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Забрана...
                      </>
                    ) : (
                      'Забранете потребител'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
