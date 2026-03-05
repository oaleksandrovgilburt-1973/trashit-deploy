'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface DisputeDetail {
  id: string;
  reason: string;
  description?: string;
  status: string;
  resolution?: string;
  created_at: string;
  resolved_at?: string;
  opened_by: {
    id: string;
    full_name: string;
    phone?: string;
  };
  opened_against: {
    id: string;
    full_name: string;
    phone?: string;
  };
  request: {
    id: string;
    description: string;
    address?: string;
    status: string;
  };
}

interface Evidence {
  id: string;
  file_url: string;
  file_type?: string;
  description?: string;
  uploaded_by_id: string;
  created_at: string;
}

export default function AdminDisputeDetailPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [winner, setWinner] = useState<'provider' | 'customer'>('provider');
  const [refundAmount, setRefundAmount] = useState(0);

  // Fetch dispute details
  useEffect(() => {
    if (!user || !session) return;

    const fetchDispute = async () => {
      try {
        const response = await fetch(`/api/v1/admin/disputes/${disputeId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dispute');
        }

        const data = await response.json();
        setDispute(data.dispute);
        setEvidence(data.evidence || []);
      } catch (err) {
        console.error('Error fetching dispute:', err);
        setError('Грешка при зареждане на спор');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDispute();
  }, [user, session, disputeId]);

  // Handle resolve dispute
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/v1/admin/disputes/${disputeId}/resolve`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resolution,
            winner,
            refund_amount: refundAmount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при разрешение');
      }

      setSuccess('Спорът е успешно разрешен');
      setDispute(data.dispute);
      setResolution('');
      setWinner('provider');
      setRefundAmount(0);
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

  if (!dispute) {
    return (
      <div>
        <Link
          href="/admin/disputes"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Назад към спорове
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Спорът не е намерен
          </p>
        </div>
      </div>
    );
  }

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      incomplete_work: 'Незавършена работа',
      poor_quality: 'Лошо качество',
      no_show: 'Не се появи',
      other: 'Други',
    };
    return reasons[reason] || reason;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/disputes"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Назад към спорове
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Спор #{dispute.id.slice(0, 8)}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {getReasonLabel(dispute.reason)}
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
          {/* Dispute Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Детайли на спора
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Статус
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {dispute.status === 'open'
                    ? 'Отворен'
                    : dispute.status === 'resolved'
                      ? 'Разрешен'
                      : 'Затворен'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Причина
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {getReasonLabel(dispute.reason)}
                </p>
              </div>
              {dispute.description && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Описание
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {dispute.description}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Отворен на
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {new Date(dispute.created_at).toLocaleDateString('bg-BG')}
                </p>
              </div>
              {dispute.resolution && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Разрешение
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {dispute.resolution}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Отворил спор
              </h3>
              <p className="text-gray-900 dark:text-white font-medium">
                {dispute.opened_by.full_name}
              </p>
              {dispute.opened_by.phone && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {dispute.opened_by.phone}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Срещу
              </h3>
              <p className="text-gray-900 dark:text-white font-medium">
                {dispute.opened_against.full_name}
              </p>
              {dispute.opened_against.phone && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {dispute.opened_against.phone}
                </p>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Детайли на работата
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Описание
                </p>
                <p className="text-gray-900 dark:text-white">
                  {dispute.request.description}
                </p>
              </div>
              {dispute.request.address && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Адрес
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {dispute.request.address}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Статус на работата
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {dispute.request.status}
                </p>
              </div>
            </div>
          </div>

          {/* Evidence */}
          {evidence.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Доказателства
              </h2>
              <div className="space-y-3">
                {evidence.map((e) => (
                  <div
                    key={e.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <a
                      href={e.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      {e.file_type || 'Файл'}
                    </a>
                    {e.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {e.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resolution Form */}
        {dispute.status === 'open' && (
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Разрешение
              </h2>

              <form onSubmit={handleResolve} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Победител
                  </label>
                  <select
                    value={winner}
                    onChange={(e) =>
                      setWinner(e.target.value as 'provider' | 'customer')
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="provider">Доставчик</option>
                    <option value="customer">Клиент</option>
                  </select>
                </div>

                {winner === 'customer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Сума за възстановяване (BGN)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) =>
                        setRefundAmount(parseFloat(e.target.value) || 0)
                      }
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Разрешение
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Обяснете решението..."
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !resolution}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Разрешение...
                    </>
                  ) : (
                    'Разрешете спор'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
