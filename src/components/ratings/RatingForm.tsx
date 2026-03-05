'use client';

import { useState } from 'react';
import { Star, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RatingFormProps {
  requestId: string;
  ratedUserId: string;
  ratedUserName: string;
  onSuccess?: () => void;
}

export default function RatingForm({
  requestId,
  ratedUserId,
  ratedUserName,
  onSuccess,
}: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Моля, изберете оценка');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Неавторизиран достъп');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('ratings').insert({
        request_id: requestId,
        rater_id: user.id,
        rated_user_id: ratedUserId,
        rating,
        review_text: reviewText || null,
      });

      if (insertError) {
        setError('Грешка при запазване на оценката');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setRating(0);
      setReviewText('');

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Грешка при запазване на оценката'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
              Благодарим за оценката!
            </h3>
            <p className="text-sm text-green-800 dark:text-green-400">
              Вашата оценка е запазена успешно.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Оцени {ratedUserName}
        </h3>

        {error && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Star Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Оценка
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {rating === 1 && 'Много лошо'}
              {rating === 2 && 'Лошо'}
              {rating === 3 && 'Добре'}
              {rating === 4 && 'Много добре'}
              {rating === 5 && 'Отлично'}
            </p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <label
            htmlFor="review"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Отзив (по желание)
          </label>
          <textarea
            id="review"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Поделете своя опит..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Запазване...' : 'Запази оценка'}
      </button>
    </form>
  );
}
