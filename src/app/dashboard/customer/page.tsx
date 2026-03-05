'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import type { Request as TrashRequest, Region } from '@/lib/database.types';
import { Trash2, Plus, LogOut, X } from 'lucide-react';

export default function CustomerDashboard() {
  const { profile, signOut } = useAuth();
  const [requests, setRequests] = useState<TrashRequest[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    address: '',
    region_id: '',
    preferred_time: '',
    price_offer: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      // Fetch regions
      const { data: regionsData } = await supabase
        .from('regions')
        .select('*')
        .order('name');

      if (regionsData) {
        setRegions(regionsData);
      }

      // Fetch customer's requests
      const { data: requestsData } = await supabase
        .from('requests')
        .select('*')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false });

      if (requestsData) {
        setRequests(requestsData);
      }

      setLoading(false);
    };

    fetchData();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from('requests').insert({
        customer_id: profile.id,
        description: formData.description,
        address: formData.address,
        region_id: parseInt(formData.region_id),
        preferred_time: formData.preferred_time || null,
        price_offer: formData.price_offer ? parseFloat(formData.price_offer) : null,
        status: 'open',
      });

      if (error) throw error;

      // Refresh requests
      const { data: updatedRequests } = await supabase
        .from('requests')
        .select('*')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false });

      if (updatedRequests) {
        setRequests(updatedRequests);
      }

      // Reset form
      setFormData({
        description: '',
        address: '',
        region_id: '',
        preferred_time: '',
        price_offer: '',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Неуспешно създаване на заявка');
    } finally {
      setSubmitting(false);
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

  return (
    <ProtectedRoute requiredRole="customer">
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold text-white">TRASHit</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">Добре дошли, {profile?.full_name}</span>
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
          {/* Create Request Section */}
          <div className="mb-8">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Създай нова заявка
              </button>
            ) : (
              <div className="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Създай нова заявка</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-6 h-6 text-gray-700" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Какво трябва да се отвози? *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Опишете боклука или предметите за отвоз..."
                      rows={4}
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Адрес *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Адрес на улицата"
                    />
                  </div>

                  {/* Region */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Софийски регион *
                    </label>
                    <select
                      required
                      value={formData.region_id}
                      onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="" className="bg-gray-700">Избери регион</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preferred Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Предпочитано време
                    </label>
                    <input
                      type="text"
                      value={formData.preferred_time}
                      onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="напр., Днес 15:00-17:00"
                    />
                  </div>

                  {/* Price Offer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Предложена цена (лева)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price_offer}
                      onChange={(e) => setFormData({ ...formData, price_offer: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Създаване...' : 'Създай заявка'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition font-semibold"
                    >
                      Отмени
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Requests List */}
          <div className="bg-gray-800 rounded-lg shadow border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Моите заявки</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 border-4 border-green-500 border-t-green-300 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Зареждане на заявки...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center">
                <Trash2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Нямате заявки</p>
                <p className="text-sm text-gray-500 mt-2">Създайте вашата първа заявка за отвоз на боклук, за да начнете</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {requests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/dashboard/customer/request/${request.id}`}
                    className="block p-6 hover:bg-gray-700 transition border-b border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-2">{request.description}</h3>
                        <p className="text-sm text-gray-400 mb-3">{request.address}</p>
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <span className={`px-3 py-1 rounded-full font-semibold ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                          {request.price_offer && (
                            <span className="text-gray-700 font-semibold">
                              {parseFloat(request.price_offer.toString()).toFixed(2)} лв.
                            </span>
                          )}
                          {request.preferred_time && (
                            <span className="text-gray-600">
                              {request.preferred_time}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          {new Date(request.created_at).toLocaleDateString('bg-BG')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
