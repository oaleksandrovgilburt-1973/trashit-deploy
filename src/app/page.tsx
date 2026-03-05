'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, CheckCircle, Users, Zap } from 'lucide-react';

export default function Home() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Trash2 className="w-8 h-8 text-green-600" />
          <span className="text-2xl font-bold text-gray-900">TRASHit</span>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Панел
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="px-6 py-2 text-gray-700 hover:text-gray-900 transition"
              >
                Влез
              </Link>
              <Link
                href="/auth/signup"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Регистрирайте се
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Отвозете боклука си <span className="text-green-600">Мигновено</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Свържете се с професионални доставчици на услуги за отвоз на боклук в ваш район. Бързо, надеждно и достъпно.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Начнете сега
          </Link>
          <Link
            href="#features"
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition font-semibold"
          >
            Научете повече
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Как работи</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Бърза заявка</h3>
            <p className="text-gray-600">
              Публикувайте заявка за отвоз на боклук за секунди. Опишете какво трябва да се отвози и кога.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Получете предложения</h3>
            <p className="text-gray-600">
              Получавайте предложения от проверени доставчици в ваш район. Изберете най-подходящия за вас.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Готово и плащане</h3>
            <p className="text-gray-600">
              Работата се завършва. Плащате безопасно. Просто и ясно.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Готови ли сте да начнете?</h2>
          <p className="text-lg mb-8 opacity-90">
            Присъединяйте се към хиляди клиенти и доставчици, които използват TRASHit.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition font-semibold"
          >
            Регистрирайте се сега
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; 2024 TRASHit. Всички права запазени.</p>
        </div>
      </footer>
    </div>
  );
}
