'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import JobCard from '@/components/provider/JobCard';
import type { Request as TrashRequest, Region } from '@/lib/database.types';
import { Trash2, LogOut, MapPin, AlertCircle, Filter } from 'lucide-react';

const REGIONS = [
  { id: 1, name: 'Lozenets' },
  { id: 2, name: 'Mladost' },
  { id: 3, name: 'Studentski grad' },
  { id: 4, name: 'Lyulin' },
  { id: 5, name: 'Nadezhda' },
  { id: 6, name: 'Serdika' },
  { id: 7, name: 'Oborishte' },
  { id: 8, name: 'Vitosha' },
];

export default function JobBrowsePage() {
  const router = useRouter();
  const { profile, signOut } = useContext(AuthContext);
  const [requests, setRequests] = useState<TrashRequest[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'price'>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApproval = async () => {
      if (!profile) return;

      if (profile.role !== 'provider') {
        router.push('/dashboard');
        return;
      }

      if (profile.provider_status !== 'approved') {
        router.push('/dashboard/provider');
        return;
      }

      // Fetch provider's regions
      const { data: providerRegions } = await supabase
        .from('provider_regions')
        .select('region_id')
        .eq('provider_id', profile.id);

      if (providerRegions) {
        const regionIds = providerRegions.map((pr) => pr.region_id);
        setSelectedRegions(regionIds);
      }

      // Fetch all regions
      const { data: regionsData } = await supabase
        .from('regions')
        .select('*')
        .order('name');

      if (regionsData) {
        setRegions(regionsData);
      }

      setLoading(false);
    };

    checkApproval();
  }, [profile, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (selectedRegions.length === 0) {
        setRequests([]);
        return;
      }

      try {
        let query = supabase
          .from('requests')
          .select('*')
          .eq('status', 'open')
          .in('region_id', selectedRegions);

        if (sortBy === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else {
          query = query.order('price_offer', { ascending: false });
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          setError('Грешка при зареждане на работи');
          return;
        }

        setRequests(data || []);
        setError(null);
      } catch (err) {
        setError('Грешка при зареждане на работи');
      }
    };

    fetchRequests();
  }, [selectedRegions, sortBy]);

  if (!profile) {
    return null;
  }

  if (profile.provider_status !== 'approved') {
    return null;
  }

  const regionMap = new Map(regions.map((r) => [r.id, r.name]));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Налични работи
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
        {error && (
          <div className="mb-8 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Филтри
              </h2>

              {/* Region Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Региони
                </h3>
                <div className="space-y-2">
                  {REGIONS.map((region) => (
                    <label
                      key={region.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRegions.includes(region.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRegions([...selectedRegions, region.id]);
                          } else {
                            setSelectedRegions(
                              selectedRegions.filter((id) => id !== region.id)
                            );
                          }
                        }}
                        className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {region.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Сортиране
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'price')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-600 focus:border-transparent"
                >
                  <option value="newest">Най-нови първо</option>
                  <option value="price">Най-висока цена</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content: Job List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">Зареждане...</p>
              </div>
            ) : selectedRegions.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Моля, изберете поне един регион от филтрите
                </p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Няма налични работи в избраните региони
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.map((request) => (
                  <JobCard
                    key={request.id}
                    request={request}
                    regionName={regionMap.get(request.region_id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
