import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AcceptRequestResult {
  success: boolean;
  error?: string;
  message: string;
  request_id?: string;
  customer_id?: string;
}

/**
 * Atomically accept a request using PostgreSQL RPC function
 * Uses FOR UPDATE NOWAIT to prevent race conditions
 * 
 * Returns:
 * - success: true if accepted
 * - error: 'already_taken' if another provider accepted first
 * - error: 'not_in_region' if provider doesn't serve this region
 * - error: 'not_approved' if provider is not approved
 */
export async function acceptRequest(
  requestId: string,
  providerId: string,
  token: string
): Promise<AcceptRequestResult> {
  try {
    // Create authenticated client with user's token
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

    // Call the RPC function
    const { data, error } = await authClient.rpc('accept_request', {
      p_request_id: requestId,
      p_provider_id: providerId,
    });

    if (error) {
      console.error('RPC error:', error);
      return {
        success: false,
        error: 'database_error',
        message: error.message,
      };
    }

    return data as AcceptRequestResult;
  } catch (err) {
    console.error('Accept request error:', err);
    return {
      success: false,
      error: 'unknown_error',
      message: err instanceof Error ? err.message : 'Неизвестна грешка',
    };
  }
}

/**
 * Get request details with customer info
 */
export async function getRequestWithCustomer(requestId: string) {
  const { data, error } = await supabase
    .from('requests')
    .select(
      `
      *,
      customer:customer_id(id, full_name, phone, email:auth.users(email)),
      region:region_id(id, name),
      provider:provider_id(id, full_name, phone)
    `
    )
    .eq('id', requestId)
    .single();

  if (error) {
    console.error('Get request error:', error);
    return null;
  }

  return data;
}

/**
 * Get audit log entries for a request
 */
export async function getRequestAuditLog(requestId: string) {
  const { data, error } = await supabase
    .from('audit_log')
    .select(
      `
      *,
      actor:actor_id(id, full_name)
    `
    )
    .eq('entity_id', requestId)
    .eq('entity_type', 'request')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get audit log error:', error);
    return [];
  }

  return data || [];
}
