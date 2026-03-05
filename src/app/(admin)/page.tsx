'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  pendingProviders: number;
  suspendedUsers: number;
  openDisputes: number;
  completedRequests: number;
  totalRequests: number;
}

export default function AdminDashboard() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingProviders: 0,
    suspendedUsers: 0,
    openDisputes: 0,
    completedRequests: 0,
    totalRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    if (!user || !session) return;

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/admin/stats', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, session]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Всички потребители',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      href: '/admin/users',
    },
    {
      label: 'Очаквани доставчици',
      value: stats.pendingProviders,
      icon: Clock,
      color: 'yellow',
      href: '/admin/users?status=pending',
    },
    {
      label: 'Спрени потребители',
      value: stats.suspendedUsers,
      icon: AlertCircle,
      color: 'red',
      href: '/admin/users?status=suspended',
    },
    {
      label: 'Отворени спорове',
      value: stats.openDisputes,
      icon: AlertCircle,
      color: 'orange',
      href: '/admin/disputes',
    },
    {
      label: 'Всички работи',
      value: stats.totalRequests,
      icon: TrendingUp,
      color: 'purple',
      href: null,
    },
    {
      label: 'Завършени работи',
      value: stats.completedRequests,
      icon: CheckCircle,
      color: 'green',
      href: null,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> =
      {
        blue: {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-600 dark:text-blue-400',
          icon: 'text-blue-600 dark:text-blue-400',
        },
        yellow: {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          text: 'text-yellow-600 dark:text-yellow-400',
          icon: 'text-yellow-600 dark:text-yellow-400',
        },
        red: {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-600 dark:text-red-400',
          icon: 'text-red-600 dark:text-red-400',
        },
        orange: {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          text: 'text-orange-600 dark:text-orange-400',
          icon: 'text-orange-600 dark:text-orange-400',
        },
        purple: {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          text: 'text-purple-600 dark:text-purple-400',
          icon: 'text-purple-600 dark:text-purple-400',
        },
        green: {
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-600 dark:text-green-400',
          icon: 'text-green-600 dark:text-green-400',
        },
      };
    return colors[color] || colors.blue;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Администраторски панел
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Добре дошли! Ето преглед на системата.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);
          const content = (
            <div
              className={`${colors.bg} rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-transform hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-700 dark:text-gray-300 font-medium">
                  {card.label}
                </h3>
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {card.value}
              </p>
            </div>
          );

          return card.href ? (
            <Link key={card.label} href={card.href}>
              {content}
            </Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Очаквани одобрения
          </h2>
          {stats.pendingProviders > 0 ? (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {stats.pendingProviders} доставчик(и) очакват одобрение
              </p>
              <Link
                href="/admin/users?status=pending"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Преглед на кандидатури
              </Link>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Няма очаквани одобрения
            </p>
          )}
        </div>

        {/* Open Disputes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Отворени спорове
          </h2>
          {stats.openDisputes > 0 ? (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {stats.openDisputes} спор(ове) очакват разрешение
              </p>
              <Link
                href="/admin/disputes"
                className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Преглед на спорове
              </Link>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Няма отворени спорове
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
