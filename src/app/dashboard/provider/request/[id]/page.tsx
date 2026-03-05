'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import type { Request as TrashRequest, Message, Profile, Region } from '@/lib/database.types';
import { Trash2, ArrowLeft, Send, LogOut, CheckCircle } from 'lucide-react';

export default function ProviderRequestDetail() {
  const router = useRouter();
  const params = useParams();
  const { profile, signOut } = useAuth();
  const requestId = params.id as string;

  const [request, setRequest] = useState<TrashRequest | null>(null);
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [completing, setCompleting] = useState(false);

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

        // Fetch customer
        const { data: customerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', requestData.customer_id)
          .single();

        if (customerData) {
          setCustomer(customerData as Profile);
        }

        // Fetch region
        const { data: regionData } = await supabase
          .from('regions')
          .select('*')
          .eq('id', requestData.region_id)
          .single();

        if (regionData) {
          setRegion(regionData as Region);
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

    // Poll for new messages and request updates every 5 seconds
    const interval = setInterval(async () => {
      if (!requestId) return;

      // Fetch updated request
      const { data: requestData } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestData) {
        setRequest(requestData as TrashRequest);
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
    }, 5000);

    return () => clearInterval(interval);
  }, [profile, requestId]);

  const handleAcceptRequest = async () => {
    if (!profile) return;

    setAccepting(true);

    try {
      // Check if request is still open and not assigned
      const { data: currentRequest } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (currentRequest && currentRequest.status !== 'open') {
        alert('Тази заявка вече не е налична');
        setAccepting(false);
        return;
      }

      if (currentRequest && currentRequest.provider_id) {
        alert('Друг доставчик вече е приел тази работа');
        setAccepting(false);
        return;
      }

      // Update request with provider_id and status
      const { error } = await supabase
        .from('requests')
        .update({
          provider_id: profile.id,
          status: 'assigned',
        })
        .eq('id', requestId)
        .eq('status', 'open')
        .eq('provider_id', null);

      if (error) throw error;

      // Refresh request
      const { data: updatedRequest } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (updatedRequest) {
        setRequest(updatedRequest as TrashRequest);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Неуспешно приемане на заявка. Може да е приета от друг доставчик.');
    } finally {
      setAccepting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!profile) return;

    setCompleting(true);

    try {
      const { error } = await supabase
        .from('requests')
        .update({
          status: 'completed',
        })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh request
      const { data: updatedRequest } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (updatedRequest) {
        setRequest(updatedRequest as TrashRequest);
      }
    } catch (error) {
      console.error('Error completing request:', error);
      alert('Неуспешно отбелязване на заявка като завършена');
    } finally {
      setCompleting(false);
    }
  };

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
      <ProtectedRoute requiredRole="provider">
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
      <ProtectedRoute requiredRole="provider">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Заявката не е намерена</p>
            <Link href="/dashboard/provider" className="text-green-600 hover:text-green-700 font-semibold mt-4 inline-block">
              Назад към панела
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const isMyRequest = request.provider_id === profile?.id;

  return (
    <ProtectedRoute requiredRole="provider">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/provider"
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

                {customer && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Клиент</p>
                    <p className="text-lg font-semibold text-gray-900">{customer.full_name}</p>
                    {customer.phone && (
                      <p className="text-sm text-gray-600 mt-1">{customer.phone}</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {request.status === 'open' && !isMyRequest && (
                  <div className="mt-6">
                    <button
                      onClick={handleAcceptRequest}
                      disabled={accepting}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold"
                    >
                      {accepting ? 'Приемане...' : 'Приеми заявка'}
                    </button>
                  </div>
                )}

                {request.status === 'assigned' && isMyRequest && (
                  <div className="mt-6">
                    <button
                      onClick={handleMarkComplete}
                      disabled={completing}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {completing ? 'Отбелязване като завършена...' : 'Отбележи като завършена'}
                    </button>
                  </div>
                )}

                {request.status === 'completed' && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-800 font-semibold">✓ Заявката е завършена</p>
                  </div>
                )}
              </div>

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
                  {isMyRequest && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-gray-600 mb-2">Моята работа</p>
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
