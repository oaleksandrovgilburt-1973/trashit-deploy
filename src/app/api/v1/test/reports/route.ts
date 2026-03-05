import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/test/reports
 * 
 * Test endpoint to verify reports system
 * Creates a test report and returns details
 * 
 * Body:
 * {
 *   "reporterId": "uuid",
 *   "reportedUserId": "uuid",
 *   "reason": "fraud"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reporterId, reportedUserId, reason } = body;

    if (!reporterId || !reportedUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if already reported
    const { data: existingReport } = await supabase
      .from('user_reports')
      .select('id')
      .eq('reporter_id', reporterId)
      .eq('reported_user_id', reportedUserId)
      .eq('status', 'open')
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: 'User already reported' },
        { status: 400 }
      );
    }

    // Create report
    const { data: report, error: createError } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason: reason || 'fraud',
        description: 'Test report for verification',
        status: 'open',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating report:', createError);
      return NextResponse.json(
        { error: 'Failed to create report', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        report,
        message: 'Test report created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/test/reports
 * 
 * List all reports for testing
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: reports, error, count } = await supabase
      .from('user_reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch reports', details: error.message },
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
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    );
  }
}
