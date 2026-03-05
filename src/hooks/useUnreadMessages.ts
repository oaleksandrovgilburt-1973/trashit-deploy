import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/database.types';

/**
 * Hook to get unread message count for current user
 * Polls every 10 seconds for new unread messages
 */
export function useUnreadMessages(userId?: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      try {
        // Get all requests where user is participant
        const { data: requests, error: requestsError } = await supabase
          .from('requests')
          .select('id, customer_id, provider_id')
          .or(`customer_id.eq.${userId},provider_id.eq.${userId}`);

        if (requestsError || !requests) {
          setUnreadCount(0);
          return;
        }

        const requestIds = requests.map((r) => r.id);

        if (requestIds.length === 0) {
          setUnreadCount(0);
          return;
        }

        // Get unread messages for all requests
        let query = supabase
          .from('messages')
          .select('id, read_by')
          .in('request_id', requestIds)
          .neq('sender_id', userId);

        const { data: messages, error: messagesError } = await query;

        if (messagesError || !messages) {
          setUnreadCount(0);
          return;
        }

        // Count unread messages
        const unread = messages.filter((msg) => {
          const readBy = msg.read_by || [];
          return !readBy.includes(userId);
        });

        setUnreadCount(unread.length);
      } catch (error) {
        console.error('Error fetching unread messages:', error);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Poll every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  return { unreadCount, loading };
}
