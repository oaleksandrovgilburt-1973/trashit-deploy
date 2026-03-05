import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/v1/admin/users
 * 
 * List all users with filtering (admin only)
 * 
 * Query Parameters:
 * - role: customer | provider | admin
 * - status: pending | approved | suspended | banned
 * - search: search by name or email
 * - limit: 50 (default)
 * - offset: 0 (default)
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = authClient.from('profiles').select('*', { count: 'exact' });

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (status === 'pending') {
      query = query.eq('role', 'provider').eq('provider_status', 'pending');
    } else if (status === 'approved') {
      query = query.eq('provider_status', 'approved');
    } else if (status === 'suspended') {
      query = query.eq('is_blocked', true).eq('is_banned', false);
    } else if (status === 'banned') {
      query = query.eq('is_banned', true);
    }

    // Apply search
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Apply sorting and pagination
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Грешка при обработка' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
