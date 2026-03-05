'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
}

export default function AdminCategoriesPage() {
  const { user, session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '',
  });

  // Fetch categories
  useEffect(() => {
    if (!session) return;

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/v1/admin/categories', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [session]);

  // Handle add category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const response = await fetch('/api/v1/admin/categories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) {
        throw new Error('Failed to add category');
      }

      const data = await response.json();
      setCategories([...categories, data.category]);
      setNewCategory({ name: '', description: '', icon: '' });
    } catch (error) {
      console.error('Error adding category:', error);
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
          Управление на категории
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Управление на всички категории на платформата
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Category Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Добавяне на категория
          </h2>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Име на категория
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                placeholder="Почистване"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Описание
              </label>
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, description: e.target.value })
                }
                placeholder="Услуги за почистване"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Икона
              </label>
              <input
                type="text"
                value={newCategory.icon}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, icon: e.target.value })
                }
                placeholder="broom"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding || !newCategory.name}
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
                  Добавяне на категория
                </>
              )}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                Няма категории
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
                        Описание
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Икона
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {category.name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {category.description || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {category.icon || '-'}
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
