'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/lib/constants';
import { getAllowedTransitions, getTransitionLabel } from '@/lib/stateMachine';
import ProofUploader from '@/components/provider/ProofUploader';
import { AlertCircle, CheckCircle, Clock, MapPin, DollarSign } from 'lucide-react';

interface Request {
  id: string;
  description: string;
  address: string;
  region_id: string;
  price_offer: number;
  status: string;
  customer_id: string;
  started_at?: string;
  completed_at?: string;
  completion_notes?: string;
}

export default function JobManagePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [transitioningTo, setTransitioningTo] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    loadRequest();
  }, [user, params.id]);

  const loadRequest = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', params.id)
        .single();

      if (fetchError || !data) {
        setError('Заявката не е намерена');
        return;
      }

      if (data.provider_id !== user?.id) {
        setError('Вие не сте възложени на тази заявка');
        return;
      }

      setRequest(data);

      // Load proof photos
      const { data: files } = await supabase.storage
        .from('request-proofs')
        .list(`${params.id}/`);

      if (files) {
        const urls = files.map((file) => {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from('request-proofs')
            .getPublicUrl(`${params.id}/${file.name}`);
          return publicUrl;
        });
        setProofPhotos(urls);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка при зареждане');
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = async (toStatus: string) => {
    if (!request || !user) return;

    setTransitioningTo(toStatus);
    setError(null);
    setSuccess(false);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      let endpoint = '';
      let body: any = {};

      if (toStatus === 'in_progress') {
        endpoint = `/api/v1/requests/${params.id}/start`;
      } else if (toStatus === 'completed') {
        endpoint = `/api/v1/requests/${params.id}/complete`;
        body = { notes: completionNotes };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'proof_photos_required') {
          setError('Трябва да качите поне 1 снимка преди да завършите');
        } else {
          setError(data.error || data.message || 'Грешка при промяна на статус');
        }
        return;
      }

      setSuccess(true);
      setRequest({ ...request, status: toStatus });
      setTimeout(() => {
        router.push('/provider/jobs');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка при промяна на статус');
    } finally {
      setTransitioningTo(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Грешка</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allowedTransitions = getAllowedTransitions(request.status as any);
  const statusColor = REQUEST_STATUS_COLORS[request.status as keyof typeof REQUEST_STATUS_COLORS] || 'gray';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 mb-4"
          >
            ← Назад
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Управление на заявка
          </h1>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600 dark:text-green-400">
              Статусът е променен успешно. Пренасочване...
            </p>
          </div>
        )}

        {/* Request Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Детайли на заявката
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-${statusColor}-600`}
            >
              {REQUEST_STATUS_LABELS[request.status as keyof typeof REQUEST_STATUS_LABELS]}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Описание
              </label>
              <p className="text-gray-900 dark:text-white">{request.description}</p>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Адрес
                </label>
                <p className="text-gray-900 dark:text-white">{request.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Предложена цена
                </label>
                <p className="text-gray-900 dark:text-white">{request.price_offer} лв.</p>
              </div>
            </div>

            {request.started_at && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Начало на работа
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(request.started_at).toLocaleString('bg-BG')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Proof Photos */}
        {request.status === 'in_progress' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <ProofUploader
              requestId={params.id}
              onPhotosChange={setProofPhotos}
            />
          </div>
        )}

        {/* Completion Notes */}
        {request.status === 'in_progress' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Бележки при завършване (опционално)
            </label>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Например: Работата е завършена, площадката е почистена..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Действия
          </h3>

          <div className="space-y-3">
            {allowedTransitions.map((toStatus) => (
              <button
                key={toStatus}
                onClick={() => handleTransition(toStatus)}
                disabled={transitioningTo !== null}
                className={`w-full px-4 py-3 rounded-lg font-medium transition ${
                  toStatus === 'in_progress'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : toStatus === 'completed'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                } ${transitioningTo !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {transitioningTo === toStatus ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Обработка...
                  </span>
                ) : (
                  getTransitionLabel(request.status as any, toStatus)
                )}
              </button>
            ))}

            {allowedTransitions.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                Няма налични действия за този статус
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
