'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import type { Region } from '@/lib/database.types';
import { Trash2, ArrowLeft } from 'lucide-react';

export default function NewRequest() {
  const router = useRouter();
  const { profile } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    address: '',
    region_id: '',
    preferred_time: '',
    price_offer: '',
  });

  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('name');

      if (!error && data) {
        setRegions(data);
      }
      setLoading(false);
    };

    fetchRegions();
  }, []);

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
      router.push('/dashboard/customer');
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="customer">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
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
        </header>

        {/* Form */}
        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Request</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What needs to be removed? *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe the trash or items to be removed..."
                  rows={4}
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Street address"
                />
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region *
                </label>
                <select
                  required
                  value={formData.region_id}
                  onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a region</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time
                </label>
                <input
                  type="text"
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Today 3-5 PM"
                />
              </div>

              {/* Price Offer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Offer (BGN)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_offer}
                  onChange={(e) => setFormData({ ...formData, price_offer: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  {submitting ? 'Creating...' : 'Create Request'}
                </button>
                <Link
                  href="/dashboard/customer"
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
