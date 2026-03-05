import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/v1/admin/stats
 * 
 * Get dashboard statistics (admin only)
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
    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нямате достъп до тази ресурс' },
        { status: 403 }
      );
    }

    // Get total users count
    const { count: totalUsers } = await authClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get pending providers count
    const { count: pendingProviders } = await authClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'provider')
      .eq('provider_status', 'pending');

    // Get suspended users count
    const { count: suspendedUsers } = await authClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_blocked', true);

    // Get open disputes count
    const { count: openDisputes } = await authClient
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // Get total requests count
    const { count: totalRequests } = await authClient
      .from('requests')
      .select('*', { count: 'exact', head: true });

    // Get completed requests count
    const { count: completedRequests } = await authClient
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      pendingProviders: pendingProviders || 0,
      suspendedUsers: suspendedUsers || 0,
      openDisputes: openDisputes || 0,
      totalRequests: totalRequests || 0,
      completedRequests: completedRequests || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
