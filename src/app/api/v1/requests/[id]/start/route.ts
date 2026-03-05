import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { transitionRequestStatus } from '@/lib/db/transitionStatus';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/requests/[id]/start
 * 
 * Start a job (transition from assigned → in_progress)
 * Only the assigned provider can start the job
 */
export async function POST(
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

    // Verify provider is assigned
    if (requestData.provider_id !== user.id) {
      return NextResponse.json(
        { error: 'Вие не сте възложени на тази заявка' },
        { status: 403 }
      );
    }

    // Verify request is in assigned status
    if (requestData.status !== 'assigned') {
      return NextResponse.json(
        {
          error: 'Заявката не е в статус "Възложено"',
          current_status: requestData.status,
        },
        { status: 400 }
      );
    }

    // Transition status
    const result = await transitionRequestStatus(
      requestId,
      user.id,
      'in_progress',
      'provider'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Send notification email
    try {
      const { data: customer } = await authClient
        .from('profiles')
        .select('*')
        .eq('id', requestData.customer_id)
        .single();

      if (customer?.email) {
        // TODO: Send email via Resend
        // await sendEmail({
        //   to: customer.email,
        //   subject: 'Доставчик начна работа по вашата заявка',
        //   template: 'job_started',
        //   data: { customer_name: customer.full_name, request_id: requestId }
        // });
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Работата е начната',
        request_id: requestId,
        status: 'in_progress',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Start job error:', error);

    return NextResponse.json(
      { error: 'Грешка при начало на работата' },
      { status: 500 }
    );
  }
}
