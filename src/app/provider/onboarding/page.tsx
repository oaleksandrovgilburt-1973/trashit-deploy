'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle, Upload, MapPin } from 'lucide-react';

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

type Step = 'personal' | 'id' | 'regions' | 'complete';

interface FormData {
  fullName: string;
  phone: string;
  idFile: File | null;
  selectedRegions: number[];
}

export default function ProviderOnboarding() {
  const router = useRouter();
  const { user, profile } = useContext(AuthContext);
  const [step, setStep] = useState<Step>('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    idFile: null,
    selectedRegions: [],
  });

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  if (profile?.role !== 'provider') {
    router.push('/dashboard');
    return null;
  }

  const handlePersonalInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) {
      setError('Пълното име е задължително');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Телефонният номер е задължителен');
      return;
    }

    setStep('id');
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Моля, изберете изображение');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Файлът е твърде голям (макс. 10MB)');
      return;
    }

    setFormData({ ...formData, idFile: file });
    setError(null);
  };

  const handleIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.idFile) {
      setError('Моля, качете снимка на вашия документ');
      return;
    }

    setStep('regions');
  };

  const handleRegionToggle = (regionId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedRegions: prev.selectedRegions.includes(regionId)
        ? prev.selectedRegions.filter((id) => id !== regionId)
        : [...prev.selectedRegions, regionId],
    }));
  };

  const handleRegionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (formData.selectedRegions.length === 0) {
        setError('Моля, изберете поне един регион');
        setLoading(false);
        return;
      }

      // Get auth token
      const {
        data: { session },
      } = await (await import('@/lib/supabase')).default.auth.getSession();

      if (!session) {
        setError('Сесията е изтекла. Моля, влезте отново');
        setLoading(false);
        return;
      }

      // Upload ID document
      const fileName = `${user.id}/${Date.now()}_${formData.idFile!.name}`;
      const { data: uploadData, error: uploadError } = await (
        await import('@/lib/supabase')
      ).default.storage
        .from('id-documents')
        .upload(fileName, formData.idFile!, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setError('Грешка при качване на документа: ' + uploadError.message);
        setLoading(false);
        return;
      }

      // Get public URL (for private buckets, this is just for reference)
      const { data: urlData } = (
        await import('@/lib/supabase')
      ).default.storage
        .from('id-documents')
        .getPublicUrl(fileName);

      // Submit provider application
      const response = await fetch('/api/v1/providers/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          idDocumentUrl: urlData.publicUrl,
          regionIds: formData.selectedRegions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Грешка при подаване на заявката');
        setLoading(false);
        return;
      }

      setStep('complete');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Неизвестна грешка'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Регистрация като доставчик
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Завършете процеса на регистрация в 3 стъпки
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12">
          {(['personal', 'id', 'regions'] as const).map((s, index) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                  step === s
                    ? 'bg-green-600 text-white'
                    : ['personal', 'id', 'regions'].indexOf(step) > index
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                {['personal', 'id', 'regions'].indexOf(step) > index ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 2 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    ['personal', 'id', 'regions'].indexOf(step) > index
                      ? 'bg-green-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 'personal' && (
            <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Лична информация
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Пълно име
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Иван Петров"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Телефонен номер
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="+359 88 123 4567"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Продължи
              </button>
            </form>
          )}

          {/* Step 2: ID Upload */}
          {step === 'id' && (
            <form onSubmit={handleIdSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Качване на документ
              </h2>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Качете снимка на вашия документ (паспорт, лична карта или шофьорска книжка)
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdUpload}
                    className="hidden"
                  />
                  <span className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer font-semibold inline-block">
                    Избери файл
                  </span>
                </label>
                {formData.idFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-4">
                    ✓ {formData.idFile.name}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('personal')}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-semibold"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Продължи
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Region Selection */}
          {step === 'regions' && (
            <form onSubmit={handleRegionsSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Избор на региони
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Изберете регионите, в които желаете да работите
              </p>

              <div className="grid grid-cols-2 gap-4">
                {REGIONS.map((region) => (
                  <label
                    key={region.id}
                    className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedRegions.includes(region.id)}
                      onChange={() => handleRegionToggle(region.id)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-600"
                    />
                    <span className="ml-3 text-gray-900 dark:text-white font-medium">
                      {region.name}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('id')}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-semibold"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Обработка...' : 'Завърши регистрация'}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Регистрацията е завършена!
              </h2>

              <p className="text-gray-600 dark:text-gray-400">
                Вашата заявка е подадена. Администраторът ще я преглед и ще ви уведоми за одобрението.
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-500">
                Обикновено одобрението отнема 24-48 часа.
              </p>

              <button
                onClick={() => router.push('/dashboard/provider')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Отиди в панела
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
