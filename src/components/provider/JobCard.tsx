'use client';

import Link from 'next/link';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import type { Request as TrashRequest } from '@/lib/database.types';

interface JobCardProps {
  request: TrashRequest;
  regionName?: string;
}

export default function JobCard({ request, regionName }: JobCardProps) {
  const createdDate = new Date(request.created_at);
  const hoursAgo = Math.floor(
    (Date.now() - createdDate.getTime()) / (1000 * 60 * 60)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'assigned':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'in_progress':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Отворено';
      case 'assigned':
        return 'Възложено';
      case 'in_progress':
        return 'В процес';
      case 'completed':
        return 'Завършено';
      default:
        return status;
    }
  };

  return (
    <Link href={`/provider/jobs/${request.id}`}>
      <div className="block p-5 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-600 hover:shadow-lg transition bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex-1 line-clamp-2">
            {request.description}
          </h3>
          <span
            className={`ml-3 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(
              request.status
            )}`}
          >
            {getStatusLabel(request.status)}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">{request.address}</span>
        </div>

        {/* Region Badge */}
        {regionName && (
          <div className="inline-block mb-3 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
            {regionName}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {request.price_offer && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                <DollarSign className="w-4 h-4" />
                <span>{request.price_offer} лева</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
              <Clock className="w-4 h-4" />
              <span>
                {hoursAgo === 0
                  ? 'Преди няколко минути'
                  : hoursAgo === 1
                  ? 'Преди час'
                  : `Преди ${hoursAgo} часа`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
