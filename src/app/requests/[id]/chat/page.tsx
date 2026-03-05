'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MessageThread } from '@/components/chat/MessageThread';
import { MessageInput } from '@/components/chat/MessageInput';
import { ArrowLeft, Trash2, LogOut } from 'lucide-react';
import type { Request as TrashRequest, Profile, Region } from '@/lib/database.types';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const { profile, signOut } = useAuth();
  const requestId = params.id as string;

  const [request, setRequest] = useState<TrashRequest | null>(null);
  const [provider, setProvider] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!profile) {
      router.push('/auth/signin');
      return;
    }

    loadRequestDetails();
  }, [profile, requestId]);

  async function loadRequestDetails() {
    try {
      setLoading(true);
      setError(null);

      // Get request details
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !requestData) {
        setError('Заявката не е намерена');
        return;
      }

      // Check if user is participant
      const isCustomer = requestData.customer_id === profile.id;
      const isProvider = requestData.provider_id === profile.id;

      if (!isCustomer && !isProvider) {
        setError('Нямате достъп до този чат');
        return;
      }

      setRequest(requestData as TrashRequest);

      // Get region details
      if (requestData.region_id) {
        const { data: regionData } = await supabase
          .from('regions')
          .select('*')
          .eq('id', requestData.region_id)
          .single();

        if (regionData) {
          setRegion(regionData as Region);
        }
      }

      // Get provider details if assigned
      if (requestData.provider_id) {
        const { data: providerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', requestData.provider_id)
          .single();

        if (providerData) {
          setProvider(providerData as Profile);
        }
      }
    } catch (err) {
      console.error('Error loading request:', err);
      setError('Грешка при зареждане на заявката');
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Отворено',
      assigned: 'Възложено',
      in_progress: 'В процес',
      completed: 'Завършено',
      cancelled: 'Отменено',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Зареждане...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Заявката не е намерена'}</p>
          <Link href="/dashboard/customer" className="text-green-600 hover:text-green-700">
            Назад към панела
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={profile?.role === 'customer' ? '/dashboard/customer' : '/dashboard/provider'}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Link>
            <div className="flex items-center gap-2">
              <Trash2 className="w-8 h-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">TRASHit</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{profile?.full_name}</span>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{request.description}</h2>
                  <p className="text-gray-600">{request.address}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                  {getStatusLabel(request.status)}
                </span>
              </div>

              {provider && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Възложен доставчик</p>
                  <p className="text-lg font-semibold text-gray-900">{provider.full_name}</p>
                  {provider.phone && <p className="text-sm text-gray-600 mt-1">{provider.phone}</p>}
                </div>
              )}
            </div>

            {/* Message Thread */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Съобщения</h3>

              <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto mb-4 border border-gray-200">
                <MessageThread
                  key={refreshKey}
                  requestId={requestId}
                  onNewMessage={() => {
                    // Refresh thread on new message
                    setRefreshKey((k) => k + 1);
                  }}
                />
              </div>

              <MessageInput
                requestId={requestId}
                requestStatus={request.status}
                onMessageSent={() => {
                  // Refresh thread after sending
                  setRefreshKey((k) => k + 1);
                }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Информация за заявката</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Регион</p>
                  <p className="text-gray-900 font-semibold">{region?.name || 'Неизвестен'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Цена</p>
                  <p className="text-gray-900 font-semibold">{request.price_offer} лв.</p>
                </div>
                {request.preferred_time && (
                  <div>
                    <p className="text-gray-600">Предпочитано време</p>
                    <p className="text-gray-900 font-semibold">{request.preferred_time}</p>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-gray-600">Статус</p>
                  <p className="text-gray-900 font-semibold">{getStatusLabel(request.status)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Създана</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(request.created_at).toLocaleDateString('bg-BG')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
