'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import type { Profile, Request as TrashRequest } from '@/lib/database.types';
import { Trash2, LogOut, Users, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<TrashRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'requests'>('users');
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersData) {
        setUsers(usersData as Profile[]);
      }

      // Fetch all requests
      const { data: requestsData } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsData) {
        setRequests(requestsData as TrashRequest[]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleApproveProvider = async (userId: string) => {
    setApproving(userId);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ provider_status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, provider_status: 'approved' } : u
        )
      );
    } catch (error) {
      console.error('Error approving provider:', error);
      alert('Неуспешно одобрение на доставчик');
    } finally {
      setApproving(null);
    }
  };

  const handleSuspendProvider = async (userId: string) => {
    if (!confirm('Сигурни ли сте, че искате да спрете този доставчик?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ provider_status: 'suspended' })
        .eq('id', userId);

      if (error) throw error;

      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, provider_status: 'suspended' } : u
        )
      );
    } catch (error) {
      console.error('Error suspending provider:', error);
      alert('Неуспешно спиране на доставчик');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold">
            <Clock className="w-4 h-4" />
            Изчакване
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            Одобрен
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            Спран
          </span>
        );
      default:
        return null;
    }
  };

  const getRequestStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      open: 'Отворено',
      assigned: 'Възложено',
      in_progress: 'В процес',
      completed: 'Завършено',
      cancelled: 'Отменено',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold text-white">TRASHit Администратор</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">Администратор: {profile?.full_name}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                Излез
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setTab('users')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                tab === 'users'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              Потребители и доставчици
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                tab === 'requests'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FileText className="w-5 h-5" />
              Всички заявки
            </button>
          </div>

          {/* Users Tab */}
          {tab === 'users' && (
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Потребители и доставчици</h2>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-green-300 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Зареждане на потребители...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Няма намерени потребители</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700 border-b border-gray-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Име</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Имейл</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Роля</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Статус</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-700 transition">
                          <td className="px-6 py-4 text-white">{user.full_name}</td>
                          <td className="px-6 py-4 text-gray-400 text-sm">{user.id}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              user.role === 'provider'
                                ? 'bg-blue-100 text-blue-800'
                                : user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role === 'provider' ? 'Доставчик' : user.role === 'admin' ? 'Администратор' : 'Клиент'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.role === 'provider' ? (
                              getStatusBadge(user.provider_status || 'pending')
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {user.role === 'provider' && user.provider_status === 'pending' && (
                              <button
                                onClick={() => handleApproveProvider(user.id)}
                                disabled={approving === user.id}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold text-sm"
                              >
                                {approving === user.id ? 'Одобряване...' : 'Одобри'}
                              </button>
                            )}
                            {user.role === 'provider' && user.provider_status === 'approved' && (
                              <button
                                onClick={() => handleSuspendProvider(user.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm"
                              >
                                Спри
                              </button>
                            )}
                            {user.role === 'provider' && user.provider_status === 'suspended' && (
                              <button
                                onClick={() => handleApproveProvider(user.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm"
                              >
                                Активирай
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {tab === 'requests' && (
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Всички заявки</h2>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-green-300 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Зареждане на заявки...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Няма намерени заявки</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {requests.map((request) => (
                    <div key={request.id} className="px-6 py-4 hover:bg-gray-700 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{request.description}</h3>
                          <p className="text-sm text-gray-400">{request.address}</p>
                        </div>
                        <div className="text-right">
                          {getRequestStatusBadge(request.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        {request.price_offer && (
                          <span className="text-green-400 font-semibold">
                            {parseFloat(request.price_offer.toString()).toFixed(2)} лв.
                          </span>
                        )}
                        <span className="text-gray-500">
                          {new Date(request.created_at).toLocaleDateString('bg-BG')}
                        </span>
                        {request.provider_id && (
                          <span className="text-blue-400">Доставчик: {request.provider_id.slice(0, 8)}...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
