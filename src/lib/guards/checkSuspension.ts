import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Check if user is suspended and return error if they are
 * Use this in protected API endpoints
 */
export async function checkUserSuspension(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return null; // Not authenticated, let other middleware handle it
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
      return null; // Not authenticated
    }

    // Check if user is suspended
    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('is_blocked, is_banned')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error checking suspension:', profileError);
      return null;
    }

    // Return error if suspended
    if (profile?.is_blocked || profile?.is_banned) {
      return NextResponse.json(
        {
          error: 'account_suspended',
          message: 'Вашият акаунт е спрян или забранен',
        },
        { status: 403 }
      );
    }

    return null; // User is not suspended
  } catch (error) {
    console.error('Error checking suspension:', error);
    return null; // Allow request if check fails
  }
}

/**
 * Middleware wrapper to check suspension on all protected endpoints
 */
export async function withSuspensionCheck(
  handler: (request: NextRequest, params: any) => Promise<Response>
) {
  return async (request: NextRequest, params: any) => {
    const suspensionError = await checkUserSuspension(request);
    if (suspensionError) {
      return suspensionError;
    }
    return handler(request, params);
  };
}
