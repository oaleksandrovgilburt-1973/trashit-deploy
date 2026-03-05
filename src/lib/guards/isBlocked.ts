import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Check if a user is blocked by another user
 * @param blockerId - The user who might have blocked
 * @param blockedUserId - The user who might be blocked
 * @returns true if blocked, false otherwise
 */
export async function isUserBlocked(
  blockerId: string,
  blockedUserId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_user_id', blockedUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking block status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking block status:', error);
    return false;
  }
}

/**
 * Check if a user is suspended (blocked or banned)
 * @param userId - The user to check
 * @returns true if suspended, false otherwise
 */
export async function isUserSuspended(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_blocked, is_banned')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking suspension status:', error);
      return false;
    }

    return data?.is_blocked === true || data?.is_banned === true;
  } catch (error) {
    console.error('Error checking suspension status:', error);
    return false;
  }
}

/**
 * Get list of users blocked by a user
 * @param userId - The user whose blocks to retrieve
 * @returns Array of blocked user IDs
 */
export async function getBlockedUsers(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_user_id')
      .eq('blocker_id', userId);

    if (error) {
      console.error('Error fetching blocked users:', error);
      return [];
    }

    return data?.map((block) => block.blocked_user_id) || [];
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return [];
  }
}

/**
 * Get list of users who blocked a user
 * @param userId - The user to check
 * @returns Array of blocker user IDs
 */
export async function getBlockers(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocker_id')
      .eq('blocked_user_id', userId);

    if (error) {
      console.error('Error fetching blockers:', error);
      return [];
    }

    return data?.map((block) => block.blocker_id) || [];
  } catch (error) {
    console.error('Error fetching blockers:', error);
    return [];
  }
}

/**
 * Block a user
 * @param blockerId - The user doing the blocking
 * @param blockedUserId - The user to block
 * @param reason - Optional reason for blocking
 * @returns Success status
 */
export async function blockUser(
  blockerId: string,
  blockedUserId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already blocked
    const alreadyBlocked = await isUserBlocked(blockerId, blockedUserId);
    if (alreadyBlocked) {
      return { success: false, error: 'Потребителят вече е блокиран' };
    }

    // Check for self-block
    if (blockerId === blockedUserId) {
      return { success: false, error: 'Не можете да се блокирате сами' };
    }

    // Create block
    const { error: blockError } = await supabase
      .from('user_blocks')
      .insert({
        blocker_id: blockerId,
        blocked_user_id: blockedUserId,
        reason: reason || null,
      });

    if (blockError) {
      console.error('Error blocking user:', blockError);
      return { success: false, error: 'Грешка при блокиране на потребител' };
    }

    // Log to audit trail
    await supabase.from('block_audit_log').insert({
      blocker_id: blockerId,
      blocked_user_id: blockedUserId,
      action: 'block',
      reason: reason || null,
    });

    return { success: true };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Unblock a user
 * @param blockerId - The user doing the unblocking
 * @param blockedUserId - The user to unblock
 * @returns Success status
 */
export async function unblockUser(
  blockerId: string,
  blockedUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete block
    const { error: deleteError } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_user_id', blockedUserId);

    if (deleteError) {
      console.error('Error unblocking user:', deleteError);
      return { success: false, error: 'Грешка при разблокиране на потребител' };
    }

    // Log to audit trail
    await supabase.from('block_audit_log').insert({
      blocker_id: blockerId,
      blocked_user_id: blockedUserId,
      action: 'unblock',
    });

    return { success: true };
  } catch (error) {
    console.error('Error unblocking user:', error);
    return { success: false, error: 'Грешка при обработка' };
  }
}

/**
 * Check if two users can communicate
 * @param userId1 - First user
 * @param userId2 - Second user
 * @returns true if they can communicate, false if either is blocked or suspended
 */
export async function canCommunicate(
  userId1: string,
  userId2: string
): Promise<boolean> {
  try {
    // Check if either user is suspended
    const [user1Suspended, user2Suspended] = await Promise.all([
      isUserSuspended(userId1),
      isUserSuspended(userId2),
    ]);

    if (user1Suspended || user2Suspended) {
      return false;
    }

    // Check if either user blocked the other
    const [user1BlockedUser2, user2BlockedUser1] = await Promise.all([
      isUserBlocked(userId1, userId2),
      isUserBlocked(userId2, userId1),
    ]);

    return !user1BlockedUser2 && !user2BlockedUser1;
  } catch (error) {
    console.error('Error checking communication:', error);
    return false;
  }
}

/**
 * Validate user can perform action
 * @param userId - The user performing the action
 * @returns Error message if user cannot perform action, null if allowed
 */
export async function validateUserCanAct(
  userId: string
): Promise<string | null> {
  try {
    const suspended = await isUserSuspended(userId);
    if (suspended) {
      return 'Вашият акаунт е спрян или забранен';
    }
    return null;
  } catch (error) {
    console.error('Error validating user:', error);
    return null;
  }
}
