import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnreadNotifications, getNotifications, markAllNotificationsAsRead, getUnreadCount } from '@/lib/notifications/inApp';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/v1/notifications
 * Get notifications for the current user
 * Query params:
 *   - limit: number of notifications to return (default: 20)
 *   - offset: pagination offset (default: 0)
 *   - unread_only: return only unread notifications (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Verify the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const action = searchParams.get('action');

    // Mark all as read
    if (action === 'mark_all_read') {
      const result = await markAllNotificationsAsRead(user.id);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, marked: result.count });
    }

    // Get unread count
    if (action === 'unread_count') {
      const result = await getUnreadCount(user.id);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ unread_count: result.count });
    }

    // Get notifications
    let result;
    if (unreadOnly) {
      result = await getUnreadNotifications(user.id);
    } else {
      result = await getNotifications(user.id, limit, offset);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications: result.notifications,
      total: 'total' in result ? result.total : result.notifications.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/notifications/:id
 * Mark a notification as read
 */
export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Verify the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, read } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing notification id' },
        { status: 400 }
      );
    }

    // Update notification
    const { data, error } = await supabase
      .from('notifications')
      .update({
        read: read !== undefined ? read : true,
        read_at: read !== false ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Verify the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing notification id' },
        { status: 400 }
      );
    }

    // Delete notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
