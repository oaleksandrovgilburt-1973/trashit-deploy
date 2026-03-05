'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import type { Request as TrashRequest, Message, Profile, Region } from '@/lib/database.types';
import { Trash2, ArrowLeft, Send, LogOut } from 'lucide-react';

export default function CustomerRequestDetail() {
  const router = useRouter();
  const params = useParams();
  const { profile, signOut } = useAuth();
  const requestId = params.id as string;

  const [request, setRequest] = useState<TrashRequest | null>(null);
  const [provider, setProvider] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      // Fetch request
      const { data: requestData } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestData) {
        setRequest(requestData as TrashRequest);

        // Fetch region
        const { data: regionData } = await supabase
          .from('regions')
          .select('*')
          .eq('id', requestData.region_id)
          .single();

        if (regionData) {
          setRegion(regionData as Region);
        }

        // Fetch provider if assigned
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

        // Fetch messages
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });

        if (messagesData) {
          setMessages(messagesData as Message[]);
        }
      }

      setLoading(false);
    };

    fetchData();

    // Poll for new messages every 5 seconds
    const interval = setInterval(async () => {
      if (!requestId) return;

      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData as Message[]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [profile, requestId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !profile) return;

    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        request_id: requestId,
        sender_id: profile.id,
        body: messageText,
      });

      if (error) throw error;

      setMessageText('');

      // Refresh messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData as Message[]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Неуспешно изпращане на съобщение');
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleCloseRequest = async () => {
    if (!request) return;

    try {
      setSubmitting(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Неавторизиран достъп');
        return;
      }

      const response = await fetch(`/api/v1/requests/${requestId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Грешка при затваряне на заявката');
        return;
      }

      const updatedRequest = await response.json();
      setRequest({ ...request, status: 'closed' });
      alert('Заявката е затворена успешно!');
    } catch (err) {
      console.error('Error closing request:', err);
      setError('Грешка при затваряне на заявката');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!request) return;

    try {
      setSubmitting(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Неавторизиран достъп');
        return;
      }

      const response = await fetch(`/api/v1/requests/${requestId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Грешка при отмяна на заявката');
        return;
      }

      setRequest({ ...request, status: 'cancelled' });
      setShowCancelForm(false);
      setCancelReason('');
      alert('Заявката е отменена успешно!');
    } catch (err) {
      console.error('Error cancelling request:', err);
      setError('Грешка при отмяна на заявката');
    } finally {
      setSubmitting(false);
    }
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
    switch (status) {
      case 'open':
        return 'Отворено';
      case 'assigned':
        return 'Възложено';
      case 'in_progress':
        return 'В процес';
      case 'completed':
        return 'Завършено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="customer">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Зареждане на заявка...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!request) {
    return (
      <ProtectedRoute requiredRole="customer">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Заявката не е намерена</p>
            <Link href="/dashboard/customer" className="text-green-600 hover:text-green-700 font-semibold mt-4 inline-block">
              Назад към панела
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="customer">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/customer"
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
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Request Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{request.description}</h2>
                  <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Адрес</p>
                    <p className="text-gray-900 font-semibold">{request.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Регион</p>
                      <p className="text-gray-900 font-semibold">{region?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Предложена цена</p>
                      <p className="text-gray-900 font-semibold">
                        {request.price_offer ? `${parseFloat(request.price_offer.toString()).toFixed(2)} лв.` : 'Не е зададена'}
                      </p>
                    </div>
                  </div>
                  {request.preferred_time && (
                    <div>
                      <p className="text-sm text-gray-600">Предпочитано време</p>
                      <p className="text-gray-900 font-semibold">{request.preferred_time}</p>
                    </div>
                  )}
                </div>

                {provider && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Възложен доставчик</p>
                    <p className="text-lg font-semibold text-gray-900">{provider.full_name}</p>
                    {provider.phone && (
                      <p className="text-sm text-gray-600 mt-1">{provider.phone}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {request.status === 'completed' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <button
                    onClick={handleCloseRequest}
                    disabled={submitting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 transition"
                  >
                    {submitting ? 'Обработка...' : 'Потвърди завършване'}
                  </button>
                </div>
              )}

              {['open', 'assigned', 'in_progress'].includes(request.status) && (
                <div className="bg-white rounded-lg shadow p-6">
                  {!showCancelForm ? (
                    <button
                      onClick={() => setShowCancelForm(true)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                    >
                      Отмени заявката
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Причина за отмяна</h3>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Моля, посочете причина за отмяна..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleCancelRequest}
                          disabled={submitting}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 transition"
                        >
                          {submitting ? 'Обработка...' : 'Потвърди отмяна'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCancelForm(false);
                            setCancelReason('');
                          }}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                        >
                          Откажи
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Съобщения</h3>

                <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto mb-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Нямате съобщения</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.sender_id === profile?.id
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.body}</p>
                          <p className={`text-xs mt-1 ${msg.sender_id === profile?.id ? 'text-green-100' : 'text-gray-600'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('bg-BG')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {request.status !== 'completed' && request.status !== 'cancelled' && (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Напишете съобщение..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Изпрати
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h3 className="font-semibold text-gray-900 mb-4">Информация за заявката</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">Създана</p>
                    <p className="text-gray-900 font-semibold">
                      {new Date(request.created_at).toLocaleDateString('bg-BG')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Статус</p>
                    <p className="text-gray-900 font-semibold">
                      {getStatusLabel(request.status)}
                    </p>
                  </div>
                  {request.provider_id && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-gray-600 mb-2">Доставчик възложен</p>
                      <p className="text-green-600 font-semibold">Да</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
