import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/requests/[id]/complete
 * 
 * Mark a request as completed by the provider
 * Returns 200 if successful, 400/401 for errors
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const body = await request.json();
    const { completion_notes } = body;

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

    // Get request details to verify provider
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

    // Check for proof photos
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('request-proofs')
        .list(`${requestId}/`);

      if (listError) {
        console.error('Error listing proof photos:', listError);
      }

      if (!files || files.length === 0) {
        return NextResponse.json(
          {
            error: 'proof_photos_required',
            message: 'Трябва да качите поне 1 снимка преди да завършите',
          },
          { status: 400 }
        );
      }
    } catch (err) {
      console.error('Error checking proof photos:', err);
      return NextResponse.json(
        {
          error: 'proof_photos_required',
          message: 'Трябва да качите поне 1 снимка преди да завършите',
        },
        { status: 400 }
      );
    }

    // Call complete request RPC function
    const { data, error } = await authClient.rpc('complete_request', {
      p_request_id: requestId,
      p_provider_id: user.id,
      p_completion_notes: completion_notes || null,
    });

    if (error) {
      console.error('RPC error:', error);
      return NextResponse.json(
        { error: 'Грешка при завършване на работата' },
        { status: 500 }
      );
    }

    if (!data.success) {
      if (data.error === 'invalid_request') {
        return NextResponse.json(
          {
            error: 'invalid_request',
            message: 'Работата не е възложена на вас или вече е завършена',
          },
          { status: 400 }
        );
      }

      if (data.error === 'locked') {
        return NextResponse.json(
          {
            error: 'locked',
            message: 'Работата е заключена. Опитайте отново.',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: 'unknown_error',
          message: data.message || 'Грешка при завършване на работата',
        },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json(
      {
        success: true,
        message: 'Работата е маркирана като завършена',
        request_id: data.request_id,
        customer_id: data.customer_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Complete request error:', error);

    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
