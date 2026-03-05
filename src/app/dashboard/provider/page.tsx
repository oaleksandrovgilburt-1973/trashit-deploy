'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import RegionSelector from '@/components/provider/RegionSelector';
import type { Request as TrashRequest, Region } from '@/lib/database.types';
import {
  Trash2,
  LogOut,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
} from 'lucide-react';

export default function ProviderDashboard() {
  const router = useRouter();
  const { profile, signOut } = useContext(AuthContext);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [requests, setRequests] = useState<TrashRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'available' | 'assigned'>('available');

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      // Fetch all regions
      const { data: regionsData } = await supabase
        .from('regions')
        .select('*')
        .order('name');

      if (regionsData) {
        setRegions(regionsData);
      }

      // Fetch provider's selected regions
      const { data: providerRegionsData } = await supabase
        .from('provider_regions')
        .select('region_id')
        .eq('provider_id', profile.id);

      if (providerRegionsData) {
        setSelectedRegions(providerRegionsData.map((pr) => pr.region_id));
      }

      setLoading(false);
    };

    fetchData();
  }, [profile]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!profile || selectedRegions.length === 0) {
        setRequests([]);
        return;
      }

      if (tab === 'available') {
        // Fetch open requests in provider's regions
        const { data } = await supabase
          .from('requests')
          .select('*')
          .in('region_id', selectedRegions)
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        setRequests(data || []);
      } else {
        // Fetch assigned requests for this provider
        const { data } = await supabase
          .from('requests')
          .select('*')
          .eq('provider_id', profile.id)
          .in('status', ['assigned', 'in_progress'])
          .order('created_at', { ascending: false });

        setRequests(data || []);
      }
    };

    fetchRequests();
  }, [profile, selectedRegions, tab]);

  if (!profile) {
    return null;
  }

  if (profile.role !== 'provider') {
    router.push('/dashboard');
    return null;
  }

  const isApproved = profile.provider_status === 'approved';
  const isPending = profile.provider_status === 'pending';
  const isSuspended = profile.provider_status === 'suspended';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Approval Status Banner */}
        {isPending && (
          <div className="mb-8 flex items-start gap-4 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                Изчакване на одобрение
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                Вашата заявка е подадена и чакащо одобрение от администратора. Обикновено одобрението отнема 24-48 часа. Докато чакате, можете да управлявате вашите региони.
              </p>
            </div>
          </div>
        )}

        {isSuspended && (
          <div className="mb-8 flex items-start gap-4 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                Акаунтът е спрян
              </h3>
              <p className="text-sm text-red-800 dark:text-red-400">
                Вашият акаунт е временно спрян. Моля, свържете се с администратора за повече информация.
              </p>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="mb-8 flex items-start gap-4 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                Одобрено
              </h3>
              <p className="text-sm text-green-800 dark:text-green-400">
                Вашият профил е одобрен. Можете да приемате работи и да управлявате вашите региони.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Region Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <RegionSelector
                selectedRegions={selectedRegions}
                onRegionsChange={setSelectedRegions}
                disabled={!isApproved && !isPending}
              />
            </div>
          </div>

          {/* Right Column: Requests */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700 flex">
                <button
                  onClick={() => setTab('available')}
                  className={`flex-1 px-6 py-4 font-medium transition ${
                    tab === 'available'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Налични работи
                </button>
                <button
                  onClick={() => setTab('assigned')}
                  className={`flex-1 px-6 py-4 font-medium transition ${
                    tab === 'assigned'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Мои работи
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    Зареждане...
                  </p>
                ) : selectedRegions.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Моля, изберете поне един регион от лявата страна
                    </p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {tab === 'available'
                        ? 'Няма налични работи в избраните региони'
                        : 'Нямате назначени работи'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <Link
                        key={request.id}
                        href={`/dashboard/provider/request/${request.id}`}
                        className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-600 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {request.description.substring(0, 50)}...
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {request.address}
                        </p>
                        {request.price_offer && (
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {request.price_offer} лева
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
