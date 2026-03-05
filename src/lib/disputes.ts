import { supabase } from '@/lib/supabase';

export type DisputeStatus = 'open' | 'resolved' | 'closed';
export type DisputeReason = 'incomplete_work' | 'poor_quality' | 'no_show' | 'other';

export interface Dispute {
  id: string;
  request_id: string;
  opened_by_id: string;
  opened_against_id: string;
  reason: string;
  description?: string;
  status: DisputeStatus;
  resolution?: string;
  resolved_by_id?: string;
  created_at: string;
  resolved_at?: string;
  updated_at: string;
}

export interface DisputeEvidence {
  id: string;
  dispute_id: string;
  file_url: string;
  file_type?: string;
  description?: string;
  uploaded_by_id: string;
  created_at: string;
}

/**
 * Check if a dispute can be opened for a request
 * Rules:
 * - Request must be in 'completed' status
 * - Request must have been completed within 48 hours
 * - No active dispute already exists
 */
export async function canOpenDispute(requestId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  try {
    const { data: request, error } = await supabase
      .from('requests')
      .select('status, updated_at, dispute_id')
      .eq('id', requestId)
      .single();

    if (error || !request) {
      return { allowed: false, reason: 'Заявката не е намерена' };
    }

    // Check status
    if (request.status !== 'completed') {
      return {
        allowed: false,
        reason: 'Спорът може да бъде отворен само за завършени работи',
      };
    }

    // Check if already disputed
    if (request.dispute_id) {
      return {
        allowed: false,
        reason: 'За тази заявка вече е отворен спор',
      };
    }

    // Check 48-hour window
    const completedTime = new Date(request.updated_at).getTime();
    const now = Date.now();
    const hoursPassed = (now - completedTime) / (1000 * 60 * 60);

    if (hoursPassed > 48) {
      return {
        allowed: false,
        reason: 'Спорът може да бъде отворен само в рамките на 48 часа след завършване',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking dispute eligibility:', error);
    return { allowed: false, reason: 'Грешка при проверка' };
  }
}

/**
 * Create a new dispute
 */
export async function createDispute(
  requestId: string,
  openedById: string,
  openedAgainstId: string,
  reason: string,
  description?: string
): Promise<{ success: boolean; dispute?: Dispute; error?: string }> {
  try {
    // Verify eligibility
    const eligible = await canOpenDispute(requestId);
    if (!eligible.allowed) {
      return { success: false, error: eligible.reason };
    }

    // Create dispute
    const { data: dispute, error: createError } = await supabase
      .from('disputes')
      .insert({
        request_id: requestId,
        opened_by_id: openedById,
        opened_against_id: openedAgainstId,
        reason,
        description,
        status: 'open',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating dispute:', createError);
      return { success: false, error: 'Грешка при създаване на спор' };
    }

    // Update request with dispute_id and status
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
      return { success: false, error: 'Грешка при актуализиране на заявката' };
    }

    return { success: true, dispute };
  } catch (error) {
    console.error('Error creating dispute:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Get dispute details
 */
export async function getDispute(
  disputeId: string
): Promise<{ success: boolean; dispute?: Dispute; error?: string }> {
  try {
    const { data: dispute, error } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', disputeId)
      .single();

    if (error || !dispute) {
      return { success: false, error: 'Спорът не е намерен' };
    }

    return { success: true, dispute };
  } catch (error) {
    console.error('Error fetching dispute:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Get all disputes for a request
 */
export async function getDisputesForRequest(
  requestId: string
): Promise<{ success: boolean; disputes?: Dispute[]; error?: string }> {
  try {
    const { data: disputes, error } = await supabase
      .from('disputes')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: 'Грешка при обработка' };
    }

    return { success: true, disputes: disputes || [] };
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Get disputes for a user (opened by or against)
 */
export async function getDisputesForUser(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{
  success: boolean;
  disputes?: Dispute[];
  total?: number;
  error?: string;
}> {
  try {
    const { data: disputes, error, count } = await supabase
      .from('disputes')
      .select('*', { count: 'exact' })
      .or(`opened_by_id.eq.${userId},opened_against_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: 'Грешка при обработка' };
    }

    return { success: true, disputes: disputes || [], total: count || 0 };
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Add evidence to a dispute
 */
export async function addDisputeEvidence(
  disputeId: string,
  fileUrl: string,
  uploadedById: string,
  fileType?: string,
  description?: string
): Promise<{ success: boolean; evidence?: DisputeEvidence; error?: string }> {
  try {
    const { data: evidence, error } = await supabase
      .from('dispute_evidence')
      .insert({
        dispute_id: disputeId,
        file_url: fileUrl,
        file_type: fileType,
        description,
        uploaded_by_id: uploadedById,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding evidence:', error);
      return { success: false, error: 'Грешка при добавяне на доказателство' };
    }

    return { success: true, evidence };
  } catch (error) {
    console.error('Error adding evidence:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Get evidence for a dispute
 */
export async function getDisputeEvidence(
  disputeId: string
): Promise<{ success: boolean; evidence?: DisputeEvidence[]; error?: string }> {
  try {
    const { data: evidence, error } = await supabase
      .from('dispute_evidence')
      .select('*')
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: 'Грешка при обработка' };
    }

    return { success: true, evidence: evidence || [] };
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Resolve a dispute (admin only)
 */
export async function resolveDispute(
  disputeId: string,
  resolution: string,
  resolvedById: string,
  status: 'resolved' | 'closed' = 'resolved'
): Promise<{ success: boolean; dispute?: Dispute; error?: string }> {
  try {
    const { data: dispute, error } = await supabase
      .from('disputes')
      .update({
        status,
        resolution,
        resolved_by_id: resolvedById,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', disputeId)
      .select()
      .single();

    if (error) {
      console.error('Error resolving dispute:', error);
      return { success: false, error: 'Грешка при разрешаване на спор' };
    }

    return { success: true, dispute };
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Cancel auto-close for a disputed request
 * This prevents the cron job from automatically closing the request
 */
export async function cancelAutoCloseForDispute(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Set a flag or update status to prevent auto-close
    // This is handled by checking dispute_id in the auto-close cron job
    const { error } = await supabase
      .from('requests')
      .update({
        status: 'disputed',
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error canceling auto-close:', error);
      return { success: false, error: 'Грешка при отмяна на автоматично затваряне' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error canceling auto-close:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}
