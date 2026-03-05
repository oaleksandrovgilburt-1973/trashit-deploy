import { supabase } from '@/lib/supabase';

export type ReportReason =
  | 'inappropriate_behavior'
  | 'fraud'
  | 'harassment'
  | 'scam'
  | 'other';

export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolution?: string;
  resolved_by_id?: string;
  created_at: string;
  resolved_at?: string;
  updated_at: string;
}

/**
 * Create a user report
 */
export async function createUserReport(
  reporterId: string,
  reportedUserId: string,
  reason: ReportReason,
  description?: string
): Promise<{ success: boolean; report?: UserReport; error?: string }> {
  try {
    // Prevent self-reporting
    if (reporterId === reportedUserId) {
      return { success: false, error: 'Не можете да докладвате сами на себе си' };
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
      return {
        success: false,
        error: 'Вече сте докладвали този потребител',
      };
    }

    // Create report
    const { data: report, error } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason,
        description,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return { success: false, error: 'Грешка при създаване на доклад' };
    }

    return { success: true, report };
  } catch (error) {
    console.error('Error creating report:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Get report details
 */
export async function getUserReport(
  reportId: string
): Promise<{ success: boolean; report?: UserReport; error?: string }> {
  try {
    const { data: report, error } = await supabase
      .from('user_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return { success: false, error: 'Докладът не е намерен' };
    }

    return { success: true, report };
  } catch (error) {
    console.error('Error fetching report:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Get reports for a user (reported by or against)
 */
export async function getUserReports(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{
  success: boolean;
  reports?: UserReport[];
  total?: number;
  error?: string;
}> {
  try {
    const { data: reports, error, count } = await supabase
      .from('user_reports')
      .select('*', { count: 'exact' })
      .or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: 'Грешка при обработка' };
    }

    return { success: true, reports: reports || [], total: count || 0 };
  } catch (error) {
    console.error('Error fetching reports:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Get all open reports (admin only)
 */
export async function getOpenReports(
  limit: number = 50,
  offset: number = 0
): Promise<{
  success: boolean;
  reports?: UserReport[];
  total?: number;
  error?: string;
}> {
  try {
    const { data: reports, error, count } = await supabase
      .from('user_reports')
      .select('*', { count: 'exact' })
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: 'Грешка при обработка' };
    }

    return { success: true, reports: reports || [], total: count || 0 };
  } catch (error) {
    console.error('Error fetching reports:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Resolve a report (admin only)
 */
export async function resolveUserReport(
  reportId: string,
  resolution: string,
  resolvedById: string,
  status: 'resolved' | 'dismissed' = 'resolved'
): Promise<{ success: boolean; report?: UserReport; error?: string }> {
  try {
    const { data: report, error } = await supabase
      .from('user_reports')
      .update({
        status,
        resolution,
        resolved_by_id: resolvedById,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Error resolving report:', error);
      return { success: false, error: 'Грешка при разрешаване на доклад' };
    }

    return { success: true, report };
  } catch (error) {
    console.error('Error resolving report:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Suspend a user (admin only)
 */
export async function suspendUser(
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        provider_status: 'suspended',
      })
      .eq('id', userId);

    if (error) {
      console.error('Error suspending user:', error);
      return { success: false, error: 'Грешка при спиране на потребител' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Unsuspend a user (admin only)
 */
export async function unsuspendUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        provider_status: 'approved',
      })
      .eq('id', userId);

    if (error) {
      console.error('Error unsuspending user:', error);
      return { success: false, error: 'Грешка при възстановяване на потребител' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error unsuspending user:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}
