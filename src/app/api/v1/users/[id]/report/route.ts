import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createUserReport } from '@/lib/reports';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/users/[id]/report
 * 
 * Report a user for inappropriate behavior, fraud, etc.
 * 
 * Body:
 * {
 *   "reason": "inappropriate_behavior" | "fraud" | "harassment" | "scam" | "other",
 *   "description": "Detailed description of the issue"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportedUserId = params.id;
    const body = await request.json();
    const { reason, description } = body;

    // Validate input
    if (!reason) {
      return NextResponse.json(
        { error: 'Причината е задължителна' },
        { status: 400 }
      );
    }

    const validReasons = [
      'inappropriate_behavior',
      'fraud',
      'harassment',
      'scam',
      'other',
    ];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Невалидна причина' },
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

    // Verify reported user exists
    const { data: reportedUser, error: userError } = await authClient
      .from('profiles')
      .select('id')
      .eq('id', reportedUserId)
      .single();

    if (userError || !reportedUser) {
      return NextResponse.json(
        { error: 'Потребителят не е намерен' },
        { status: 404 }
      );
    }

    // Create report
    const reportResult = await createUserReport(
      user.id,
      reportedUserId,
      reason,
      description
    );

    if (!reportResult.success) {
      return NextResponse.json(
        { error: reportResult.error },
        { status: 400 }
      );
    }

    // Notify admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      // Send notification to admins about new report
      // This would use the notification system
      console.log(`New user report: ${reportResult.report?.id}`);
    }

    return NextResponse.json(
      {
        success: true,
        report: reportResult.report,
        message: 'Докладът е успешно подаден',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/users/[id]/report
 * 
 * Get reports for a user (admin only)
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get reports
    const { data: reports, error: reportError, count } = await authClient
      .from('user_reports')
      .select('*', { count: 'exact' })
      .eq('reported_user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reportError) {
      return NextResponse.json(
        { error: 'Грешка при обработка' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reports: reports || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
