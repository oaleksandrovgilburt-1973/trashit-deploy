'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Folder,
  AlertCircle,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      label: 'Панел',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Потребители',
      href: '/admin/users',
      icon: Users,
    },
    {
      label: 'Региони',
      href: '/admin/regions',
      icon: MapPin,
    },
    {
      label: 'Категории',
      href: '/admin/categories',
      icon: Folder,
    },
    {
      label: 'Спорове',
      href: '/admin/disputes',
      icon: AlertCircle,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">
              TRASHit Admin
            </span>
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Изход</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
