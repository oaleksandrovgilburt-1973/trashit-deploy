import { sendEmail, EmailType } from './resend';
import { createNotification, NotificationType, createNotificationsForUsers } from './inApp';
import { supabase } from '@/lib/supabase';

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  emailType: EmailType;
  title: string;
  message: string;
  emailData: Record<string, any>;
  inAppData?: Record<string, any>;
}

/**
 * Send both email and in-app notification
 */
export async function sendNotification({
  userId,
  type,
  emailType,
  title,
  message,
  emailData,
  inAppData,
}: NotificationPayload) {
  try {
    // Get user email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return { success: false, error: 'User not found' };
    }

    // Get user email from auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    const authUser = users?.find((u) => u.id === userId);

    if (!authUser?.email) {
      console.error('User email not found');
      return { success: false, error: 'User email not found' };
    }

    // Send email
    const emailResult = await sendEmail({
      to: authUser.email,
      type: emailType,
      data: emailData,
    });

    // Log email
    if (emailResult.success) {
      await supabase.from('email_log').insert({
        user_id: userId,
        email_address: authUser.email,
        type: emailType,
        subject: emailData.subject || title,
        resend_id: emailResult.id,
        status: 'sent',
      });
    } else {
      await supabase.from('email_log').insert({
        user_id: userId,
        email_address: authUser.email,
        type: emailType,
        subject: emailData.subject || title,
        status: 'failed',
        error_message: emailResult.error,
      });
    }

    // Create in-app notification
    const notificationResult = await createNotification({
      userId,
      type,
      title,
      message,
      data: inAppData,
    });

    return {
      success: emailResult.success && notificationResult.success,
      email: emailResult,
      notification: notificationResult,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send notification to multiple users
 */
export async function sendNotificationToUsers(
  userIds: string[],
  type: NotificationType,
  emailType: EmailType,
  title: string,
  message: string,
  emailDataFactory: (userId: string) => Record<string, any>,
  inAppData?: Record<string, any>
) {
  try {
    const results = await Promise.all(
      userIds.map((userId) =>
        sendNotification({
          userId,
          type,
          emailType,
          title,
          message,
          emailData: emailDataFactory(userId),
          inAppData,
        })
      )
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: failed === 0,
      successful,
      failed,
      results,
    };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send notification when request is created
 */
export async function notifyRequestCreated(
  customerId: string,
  requestId: string,
  requestData: {
    description: string;
    address: string;
    region: string;
    price: number;
  }
) {
  const requestUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/requests/${requestId}`;

  return sendNotification({
    userId: customerId,
    type: 'request_created',
    emailType: 'request_created',
    title: 'Вашата заявка е създадена',
    message: `Вашата заявка за "${requestData.description}" е успешно създадена.`,
    emailData: {
      customerName: 'Клиент',
      requestDescription: requestData.description,
      requestAddress: requestData.address,
      region: requestData.region,
      price: requestData.price.toString(),
      requestUrl,
    },
    inAppData: {
      requestId,
      ...requestData,
    },
  });
}

/**
 * Send notification when request is accepted
 */
export async function notifyRequestAccepted(
  customerId: string,
  providerId: string,
  requestId: string,
  requestData: {
    description: string;
    address: string;
  },
  providerData: {
    name: string;
    phone: string;
  }
) {
  const chatUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/requests/${requestId}/chat`;

  return sendNotification({
    userId: customerId,
    type: 'request_accepted',
    emailType: 'request_accepted',
    title: 'Вашата заявка е приета',
    message: `${providerData.name} е приел вашата заявка за "${requestData.description}".`,
    emailData: {
      customerName: 'Клиент',
      providerName: providerData.name,
      providerPhone: providerData.phone,
      requestDescription: requestData.description,
      requestAddress: requestData.address,
      chatUrl,
    },
    inAppData: {
      requestId,
      providerId,
      ...requestData,
    },
  });
}

/**
 * Send notification when job is started
 */
export async function notifyJobStarted(
  customerId: string,
  providerId: string,
  requestId: string,
  requestData: {
    description: string;
    address: string;
  },
  providerData: {
    name: string;
  }
) {
  const chatUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/requests/${requestId}/chat`;

  return sendNotification({
    userId: customerId,
    type: 'job_started',
    emailType: 'job_started',
    title: 'Работата е започната',
    message: `${providerData.name} е започнал работата на вашата заявка.`,
    emailData: {
      customerName: 'Клиент',
      providerName: providerData.name,
      requestDescription: requestData.description,
      requestAddress: requestData.address,
      chatUrl,
    },
    inAppData: {
      requestId,
      providerId,
      ...requestData,
    },
  });
}

/**
 * Send notification when job is completed
 */
export async function notifyJobCompleted(
  customerId: string,
  providerId: string,
  requestId: string,
  requestData: {
    description: string;
  },
  providerData: {
    name: string;
  },
  completionNotes: string
) {
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/requests/${requestId}/review`;

  return sendNotification({
    userId: customerId,
    type: 'job_completed',
    emailType: 'job_completed',
    title: 'Работата е завършена',
    message: `${providerData.name} е завършил работата на вашата заявка. Моля, преглед и потвърдете.`,
    emailData: {
      customerName: 'Клиент',
      providerName: providerData.name,
      requestDescription: requestData.description,
      completionNotes,
      reviewUrl,
    },
    inAppData: {
      requestId,
      providerId,
      ...requestData,
    },
  });
}

/**
 * Send notification when job is closed
 */
export async function notifyJobClosed(
  providerId: string,
  customerId: string,
  requestId: string,
  requestData: {
    description: string;
  },
  amount: number
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/provider`;

  return sendNotification({
    userId: providerId,
    type: 'job_closed',
    emailType: 'job_closed',
    title: 'Работата е затворена',
    message: `Работата е затворена и плащането е обработено. Получихте ${amount} BGN.`,
    emailData: {
      customerName: 'Клиент',
      providerName: 'Доставчик',
      requestDescription: requestData.description,
      amount: amount.toString(),
      dashboardUrl,
    },
    inAppData: {
      requestId,
      customerId,
      amount,
      ...requestData,
    },
  });
}

/**
 * Send notification when provider is approved
 */
export async function notifyProviderApproved(providerId: string, providerName: string) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/provider`;

  return sendNotification({
    userId: providerId,
    type: 'provider_approved',
    emailType: 'provider_approved',
    title: 'Профилът е одобрен',
    message: 'Вашият профил е одобрен от администратора. Можете да приемате работи.',
    emailData: {
      providerName,
      dashboardUrl,
    },
    inAppData: {
      providerId,
    },
  });
}

/**
 * Send notification for new message (debounced)
 */
export async function notifyNewMessage(
  recipientId: string,
  senderId: string,
  senderName: string,
  requestId: string,
  messagePreview: string
) {
  const chatUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/requests/${requestId}/chat`;

  return sendNotification({
    userId: recipientId,
    type: 'new_message',
    emailType: 'new_message',
    title: `Ново съобщение от ${senderName}`,
    message: messagePreview,
    emailData: {
      recipientName: 'Получател',
      senderName,
      messagePreview,
      chatUrl,
    },
    inAppData: {
      requestId,
      senderId,
      messagePreview,
    },
  });
}

/**
 * Send notification when dispute is opened
 */
export async function notifyDisputeOpened(
  recipientId: string,
  otherPartyName: string,
  recipientRole: 'provider' | 'admin',
  reason: string,
  requestId: string
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/${
    recipientRole === 'admin' ? 'admin' : 'provider'
  }`;

  return sendNotification({
    userId: recipientId,
    type: 'dispute_opened',
    emailType: 'dispute_opened',
    title: recipientRole === 'admin' ? 'Нов спор' : 'Спор е отворен',
    message:
      recipientRole === 'admin'
        ? `Нов спор е отворен по работа на платформата.`
        : `${otherPartyName} е отворил спор по вашата работа.`,
    emailData: {
      recipientName: 'Получател',
      recipientRole,
      otherPartyName,
      reason,
      dashboardUrl,
    },
    inAppData: {
      requestId,
      reason,
      otherPartyName,
    },
  });
}
