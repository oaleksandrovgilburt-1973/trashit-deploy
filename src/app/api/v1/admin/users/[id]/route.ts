import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyProviderApproved } from '@/lib/notifications/sender';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * PATCH /api/v1/admin/users/[id]
 * 
 * Admin actions on users: approve, suspend, ban
 * 
 * Body:
 * {
 *   "action": "approve" | "suspend" | "unsuspend" | "ban",
 *   "reason": "optional reason for suspension/ban"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { action, reason } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Действието е задължително' },
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
    const { data: adminProfile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нямате достъп до тази ресурс' },
        { status: 403 }
      );
    }

    // Get target user
    const { data: targetUser, error: fetchError } = await authClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'Потребителят не е намерен' },
        { status: 404 }
      );
    }

    let updateData: Record<string, any> = {};

    // Handle different actions
    switch (action) {
      case 'approve':
        if (targetUser.role !== 'provider') {
          return NextResponse.json(
            { error: 'Само доставчици могат да бъдат одобрени' },
            { status: 400 }
          );
        }
        updateData = {
          provider_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by_id: user.id,
        };
        break;

      case 'suspend':
        updateData = {
          is_blocked: true,
          suspended_at: new Date().toISOString(),
          suspended_reason: reason || 'Спиране от администратор',
          suspended_by_id: user.id,
        };
        break;

      case 'unsuspend':
        updateData = {
          is_blocked: false,
          suspended_at: null,
          suspended_reason: null,
          suspended_by_id: null,
        };
        break;

      case 'ban':
        updateData = {
          is_blocked: true,
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_reason: reason || 'Забрана от администратор',
          banned_by_id: user.id,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Невалидно действие' },
          { status: 400 }
        );
    }

    // Update user
    const { data: updatedUser, error: updateError } = await authClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Грешка при актуализиране на потребител' },
        { status: 500 }
      );
    }

    // Send notification for approval
    if (action === 'approve') {
      await notifyProviderApproved(userId, targetUser.full_name || 'Доставчик');
    }

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action,
      target_user_id: userId,
      reason: reason || null,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        user: updatedUser,
        message: `Потребителят е успешно ${
          action === 'approve'
            ? 'одобрен'
            : action === 'suspend'
              ? 'спрян'
              : action === 'unsuspend'
                ? 'възстановен'
                : 'забранен'
        }`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/admin/users/[id]
 * 
 * Get user details (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

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
    const { data: adminProfile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нямате достъп до тази ресурс' },
        { status: 403 }
      );
    }

    // Get target user with related data
    const { data: targetUser, error: fetchError } = await authClient
      .from('profiles')
      .select(
        `
        *,
        requests:requests(count),
        completed_requests:requests(count)
      `
      )
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'Потребителят не е намерен' },
        { status: 404 }
      );
    }

    // Get user's requests
    const { data: requests } = await authClient
      .from('requests')
      .select('*')
      .or(`customer_id.eq.${userId},provider_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      user: targetUser,
      requests: requests || [],
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
