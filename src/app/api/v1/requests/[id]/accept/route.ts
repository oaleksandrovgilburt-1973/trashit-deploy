import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/requests/[id]/accept
 * 
 * Atomically accept a request using PostgreSQL RPC function
 * Returns 200 if successful, 409 if already taken, 400/401 for errors
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

    // Validate request ID format
    if (!requestId || requestId.length === 0) {
      return NextResponse.json(
        { error: 'Невалидна заявка' },
        { status: 400 }
      );
    }

    // Call atomic accept RPC function
    const { data, error } = await authClient.rpc('accept_request', {
      p_request_id: requestId,
      p_provider_id: user.id,
    });

    if (error) {
      console.error('RPC error:', error);
      return NextResponse.json(
        { error: 'Грешка при приемане на работата' },
        { status: 500 }
      );
    }

    if (!data.success) {
      // Handle specific error cases
      if (data.error === 'already_taken') {
        return NextResponse.json(
          {
            error: 'already_taken',
            message: 'Тази работа вече е възложена на друг доставчик',
          },
          { status: 409 }
        );
      }

      if (data.error === 'not_in_region') {
        return NextResponse.json(
          {
            error: 'not_in_region',
            message: 'Вие не работите в този регион',
          },
          { status: 400 }
        );
      }

      if (data.error === 'not_approved') {
        return NextResponse.json(
          {
            error: 'not_approved',
            message: 'Вашият профил не е одобрен',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'unknown_error',
          message: data.message || 'Грешка при приемане на работата',
        },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json(
      {
        success: true,
        message: 'Работата е успешно възложена',
        request_id: data.request_id,
        customer_id: data.customer_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Accept request error:', error);

    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
