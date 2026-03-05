import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'bgn' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Невалидна сума' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(
      amount,
      `temp-${Date.now()}` // Temporary ID, will be updated when request is created
    );

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Payment intent creation error:', error);

    return NextResponse.json(
      { error: 'Грешка при създаване на платежно намерение' },
      { status: 500 }
    );
  }
}
