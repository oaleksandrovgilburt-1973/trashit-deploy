import { supabase } from '@/lib/supabase';

export type NotificationType =
  | 'request_created'
  | 'request_accepted'
  | 'job_started'
  | 'job_completed'
  | 'job_closed'
  | 'dispute_opened'
  | 'new_message'
  | 'provider_approved'
  | 'payment_received'
  | 'payout_processed';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Create an in-app notification
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
}: CreateNotificationParams) {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }

    console.log(`Notification created: ${type} for user ${userId}`);
    return { success: true, notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: error.message, notifications: [] };
    }

    return { success: true, notifications: data || [] };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: String(error), notifications: [] };
  }
}

/**
 * Get paginated notifications for a user
 */
export async function getNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  try {
    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: error.message, notifications: [], total: 0 };
    }

    return { success: true, notifications: data || [], total: count || 0 };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: String(error), notifications: [], total: 0 };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notification: data };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('read', false)
      .select();

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: (data || []).length };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, error: error.message, count: 0 };
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return { success: false, error: String(error), count: 0 };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Create multiple notifications for multiple users
 */
export async function createNotificationsForUsers(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>
) {
  try {
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      type,
      title,
      message,
      data: data || {},
    }));

    const { data: created, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      console.error('Error creating notifications:', error);
      return { success: false, error: error.message };
    }

    console.log(`${created?.length || 0} notifications created for type ${type}`);
    return { success: true, notifications: created || [] };
  } catch (error) {
    console.error('Error creating notifications:', error);
    return { success: false, error: String(error) };
  }
}
