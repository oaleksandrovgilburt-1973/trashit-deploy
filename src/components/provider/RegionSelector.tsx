'use client';

import { useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

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

interface RegionSelectorProps {
  selectedRegions: number[];
  onRegionsChange: (regionIds: number[]) => void;
  disabled?: boolean;
}

export default function RegionSelector({
  selectedRegions,
  onRegionsChange,
  disabled = false,
}: RegionSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (regionId: number) => {
    if (disabled) return;

    const newRegions = selectedRegions.includes(regionId)
      ? selectedRegions.filter((id) => id !== regionId)
      : [...selectedRegions, regionId];

    onRegionsChange(newRegions);
  };

  const handleSave = async () => {
    if (selectedRegions.length === 0) {
      setError('Моля, изберете поне един регион');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/providers/me/regions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regionIds: selectedRegions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Грешка при запазване на региони');
        return;
      }

      // Success - regions saved
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Грешка при запазване'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Мои региони
        </h3>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {REGIONS.map((region) => (
          <button
            key={region.id}
            onClick={() => handleToggle(region.id)}
            disabled={disabled || loading}
            className={`p-3 rounded-lg border-2 transition font-medium text-sm ${
              selectedRegions.includes(region.id)
                ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-600'
            } ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {region.name}
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={disabled || loading}
        className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Запазване...' : 'Запази региони'}
      </button>
    </div>
  );
}
