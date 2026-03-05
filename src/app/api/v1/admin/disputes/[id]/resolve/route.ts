import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveDispute } from '@/lib/disputes';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * PUT /api/v1/admin/disputes/[id]/resolve
 * 
 * Resolve a dispute (admin only)
 * 
 * Body:
 * {
 *   "resolution": "Detailed resolution",
 *   "status": "resolved" | "closed",
 *   "refund_amount": 0 (optional)
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disputeId = params.id;
    const body = await request.json();
    const { resolution, status = 'resolved', refund_amount } = body;

    // Validate input
    if (!resolution) {
      return NextResponse.json(
        { error: 'Разрешението е задължително' },
        { status: 400 }
      );
    }

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create authenticated client
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нямате достъп до тази ресурс' },
        { status: 403 }
      );
    }

    // Get dispute details
    const { data: dispute, error: fetchError } = await authClient
      .from('disputes')
      .select('*')
      .eq('id', disputeId)
      .single();

    if (fetchError || !dispute) {
      return NextResponse.json(
        { error: 'Спорът не е намерен' },
        { status: 404 }
      );
    }

    // Resolve dispute
    const resolveResult = await resolveDispute(
      disputeId,
      resolution,
      user.id,
      status
    );

    if (!resolveResult.success) {
      return NextResponse.json(
        { error: resolveResult.error },
        { status: 500 }
      );
    }

    // Get request details for payment handling
    const { data: requestData } = await authClient
      .from('requests')
      .select('*')
      .eq('id', dispute.request_id)
      .single();

    // Handle payment based on resolution
    if (status === 'resolved' && requestData?.payment_intent_id) {
      try {
        // Provider wins - capture payment
        const paymentIntent = await stripe.paymentIntents.retrieve(
          requestData.payment_intent_id
        );

        if (paymentIntent.status === 'requires_capture') {
          await stripe.paymentIntents.confirm(
            requestData.payment_intent_id
          );
        }

        // Create payout record
        await authClient.from('payouts').insert({
          provider_id: requestData.provider_id,
          request_id: requestData.id,
          amount: requestData.amount,
          status: 'pending',
          payment_intent_id: requestData.payment_intent_id,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error capturing payment:', error);
      }
    } else if (status === 'closed' && refund_amount && requestData?.payment_intent_id) {
      // Customer wins - refund payment
      try {
        await stripe.refunds.create({
          payment_intent: requestData.payment_intent_id,
          amount: Math.round(refund_amount * 100),
        });
      } catch (error) {
        console.error('Error creating refund:', error);
      }
    }

    // Update request status
    await authClient
      .from('requests')
      .update({
        status: status === 'resolved' ? 'closed' : 'cancelled',
        dispute_resolved_at: new Date().toISOString(),
      })
      .eq('id', dispute.request_id);

    return NextResponse.json(
      {
        success: true,
        dispute: resolveResult.dispute,
        message: 'Спорът е успешно разрешен',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/admin/disputes/[id]
 * 
 * Update dispute status (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disputeId = params.id;
    const body = await request.json();
    const { status, resolution } = body;

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create authenticated client
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нямате достъп до тази ресурс' },
        { status: 403 }
      );
    }

    // Update dispute
    const { data: updatedDispute, error: updateError } = await authClient
      .from('disputes')
      .update({
        status,
        resolution: resolution || null,
        resolved_by_id: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', disputeId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Грешка при актуализиране' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      dispute: updatedDispute,
    });
  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/admin/disputes/[id]
 * 
 * Get dispute details (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disputeId = params.id;

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create authenticated client
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нямате достъп до тази ресурс' },
        { status: 403 }
      );
    }

    // Get dispute with related data
    const { data: dispute, error: disputeError } = await authClient
      .from('disputes')
      .select(
        `
        *,
        opened_by:profiles!opened_by_id(id, full_name, phone),
        opened_against:profiles!opened_against_id(id, full_name, phone),
        request:requests(id, description, address, status)
      `
      )
      .eq('id', disputeId)
      .single();

    if (disputeError || !dispute) {
      return NextResponse.json(
        { error: 'Спорът не е намерен' },
        { status: 404 }
      );
    }

    // Get evidence
    const { data: evidence } = await authClient
      .from('dispute_evidence')
      .select('*')
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      dispute,
      evidence: evidence || [],
    });
  } catch (error) {
    console.error('Error fetching dispute:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
