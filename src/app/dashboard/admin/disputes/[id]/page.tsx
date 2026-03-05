'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';

interface DisputeDetail {
  id: string;
  request_id: string;
  opened_by_id: string;
  opened_against_id: string;
  reason: string;
  description?: string;
  status: string;
  resolution?: string;
  created_at: string;
  resolved_at?: string;
  opened_by?: { id: string; full_name: string; phone?: string };
  opened_against?: { id: string; full_name: string; phone?: string };
  request?: { id: string; description: string; address: string; status: string };
}

interface DisputeEvidence {
  id: string;
  file_url: string;
  file_type?: string;
  description?: string;
  created_at: string;
}

export default function DisputeDetailPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [evidence, setEvidence] = useState<DisputeEvidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);

  // Fetch dispute details
  useEffect(() => {
    if (!user || !session) return;

    const fetchDispute = async () => {
      try {
        const response = await fetch(
          `/api/v1/admin/disputes/${disputeId}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch dispute');
        }

        const data = await response.json();
        setDispute(data.dispute);
        setEvidence(data.evidence || []);
      } catch (err) {
        console.error('Error fetching dispute:', err);
        setError('Грешка при зареждане на спора');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDispute();
  }, [user, session, disputeId]);

  // Handle dispute resolution
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

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
            status: 'resolved',
            refund_amount: refundAmount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при разрешаване на спор');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/admin/disputes');
      }, 2000);
    } catch (err) {
      console.error('Error resolving dispute:', err);
      setError(
        err instanceof Error ? err.message : 'Грешка при обработка'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      incomplete_work: 'Работата не е завършена',
      poor_quality: 'Лоша качество',
      no_show: 'Не се явил',
      other: 'Друго',
    };
    return labels[reason] || reason;
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

  if (!dispute) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Спорът не е намерен
            </p>
            <Link
              href="/dashboard/admin/disputes"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              Назад към спорове
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
        <div className="mb-8">
          <Link
            href="/dashboard/admin/disputes"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Назад към спорове
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Детайли на спор
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Спор #{disputeId.slice(0, 8)}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-200">
                Спорът е успешно разрешен
              </h3>
            </div>
          </div>
        )}

        {/* Error Message */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dispute Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Информация за спора
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Причина
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {getReasonLabel(dispute.reason)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Описание
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {dispute.description || 'Без описание'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Статус
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {dispute.status === 'open' ? 'Отворено' : 'Разрешено'}
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
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Отворил спор
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {dispute.opened_by?.full_name}
                  </p>
                  {dispute.opened_by?.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dispute.opened_by.phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Срещу
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {dispute.opened_against?.full_name}
                  </p>
                  {dispute.opened_against?.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dispute.opened_against.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Request Details */}
            {dispute.request && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Заявка
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Описание
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {dispute.request.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Адрес
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {dispute.request.address}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Evidence */}
            {evidence.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Доказателства
                </h2>
                <div className="space-y-3">
                  {evidence.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                    >
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {item.file_type || 'Файл'}
                      </a>
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resolution Form */}
          <div className="lg:col-span-1">
            {dispute.status === 'open' && (
              <form onSubmit={handleResolve} className="bg-white dark:bg-gray-800 rounded-lg p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Разрешаване на спор
                </h2>

                {/* Resolution */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Решение *
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Опишете решението..."
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Refund Amount */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Сума за възстановяване (BGN)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !resolution.trim()}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Разрешаване...
                    </>
                  ) : (
                    'Разрешете спор'
                  )}
                </button>
              </form>
            )}

            {dispute.status !== 'open' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Решение
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Статус
                    </p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      Разрешено
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Решение
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {dispute.resolution}
                    </p>
                  </div>
                  {dispute.resolved_at && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Разрешено на
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(dispute.resolved_at).toLocaleDateString(
                          'bg-BG'
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
