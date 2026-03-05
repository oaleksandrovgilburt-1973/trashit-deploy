'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';

interface Request {
  id: string;
  customer_id: string;
  provider_id: string;
  description: string;
  address: string;
  status: string;
  updated_at: string;
}

type DisputeReason = 'incomplete_work' | 'poor_quality' | 'no_show' | 'other';

export default function DisputePage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [reason, setReason] = useState<DisputeReason>('incomplete_work');
  const [description, setDescription] = useState('');

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
      } catch (err) {
        console.error('Error fetching request:', err);
        setError('Грешка при зареждане на заявката');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [user, session, requestId]);

  // Handle dispute submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/requests/${requestId}/dispute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при отваряне на спор');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/requests/${requestId}`);
      }, 2000);
    } catch (err) {
      console.error('Error opening dispute:', err);
      setError(
        err instanceof Error ? err.message : 'Грешка при обработка'
      );
    } finally {
      setIsSubmitting(false);
    }
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

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Заявката не е намерена
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              Назад към панела
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Verify user is customer
  if (request.customer_id !== user.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Нямате достъп до тази страница
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
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
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Отваряне на спор
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Опишете проблема с завършената работа
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-200">
                Спорът е успешно отворен
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Администраторът ще разгледа вашия спор в скоро време.
              </p>
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

        {/* Request Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Информация за заявката
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Описание
              </p>
              <p className="text-gray-900 dark:text-white font-medium">
                {request.description}
              </p>
            </div>
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
                Статус
              </p>
              <p className="text-gray-900 dark:text-white font-medium">
                {request.status === 'completed' ? 'Завършено' : request.status}
              </p>
            </div>
          </div>
        </div>

        {/* Dispute Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6">
          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Причина за спор *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputeReason)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="incomplete_work">Работата не е завършена</option>
              <option value="poor_quality">Лоша качество на работата</option>
              <option value="no_show">Доставчикът не се явил</option>
              <option value="other">Друго</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Описание на проблема *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишете детайлно какъв е проблемът с работата..."
              rows={6}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Колкото повече детайли предоставите, толкова по-добре администраторът ще може да разреши спора.
            </p>
          </div>

          {/* Info Box */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Важно:</strong> Спорът спира автоматичното затваряне на работата. Администраторът ще разгледа вашия спор и ще вземе решение за разрешаване.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Отмяна
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Отваряне на спор...
                </>
              ) : (
                'Отворете спор'
              )}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Кога мога да отворя спор?
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>✓ Работата трябва да бъде в статус "Завършено"</li>
            <li>✓ Спорът трябва да бъде отворен в рамките на 48 часа след завършване</li>
            <li>✓ Можете да отворите спор само веднъж за всяка работа</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
