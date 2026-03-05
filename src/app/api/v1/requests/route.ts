import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRequestSchema } from '@/lib/validations/request';
import { stripe } from '@/lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createRequestSchema.parse(body);

    // Get user session from header (passed from client)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    // Verify region exists
    const { data: region, error: regionError } = await supabase
      .from('regions')
      .select('id')
      .eq('id', validatedData.region_id)
      .single();

    if (regionError || !region) {
      return NextResponse.json(
        { error: 'Избранният регион не съществува' },
        { status: 400 }
      );
    }

    // Create request with optional Stripe payment intent
    let stripePaymentIntentId: string | null = null;

    // If price offer is provided, create payment intent
    if (validatedData.price_offer && validatedData.price_offer > 0) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(validatedData.price_offer * 100), // Convert to cents
          currency: 'bgn',
          capture_method: 'manual', // Authorize but don't capture
          metadata: {
            customer_id: user.id,
          },
          description: `Trash removal request - ${validatedData.description.substring(0, 50)}`,
        });
        stripePaymentIntentId = paymentIntent.id;
      } catch (stripeError) {
        console.error('Stripe payment intent creation error:', stripeError);
        return NextResponse.json(
          { error: 'Грешка при създаване на платежно намерение' },
          { status: 500 }
        );
      }
    }

    // Create request
    const { data: newRequest, error: insertError } = await supabase
      .from('requests')
      .insert({
        customer_id: user.id,
        description: validatedData.description,
        address: validatedData.address,
        region_id: validatedData.region_id,
        preferred_time: validatedData.preferred_time || null,
        price_offer: validatedData.price_offer || null,
        status: 'open',
        stripe_payment_intent_id: stripePaymentIntentId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      // If we created a payment intent but the request failed, cancel it
      if (stripePaymentIntentId) {
        try {
          await stripe.paymentIntents.cancel(stripePaymentIntentId);
        } catch (cancelError) {
          console.error('Failed to cancel payment intent:', cancelError);
        }
      }
      return NextResponse.json(
        { error: 'Грешка при създаване на заявка' },
        { status: 500 }
      );
    }

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Request creation error:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Невалидни данни' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
