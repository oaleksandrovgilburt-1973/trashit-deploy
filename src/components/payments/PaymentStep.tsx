'use client';

import { useState, useEffect } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AlertCircle, CheckCircle } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface PaymentStepProps {
  amount: number;
  onPaymentIntentCreated: (clientSecret: string, paymentIntentId: string) => void;
  isProcessing: boolean;
}

function PaymentStepContent({
  amount,
  onPaymentIntentCreated,
  isProcessing,
}: PaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  const handleCardChange = (event: any) => {
    setError(event.error?.message || null);
    setPaymentReady(!event.empty);
  };

  const handleAuthorizePayment = async () => {
    if (!stripe || !elements) {
      setError('Stripe не е зареден. Опитайте отново.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent on server
      const response = await fetch('/api/v1/payments/intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'bgn',
        }),
      });

      if (!response.ok) {
        throw new Error('Неуспешно създаване на платежно намерение');
      }

      const { clientSecret, paymentIntentId } = await response.json();

      // Confirm payment with card
      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              // Add billing details if needed
            },
          },
        });

      if (confirmError) {
        setError(confirmError.message || 'Грешка при обработка на платежа');
        setProcessing(false);
        return;
      }

      if (
        paymentIntent.status === 'requires_capture' ||
        paymentIntent.status === 'succeeded'
      ) {
        onPaymentIntentCreated(clientSecret, paymentIntentId);
      } else {
        setError('Платежът не е успешен. Статус: ' + paymentIntent.status);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Грешка при обработка на платежа'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Платежна информация
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          За да завършите заявката, трябва да авторизирате платеж от{' '}
          <span className="font-semibold">{amount.toFixed(2)} лева</span>
        </p>
      </div>

      {/* Card Element */}
      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
        <CardElement
          onChange={handleCardChange}
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#fa755a',
              },
            },
          }}
        />
      </div>

      {/* Test Card Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Тестова карта:</strong> 4242 4242 4242 4242 | Всеки бъдещ месец | Всеки CVC
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Authorize Button */}
      <button
        onClick={handleAuthorizePayment}
        disabled={!paymentReady || processing || isProcessing}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {processing || isProcessing
          ? 'Обработка на платежа...'
          : `Авторизирай ${amount.toFixed(2)} лева`}
      </button>

      {/* Info */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Платежът ще бъде авторизиран, но не ще бъде събран до завършване на работата.
      </p>
    </div>
  );
}

export default function PaymentStep({
  amount,
  onPaymentIntentCreated,
  isProcessing,
}: PaymentStepProps) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          Stripe не е конфигуриран. Добавете NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY в .env.local
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentStepContent
        amount={amount}
        onPaymentIntentCreated={onPaymentIntentCreated}
        isProcessing={isProcessing}
      />
    </Elements>
  );
}
