import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/notifications/resend';

/**
 * POST /api/v1/test/send-email
 * Test endpoint to send test emails
 * 
 * Body:
 * {
 *   "email": "test@example.com",
 *   "type": "request_created" | "request_accepted" | "job_started" | "job_completed" | "job_closed" | "dispute_opened" | "new_message" | "provider_approved"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if this is a development environment
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Test endpoint only available in development' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, type } = body;

    if (!email || !type) {
      return NextResponse.json(
        { error: 'Missing email or type' },
        { status: 400 }
      );
    }

    // Validate email type
    const validTypes = [
      'request_created',
      'request_accepted',
      'job_started',
      'job_completed',
      'job_closed',
      'dispute_opened',
      'new_message',
      'provider_approved',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Send test email
    const result = await sendTestEmail(email, type);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      emailId: result.id,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
