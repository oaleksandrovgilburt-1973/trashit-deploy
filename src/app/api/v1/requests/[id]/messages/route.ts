import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * GET /api/v1/requests/[id]/messages
 * Retrieve paginated messages for a request thread
 * Only customer and assigned provider can access
 * Marks messages as read for the current user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    // Get request to verify access
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('id, customer_id, provider_id, status')
      .eq('id', requestId)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: 'Заявката не е намерена' },
        { status: 404 }
      );
    }

    // Check if user is participant
    const isCustomer = requestData.customer_id === user.id;
    const isProvider = requestData.provider_id === user.id;

    if (!isCustomer && !isProvider) {
      return NextResponse.json(
        { error: 'Нямате достъп до този чат' },
        { status: 403 }
      );
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      return NextResponse.json(
        { error: 'Грешка при зареждане на съобщения' },
        { status: 500 }
      );
    }

    // Mark messages as read for current user
    if (messages && messages.length > 0) {
      const unreadMessageIds = messages
        .filter((msg) => msg.sender_id !== user.id && !msg.read_by?.includes(user.id))
        .map((msg) => msg.id);

      if (unreadMessageIds.length > 0) {
        await supabase
          .from('messages')
          .update({
            read_by: supabase.rpc('array_append_unique', {
              arr: null,
              val: user.id,
            }),
          })
          .in('id', unreadMessageIds);
      }
    }

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total: messages?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Грешка при зареждане на съобщения' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/requests/[id]/messages
 * Create a new message in the request thread
 * Only customer and assigned provider can send
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const body = await request.json();
    const { body: messageBody } = body;

    if (!messageBody || typeof messageBody !== 'string' || !messageBody.trim()) {
      return NextResponse.json(
        { error: 'Съобщението не може да бъде празно' },
        { status: 400 }
      );
    }

    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    // Get request to verify access and status
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('id, customer_id, provider_id, status')
      .eq('id', requestId)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: 'Заявката не е намерена' },
        { status: 404 }
      );
    }

    // Check if user is participant
    const isCustomer = requestData.customer_id === user.id;
    const isProvider = requestData.provider_id === user.id;

    if (!isCustomer && !isProvider) {
      return NextResponse.json(
        { error: 'Нямате достъп до този чат' },
        { status: 403 }
      );
    }

    // Check if request is assigned (for providers)
    if (isProvider && requestData.status === 'open') {
      return NextResponse.json(
        { error: 'Не можете да изпращате съобщения преди заявката да е възложена' },
        { status: 403 }
      );
    }

    // Insert message
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        request_id: requestId,
        sender_id: user.id,
        body: messageBody.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return NextResponse.json(
        { error: 'Грешка при изпращане на съобщение' },
        { status: 500 }
      );
    }

    // Send debounced email notification
    // (This would be handled by a separate service in production)
    // For now, we'll just log it
    console.log('New message from', user.id, 'on request', requestId);

    return NextResponse.json(
      {
        success: true,
        data: newMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Грешка при изпращане на съобщение' },
      { status: 500 }
    );
  }
}
