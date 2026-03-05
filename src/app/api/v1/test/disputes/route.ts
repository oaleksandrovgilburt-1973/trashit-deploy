import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/test/disputes
 * 
 * Test endpoint to verify disputes system
 * Creates a test dispute and returns details
 * 
 * Body:
 * {
 *   "requestId": "uuid",
 *   "customerId": "uuid",
 *   "providerId": "uuid",
 *   "reason": "incomplete_work"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, customerId, providerId, reason } = body;

    if (!requestId || !customerId || !providerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create dispute
    const { data: dispute, error: createError } = await supabase
      .from('disputes')
      .insert({
        request_id: requestId,
        opened_by_id: customerId,
        opened_against_id: providerId,
        reason: reason || 'incomplete_work',
        description: 'Test dispute for verification',
        status: 'open',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating dispute:', createError);
      return NextResponse.json(
        { error: 'Failed to create dispute', details: createError.message },
        { status: 500 }
      );
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        dispute_id: dispute.id,
        disputed_at: new Date().toISOString(),
        status: 'disputed',
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        dispute,
        message: 'Test dispute created successfully',
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
 * GET /api/v1/test/disputes
 * 
 * List all disputes for testing
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: disputes, error, count } = await supabase
      .from('disputes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch disputes', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      disputes: disputes || [],
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
