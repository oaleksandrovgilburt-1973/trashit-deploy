import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createDispute, canOpenDispute } from '@/lib/disputes';
import { notifyDisputeOpened } from '@/lib/notifications/sender';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/requests/[id]/dispute
 * 
 * Open a dispute for a completed request
 * Only customer can open dispute
 * Request must be in 'completed' status
 * Dispute must be opened within 48 hours of completion
 * 
 * Body:
 * {
 *   "reason": "incomplete_work" | "poor_quality" | "no_show" | "other",
 *   "description": "Detailed description of the issue"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const body = await request.json();
    const { reason, description } = body;

    // Validate input
    if (!reason) {
      return NextResponse.json(
        { error: 'Причината е задължителна' },
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

    // Get request details
    const { data: requestData, error: fetchError } = await authClient
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !requestData) {
      return NextResponse.json(
        { error: 'Заявката не е намерена' },
        { status: 404 }
      );
    }

    // Verify customer owns the request
    if (requestData.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'Вие не сте собственик на тази заявка' },
        { status: 403 }
      );
    }

    // Check if dispute can be opened
    const canOpen = await canOpenDispute(requestId);
    if (!canOpen.allowed) {
      return NextResponse.json(
        { error: canOpen.reason },
        { status: 422 }
      );
    }

    // Create dispute
    const disputeResult = await createDispute(
      requestId,
      user.id,
      requestData.provider_id,
      reason,
      description
    );

    if (!disputeResult.success) {
      return NextResponse.json(
        { error: disputeResult.error },
        { status: 500 }
      );
    }

    // Get provider and customer details for notification
    const { data: provider } = await supabase
      .from('profiles')
      .select('full_name, id')
      .eq('id', requestData.provider_id)
      .single();

    const { data: customer } = await supabase
      .from('profiles')
      .select('full_name, id')
      .eq('id', user.id)
      .single();

    // Send notifications
    if (provider) {
      await notifyDisputeOpened(
        requestData.provider_id,
        customer?.full_name || 'Клиент',
        'provider',
        reason,
        requestId
      );
    }

    // Notify admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await notifyDisputeOpened(
          admin.id,
          provider?.full_name || 'Доставчик',
          'admin',
          reason,
          requestId
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        dispute: disputeResult.dispute,
        message: 'Спорът е успешно отворен',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/requests/[id]/dispute
 * 
 * Get disputes for a request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

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

    // Get request details
    const { data: requestData, error: fetchError } = await authClient
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !requestData) {
      return NextResponse.json(
        { error: 'Заявката не е намерена' },
        { status: 404 }
      );
    }

    // Verify user is involved in the request
    if (
      requestData.customer_id !== user.id &&
      requestData.provider_id !== user.id
    ) {
      // Check if user is admin
      const { data: profile } = await authClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Нямате достъп до тази заявка' },
          { status: 403 }
        );
      }
    }

    // Get disputes
    const { data: disputes, error: disputeError } = await authClient
      .from('disputes')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (disputeError) {
      return NextResponse.json(
        { error: 'Грешка при обработка' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      disputes: disputes || [],
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
