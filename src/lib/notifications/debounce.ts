import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface DebouncedNotification {
  requestId: string;
  userId: string;
  lastNotificationTime: number;
}

// In-memory store for debouncing (in production, use Redis or database)
const notificationCache = new Map<string, DebouncedNotification>();

const DEBOUNCE_INTERVAL = 15 * 60 * 1000; // 15 minutes

/**
 * Send debounced email notification for new messages
 * Max 1 email per 15 minutes per thread per recipient
 */
export async function sendDebouncedMessageNotification(
  requestId: string,
  recipientId: string,
  recipientEmail: string,
  senderName: string
) {
  try {
    const cacheKey = `${requestId}:${recipientId}`;
    const cached = notificationCache.get(cacheKey);
    const now = Date.now();

    // Check if we've already sent a notification recently
    if (cached && now - cached.lastNotificationTime < DEBOUNCE_INTERVAL) {
      console.log(`Skipping notification for ${cacheKey} (debounced)`);
      return;
    }

    // Update cache
    notificationCache.set(cacheKey, {
      requestId,
      userId: recipientId,
      lastNotificationTime: now,
    });

    // Send email via Resend (if configured)
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'TRASHit <notifications@trashit.bg>',
          to: recipientEmail,
          subject: 'Ново съобщение в TRASHit',
          html: `
            <h2>Ново съобщение</h2>
            <p>${senderName} ви е изпратил ново съобщение в TRASHit.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/${requestId}/chat">
                Отворете чата
              </a>
            </p>
          `,
        }),
      });

      if (!response.ok) {
        console.error('Error sending email:', await response.text());
      }
    }

    // Log notification for audit
    await supabase.from('notification_log').insert({
      request_id: requestId,
      recipient_id: recipientId,
      sender_name: senderName,
      type: 'message',
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending debounced notification:', error);
  }
}

/**
 * Clean up old cache entries (call periodically)
 */
export function cleanupNotificationCache() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, value] of notificationCache.entries()) {
    if (now - value.lastNotificationTime > DEBOUNCE_INTERVAL * 2) {
      notificationCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} notification cache entries`);
  }
}
