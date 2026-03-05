'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle, MessageSquare, Flag, Clock } from 'lucide-react';
import Link from 'next/link';

interface Request {
  id: string;
  customer_id: string;
  provider_id: string;
  description: string;
  address: string;
  status: string;
  price_offer: number;
  created_at: string;
  updated_at: string;
  dispute_id?: string;
}

interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: string;
}

export default function RequestDetailPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<Request | null>(null);
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [provider, setProvider] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch request details
  useEffect(() => {
    if (!user || !session) return;

    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/v1/requests/${requestId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch request');
        }

        const data = await response.json();
        setRequest(data);

        // Fetch customer and provider details
        if (data.customer_id) {
          const customerRes = await fetch(
            `/api/v1/profiles/${data.customer_id}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );
          if (customerRes.ok) {
            const customerData = await customerRes.json();
            setCustomer(customerData);
          }
        }

        if (data.provider_id) {
          const providerRes = await fetch(
            `/api/v1/profiles/${data.provider_id}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );
          if (providerRes.ok) {
            const providerData = await providerRes.json();
            setProvider(providerData);
          }
        }
      } catch (err) {
        console.error('Error fetching request:', err);
        setError('Грешка при зареждане на заявката');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [user, session, requestId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'assigned':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'in_progress':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'disputed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'closed':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Отворено',
      assigned: 'Назначено',
      in_progress: 'В процес',
      completed: 'Завършено',
      disputed: 'Спор',
      closed: 'Затворено',
      cancelled: 'Отменено',
    };
    return labels[status] || status;
  };

  const canOpenDispute = () => {
    if (!user || !request) return false;
    // Only customer can open dispute
    if (request.customer_id !== user.id) return false;
    // Only for completed requests
    if (request.status !== 'completed') return false;
    // Not if already disputed
    if (request.dispute_id) return false;
    return true;
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'Заявката не е намерена'}
            </p>
            <Link
              href="/dashboard"
              className="inline-block text-blue-600 hover:text-blue-700 font-medium"
            >
              Назад към панела
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Детайли на заявката
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Заявка #{requestId.slice(0, 8)}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${getStatusColor(request.status)}`}>
            {getStatusLabel(request.status)}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Description */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Описание на работата
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {request.description}
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Адрес
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {request.address}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Предложена цена
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {request.price_offer} BGN
                  </p>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Участници
              </h2>
              <div className="space-y-4">
                {customer && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Клиент
                      </p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {customer.full_name}
                      </p>
                    </div>
                    {customer.phone && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {customer.phone}
                      </p>
                    )}
                  </div>
                )}
                {provider && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Доставчик
                      </p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {provider.full_name}
                      </p>
                    </div>
                    {provider.phone && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {provider.phone}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Времева линия
              </h2>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Създадено
                    </p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {new Date(request.created_at).toLocaleDateString(
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
                </div>
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Последна актуализация
                    </p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {new Date(request.updated_at).toLocaleDateString(
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
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sticky top-4 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Действия
              </h2>

              {/* Chat Button */}
              {request.status !== 'open' && (
                <Link
                  href={`/requests/${requestId}/chat`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  Отворете чата
                </Link>
              )}

              {/* Dispute Button */}
              {canOpenDispute() && (
                <Link
                  href={`/requests/${requestId}/dispute`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Flag className="w-4 h-4" />
                  Отворете спор
                </Link>
              )}

              {/* Info Box */}
              {request.status === 'completed' && !canOpenDispute() && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
                  {request.dispute_id
                    ? 'За тази заявка вече е отворен спор'
                    : 'Спорът може да бъде отворен само в рамките на 48 часа'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
