/**
 * Database helper for status transitions
 * Validates and executes status transitions with audit logging
 */

import { createClient } from '@supabase/supabase-js';
import { RequestStatus, isValidTransition } from '@/lib/stateMachine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface TransitionResult {
  success: boolean;
  error?: string;
  message?: string;
  request_id?: string;
}

/**
 * Validate that a user can transition a request
 */
export async function validateTransition(
  requestId: string,
  userId: string,
  fromStatus: RequestStatus,
  toStatus: RequestStatus,
  userRole: 'customer' | 'provider'
): Promise<{ valid: boolean; error?: string }> {
  // Check if transition is valid in state machine
  if (!isValidTransition(fromStatus, toStatus)) {
    return {
      valid: false,
      error: `Невалидна промяна на статус: ${fromStatus} → ${toStatus}`,
    };
  }

  // Check user permissions
  if (userRole === 'provider') {
    // Providers can only transition assigned → in_progress → completed
    if (fromStatus === 'assigned' && toStatus !== 'in_progress') {
      return {
        valid: false,
        error: 'Доставчик може само да начне работа',
      };
    }

    if (fromStatus === 'in_progress' && toStatus !== 'completed') {
      return {
        valid: false,
        error: 'Доставчик може само да завърши работата',
      };
    }

    // Verify provider is assigned to request
    const { data: request, error } = await supabase
      .from('requests')
      .select('provider_id')
      .eq('id', requestId)
      .single();

    if (error || !request || request.provider_id !== userId) {
      return {
        valid: false,
        error: 'Вие не сте възложени на тази заявка',
      };
    }
  }

  if (userRole === 'customer') {
    // Customers can only cancel open requests
    if (toStatus !== 'cancelled' || fromStatus !== 'open') {
      return {
        valid: false,
        error: 'Клиенти могат само да отменят отворени заявки',
      };
    }

    // Verify customer owns request
    const { data: request, error } = await supabase
      .from('requests')
      .select('customer_id')
      .eq('id', requestId)
      .single();

    if (error || !request || request.customer_id !== userId) {
      return {
        valid: false,
        error: 'Вие не сте собственик на тази заявка',
      };
    }
  }

  return { valid: true };
}

/**
 * Transition request status
 */
export async function transitionRequestStatus(
  requestId: string,
  userId: string,
  toStatus: RequestStatus,
  userRole: 'customer' | 'provider',
  notes?: string
): Promise<TransitionResult> {
  try {
    // Get current request
    const { data: request, error: fetchError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return {
        success: false,
        error: 'Заявката не е намерена',
      };
    }

    const fromStatus = request.status as RequestStatus;

    // Validate transition
    const validation = await validateTransition(
      requestId,
      userId,
      fromStatus,
      toStatus,
      userRole
    );

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Build update object
    const updateData: any = {
      status: toStatus,
      updated_at: new Date().toISOString(),
    };

    if (toStatus === 'in_progress') {
      updateData.started_at = new Date().toISOString();
    }

    if (toStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
      if (notes) {
        updateData.completion_notes = notes;
      }
    }

    // Update request
    const { error: updateError } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', requestId);

    if (updateError) {
      return {
        success: false,
        error: 'Грешка при обновяване на заявката',
      };
    }

    // Create audit log entry
    await supabase.from('audit_log').insert({
      entity_type: 'request',
      entity_id: requestId,
      actor_id: userId,
      action: 'status_changed',
      old_value: { status: fromStatus },
      new_value: { status: toStatus },
    });

    return {
      success: true,
      message: `Статусът е променен на ${toStatus}`,
      request_id: requestId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестна грешка',
    };
  }
}
