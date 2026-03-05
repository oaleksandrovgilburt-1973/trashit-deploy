import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { blockUser, unblockUser, isUserBlocked } from '@/lib/guards/isBlocked';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/users/[id]/block
 * 
 * Block a user
 * 
 * Body:
 * {
 *   "reason": "optional reason for blocking"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { reason } = body;

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

    // Verify target user exists
    const { data: targetUser, error: targetError } = await authClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'Потребителят не е намерен' },
        { status: 404 }
      );
    }

    // Block user
    const blockResult = await blockUser(user.id, userId, reason);

    if (!blockResult.success) {
      return NextResponse.json(
        { error: blockResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Потребителят е успешно блокиран',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/users/[id]/block
 * 
 * Unblock a user
 */
export async function DELETE(
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

    // Unblock user
    const unblockResult = await unblockUser(user.id, userId);

    if (!unblockResult.success) {
      return NextResponse.json(
        { error: unblockResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Потребителят е успешно разблокиран',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/users/[id]/block
 * 
 * Check if current user has blocked this user
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

    // Check if blocked
    const blocked = await isUserBlocked(user.id, userId);

    return NextResponse.json({
      blocked,
    });
  } catch (error) {
    console.error('Error checking block status:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
