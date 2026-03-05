'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Region } from '@/lib/database.types';
import { Trash2, ChevronRight } from 'lucide-react';

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'role' | 'details' | 'regions'>('role');

  // Fetch regions for provider signup
  useEffect(() => {
    const fetchRegions = async () => {
      const { data } = await supabase
        .from('regions')
        .select('*')
        .order('name');
      if (data) {
        setRegions(data);
      }
    };

    fetchRegions();
  }, []);

  const handleRoleSelect = (selectedRole: 'customer' | 'provider') => {
    setRole(selectedRole);
    setStep('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'provider') {
      setStep('regions');
    } else {
      handleSignUp();
    }
  };

  const handleRegionToggle = (regionId: number) => {
    setSelectedRegions((prev) =>
      prev.includes(regionId)
        ? prev.filter((r) => r !== regionId)
        : [...prev, regionId]
    );
  };

  const handleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, fullName, role);

      // If provider, save selected regions
      if (role === 'provider' && selectedRegions.length > 0) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user?.id) {
          const providerRegions = selectedRegions.map((regionId) => ({
            provider_id: data.session.user.id,
            region_id: regionId,
          }));

          if (providerRegions.length > 0) {
            await supabase.from('provider_regions').insert(providerRegions);
          }
        }
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Регистрацията не успя');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trash2 className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">TRASHit</h1>
          </div>
          <p className="text-gray-600">Присъединете се към общността за отвоз на боклук</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 'role' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Каква е вашата роля?</h2>
              <button
                type="button"
                onClick={() => handleRoleSelect('customer')}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Клиент</div>
                    <div className="text-sm text-gray-600">Имам нужда от отвоз на боклук</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('provider')}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Доставчик</div>
                    <div className="text-sm text-gray-600">Предоставям услуги за отвоз</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('role')}
                className="text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                ← Назад
              </button>

              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {role === 'customer' ? 'Създай акаунт' : 'Станете доставчик'}
              </h2>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пълно име
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Вашето име"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имейл
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="вашия@имейл.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Парола
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {/* Next Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {role === 'provider' ? 'Следващо: Избери региони' : 'Регистрация'}
              </button>
            </form>
          )}

          {/* Step 3: Region Selection (Provider Only) */}
          {step === 'regions' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                ← Назад
              </button>

              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Избери региони за обслужване
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Изберете кои софийски региони искате да обслужвате
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {regions.map((region) => (
                  <label key={region.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(region.id)}
                      onChange={() => handleRegionToggle(region.id)}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{region.name}</span>
                  </label>
                ))}
              </div>

              {selectedRegions.length === 0 && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  Моля, изберете поне един регион
                </p>
              )}

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={loading || selectedRegions.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Създаване на акаунт...' : 'Завършете регистрацията'}
              </button>
            </form>
          )}

          {/* Sign In Link */}
          {(step === 'details' || step === 'regions') && (
            <p className="text-center text-sm text-gray-600 mt-6">
              Вече имате акаунт?{' '}
              <Link href="/auth/signin" className="text-green-600 hover:text-green-700 font-semibold">
                Влезте
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
