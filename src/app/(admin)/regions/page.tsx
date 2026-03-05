'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export default function AdminRegionsPage() {
  const { user, session } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newRegion, setNewRegion] = useState({ name: '', code: '' });

  // Fetch regions
  useEffect(() => {
    if (!session) return;

    const fetchRegions = async () => {
      try {
        const response = await fetch('/api/v1/admin/regions', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch regions');
        }

        const data = await response.json();
        setRegions(data.regions || []);
      } catch (error) {
        console.error('Error fetching regions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegions();
  }, [session]);

  // Handle add region
  const handleAddRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const response = await fetch('/api/v1/admin/regions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRegion),
      });

      if (!response.ok) {
        throw new Error('Failed to add region');
      }

      const data = await response.json();
      setRegions([...regions, data.region]);
      setNewRegion({ name: '', code: '' });
    } catch (error) {
      console.error('Error adding region:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Управление на региони
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Управление на всички региони на платформата
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Region Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Добавяне на регион
          </h2>
          <form onSubmit={handleAddRegion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Име на регион
              </label>
              <input
                type="text"
                value={newRegion.name}
                onChange={(e) =>
                  setNewRegion({ ...newRegion, name: e.target.value })
                }
                placeholder="София"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Код
              </label>
              <input
                type="text"
                value={newRegion.code}
                onChange={(e) =>
                  setNewRegion({ ...newRegion, code: e.target.value })
                }
                placeholder="SOF"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding || !newRegion.name || !newRegion.code}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Добавяне...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Добавяне на регион
                </>
              )}
            </button>
          </form>
        </div>

        {/* Regions List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : regions.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                Няма региони
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Име
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Код
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Създадено
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {regions.map((region) => (
                      <tr
                        key={region.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {region.name}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {region.code}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(region.created_at).toLocaleDateString(
                              'bg-BG'
                            )}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
