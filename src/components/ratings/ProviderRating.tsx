'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProviderRatingProps {
  providerId: string;
}

interface RatingStats {
  avg_rating: number | null;
  total_ratings: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

export default function ProviderRating({ providerId }: ProviderRatingProps) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const { data, error } = await supabase.rpc('get_provider_rating', {
          p_provider_id: providerId,
        });

        if (error) {
          console.error('Error fetching rating:', error);
          return;
        }

        if (data && data.length > 0) {
          setStats(data[0]);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [providerId]);

  if (loading) {
    return <div className="text-gray-600 dark:text-gray-400">Зареждане...</div>;
  }

  if (!stats || stats.total_ratings === 0) {
    return (
      <div className="text-gray-600 dark:text-gray-400 text-sm">
        Няма оценки
      </div>
    );
  }

  const avgRating = stats.avg_rating || 0;
  const totalRatings = stats.total_ratings;

  return (
    <div className="space-y-4">
      {/* Overall Rating */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= Math.round(avgRating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          ))}
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {avgRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
            ({totalRatings} {totalRatings === 1 ? 'оценка' : 'оценки'})
          </span>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count =
            star === 5
              ? stats.five_star
              : star === 4
              ? stats.four_star
              : star === 3
              ? stats.three_star
              : star === 2
              ? stats.two_star
              : stats.one_star;

          const percentage =
            totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;

          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                {star}★
              </span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
