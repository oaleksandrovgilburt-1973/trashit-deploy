'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import PhotoUploader from './PhotoUploader';
import MapPicker from '../map/MapPicker';
import { createRequestSchema, type CreateRequestInput } from '@/lib/validations/request';

interface RequestFormProps {
  regions: Array<{ id: number; name: string }>;
}

export default function RequestForm({ regions }: RequestFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateRequestInput>({
    description: '',
    address: '',
    region_id: 0,
    preferred_time: null,
    price_offer: null,
    photos: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'region_id' || name === 'price_offer'
          ? value === ''
            ? null
            : name === 'region_id'
              ? parseInt(value, 10)
              : parseFloat(value)
          : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData((prev) => ({
      ...prev,
      address,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handlePhotosChange = (photos: string[]) => {
    setFormData((prev) => ({
      ...prev,
      photos,
    }));
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!formData.description.trim()) {
        newErrors.description = 'Описанието е задължително';
      } else if (formData.description.length < 10) {
        newErrors.description = 'Описанието трябва да е поне 10 символа';
      }

      if (!formData.region_id) {
        newErrors.region_id = 'Регионът е задължителен';
      }
    }

    if (stepNum === 2) {
      if (!formData.address.trim()) {
        newErrors.address = 'Адресата е задължителна';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get auth token from session
      const response = await fetch('/api/v1/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          description: formData.description,
          address: formData.address,
          region_id: formData.region_id,
          preferred_time: formData.preferred_time,
          price_offer: formData.price_offer ? parseFloat(String(formData.price_offer)) : null,
          latitude: formData.latitude,
          longitude: formData.longitude,
          photos: formData.photos,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Грешка при създаване на заявка');
      }

      const newRequest = await response.json();
      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/customer');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка при обработка');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Заявката е създадена успешно!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Вашата заявка е публикувана. Доставчиците в избрания регион могат да я видят и да я приемат.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Пренасочване към панела...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full mx-1 ${
                s <= step ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Стъпка {step} от 3
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Description & Region */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Описание на заявката
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Опишете какво трябва да се отвози..."
                rows={5}
                className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Регион
              </label>
              <select
                name="region_id"
                value={formData.region_id || ''}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.region_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Изберете регион</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              {errors.region_id && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.region_id}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Location & Photos */}
        {step === 2 && (
          <div className="space-y-6">
            <MapPicker
              onLocationSelect={handleLocationSelect}
              initialAddress={formData.address}
            />

            <PhotoUploader onPhotosChange={handlePhotosChange} />
          </div>
        )}

        {/* Step 3: Additional Info */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Предпочитано време (опционално)
              </label>
              <input
                type="datetime-local"
                name="preferred_time"
                value={formData.preferred_time || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Предложена цена в лева (опционално)
              </label>
              <input
                type="number"
                name="price_offer"
                value={formData.price_offer || ''}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                max="10000"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Преглед на заявката
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  <strong>Регион:</strong>{' '}
                  {regions.find((r) => r.id === formData.region_id)?.name}
                </p>
                <p>
                  <strong>Адрес:</strong> {formData.address}
                </p>
                <p>
                  <strong>Снимки:</strong> {formData.photos.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Напред
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="ml-auto px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Създаване...' : 'Създай заявка'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
