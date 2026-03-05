import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * PUT /api/v1/requests/[id]/messages/read
 * Mark all unread messages in a thread as read for the current user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

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
      .select('id, customer_id, provider_id')
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

    // Get unread messages for current user
    const { data: unreadMessages, error: fetchError } = await supabase
      .from('messages')
      .select('id, read_by')
      .eq('request_id', requestId)
      .neq('sender_id', user.id)
      .filter('read_by', 'not.contains', `["${user.id}"]`);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Грешка при зареждане на съобщения' },
        { status: 500 }
      );
    }

    if (!unreadMessages || unreadMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Няма непрочетени съобщения',
        marked_count: 0,
      });
    }

    // Mark messages as read
    const messageIds = unreadMessages.map((msg) => msg.id);

    const { error: updateError } = await supabase
      .from('messages')
      .update({
        read_by: unreadMessages.map((msg) => [
          ...(msg.read_by || []),
          user.id,
        ]),
      })
      .in('id', messageIds);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return NextResponse.json(
        { error: 'Грешка при маркиране на съобщения като прочетени' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Съобщенията са маркирани като прочетени',
      marked_count: messageIds.length,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Грешка при маркиране на съобщения като прочетени' },
      { status: 500 }
    );
  }
}
