'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { acceptRequest } from '@/lib/db/acceptRequest';
import type { Request as TrashRequest } from '@/lib/database.types';
import {
  Trash2,
  LogOut,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { profile, signOut } = useContext(AuthContext);
  const [request, setRequest] = useState<TrashRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const requestId = params.id as string;

  useEffect(() => {
    const fetchRequest = async () => {
      if (!profile || profile.provider_status !== 'approved') {
        router.push('/provider/jobs');
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (fetchError || !data) {
          setError('Работата не е намерена');
          return;
        }

        setRequest(data);
      } catch (err) {
        setError('Грешка при зареждане на работата');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [profile, requestId, router]);

  const handleAccept = async () => {
    if (!request || !profile) return;

    setAccepting(true);
    setError(null);
    setSuccess(null);

    try {
      // Get auth session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('Сесията е изтекла. Моля, влезте отново');
        setAccepting(false);
        return;
      }

      // Call atomic accept function
      const result = await acceptRequest(
        request.id,
        profile.id,
        session.access_token
      );

      if (!result.success) {
        if (result.error === 'already_taken') {
          setError(
            'Тази работа вече е възложена на друг доставчик. Опитайте друга работа.'
          );
        } else if (result.error === 'not_in_region') {
          setError('Вие не работите в този регион');
        } else if (result.error === 'not_approved') {
          setError('Вашият профил не е одобрен');
        } else {
          setError(result.message || 'Грешка при приемане на работата');
        }
        setAccepting(false);
        return;
      }

      setSuccess('Работата е успешно възложена!');
      setRequest({ ...request, status: 'assigned', provider_id: profile.id });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/provider');
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Грешка при приемане на работата'
      );
    } finally {
      setAccepting(false);
    }
  };

  if (!profile || profile.provider_status !== 'approved') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              TRASHit
            </h1>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Изход
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад
        </button>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Зареждане...</p>
          </div>
        ) : !request ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Работата не е намерена
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  {success}
                </p>
              </div>
            )}

            {/* Status Badge */}
            <div className="mb-6">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  request.status === 'open'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : request.status === 'assigned'
                    ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                    : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                }`}
              >
                {request.status === 'open'
                  ? 'Отворено'
                  : request.status === 'assigned'
                  ? 'Възложено'
                  : 'Завършено'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {request.description}
            </h1>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Address */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Адрес
                </h3>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  <p className="text-gray-900 dark:text-white">
                    {request.address}
                  </p>
                </div>
              </div>

              {/* Preferred Time */}
              {request.preferred_time && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Предпочитано време
                  </h3>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    <p className="text-gray-900 dark:text-white">
                      {request.preferred_time}
                    </p>
                  </div>
                </div>
              )}

              {/* Price Offer */}
              {request.price_offer && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Предложена цена
                  </h3>
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {request.price_offer} лева
                    </p>
                  </div>
                </div>
              )}

              {/* Created */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Създадено
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {new Date(request.created_at).toLocaleDateString('bg-BG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Action Button */}
            {request.status === 'open' && (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {accepting ? 'Приемане на работата...' : 'Приеми работата'}
              </button>
            )}

            {request.status === 'assigned' && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300">
                  Тази работа вече е възложена на друг доставчик
                </p>
              </div>
            )}

            {request.status === 'completed' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-300">
                  Тази работа е завършена
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
