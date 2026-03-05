import { Resend } from 'resend';
import { render } from '@react-email/components';
import RequestCreated from '@/emails/RequestCreated';
import RequestAccepted from '@/emails/RequestAccepted';
import JobStarted from '@/emails/JobStarted';
import JobCompleted from '@/emails/JobCompleted';
import JobClosed from '@/emails/JobClosed';
import DisputeOpened from '@/emails/DisputeOpened';
import NewMessage from '@/emails/NewMessage';
import ProviderApproved from '@/emails/ProviderApproved';

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailType =
  | 'request_created'
  | 'request_accepted'
  | 'job_started'
  | 'job_completed'
  | 'job_closed'
  | 'dispute_opened'
  | 'new_message'
  | 'provider_approved';

interface EmailPayload {
  to: string;
  type: EmailType;
  data: Record<string, any>;
}

/**
 * Send email using Resend with React Email templates
 */
export async function sendEmail({ to, type, data }: EmailPayload) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    let subject = '';
    let html = '';

    switch (type) {
      case 'request_created':
        subject = 'Вашата заявка е създадена успешно';
        html = render(
          RequestCreated({
            customerName: data.customerName,
            requestDescription: data.requestDescription,
            requestAddress: data.requestAddress,
            region: data.region,
            price: data.price,
            requestUrl: data.requestUrl,
          })
        );
        break;

      case 'request_accepted':
        subject = 'Вашата заявка е приета!';
        html = render(
          RequestAccepted({
            customerName: data.customerName,
            providerName: data.providerName,
            providerPhone: data.providerPhone,
            requestDescription: data.requestDescription,
            requestAddress: data.requestAddress,
            chatUrl: data.chatUrl,
          })
        );
        break;

      case 'job_started':
        subject = 'Работата е започната';
        html = render(
          JobStarted({
            customerName: data.customerName,
            providerName: data.providerName,
            requestDescription: data.requestDescription,
            requestAddress: data.requestAddress,
            chatUrl: data.chatUrl,
          })
        );
        break;

      case 'job_completed':
        subject = 'Работата е завършена';
        html = render(
          JobCompleted({
            customerName: data.customerName,
            providerName: data.providerName,
            requestDescription: data.requestDescription,
            completionNotes: data.completionNotes,
            reviewUrl: data.reviewUrl,
          })
        );
        break;

      case 'job_closed':
        subject = 'Работата е затворена и плащането е обработено';
        html = render(
          JobClosed({
            customerName: data.customerName,
            providerName: data.providerName,
            requestDescription: data.requestDescription,
            amount: data.amount,
            dashboardUrl: data.dashboardUrl,
          })
        );
        break;

      case 'dispute_opened':
        subject = 'Спор е отворен';
        html = render(
          DisputeOpened({
            recipientName: data.recipientName,
            recipientRole: data.recipientRole,
            otherPartyName: data.otherPartyName,
            reason: data.reason,
            dashboardUrl: data.dashboardUrl,
          })
        );
        break;

      case 'new_message':
        subject = `Ново съобщение от ${data.senderName}`;
        html = render(
          NewMessage({
            recipientName: data.recipientName,
            senderName: data.senderName,
            messagePreview: data.messagePreview,
            chatUrl: data.chatUrl,
          })
        );
        break;

      case 'provider_approved':
        subject = 'Вашият профил е одобрен!';
        html = render(
          ProviderApproved({
            providerName: data.providerName,
            dashboardUrl: data.dashboardUrl,
          })
        );
        break;

      default:
        return { success: false, error: 'Unknown email type' };
    }

    const response = await resend.emails.send({
      from: 'TRASHit <notifications@trashit.bg>',
      to,
      subject,
      html,
    });

    if (response.error) {
      console.error('Resend error:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log(`Email sent: ${type} to ${to}`);
    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send email in test mode (for development)
 */
export async function sendTestEmail(to: string, type: EmailType) {
  const mockData: Record<EmailType, Record<string, any>> = {
    request_created: {
      customerName: 'Иван Петров',
      requestDescription: 'Отвоз на боклук',
      requestAddress: 'ул. Васил Левски 42, София',
      region: 'Лозенец',
      price: '50',
      requestUrl: 'http://localhost:3000/requests/123',
    },
    request_accepted: {
      customerName: 'Иван Петров',
      providerName: 'Марин Иванов',
      providerPhone: '+359 88 123 4567',
      requestDescription: 'Отвоз на боклук',
      requestAddress: 'ул. Васил Левски 42, София',
      chatUrl: 'http://localhost:3000/requests/123/chat',
    },
    job_started: {
      customerName: 'Иван Петров',
      providerName: 'Марин Иванов',
      requestDescription: 'Отвоз на боклук',
      requestAddress: 'ул. Васил Левски 42, София',
      chatUrl: 'http://localhost:3000/requests/123/chat',
    },
    job_completed: {
      customerName: 'Иван Петров',
      providerName: 'Марин Иванов',
      requestDescription: 'Отвоз на боклук',
      completionNotes: 'Боклукът е успешно отвозен. Площадката е почистена.',
      reviewUrl: 'http://localhost:3000/requests/123/review',
    },
    job_closed: {
      customerName: 'Иван Петров',
      providerName: 'Марин Иванов',
      requestDescription: 'Отвоз на боклук',
      amount: '50',
      dashboardUrl: 'http://localhost:3000/dashboard/customer',
    },
    dispute_opened: {
      recipientName: 'Марин Иванов',
      recipientRole: 'provider',
      otherPartyName: 'Иван Петров',
      reason: 'Работата не е завършена правилно',
      dashboardUrl: 'http://localhost:3000/dashboard/provider',
    },
    new_message: {
      recipientName: 'Марин Иванов',
      senderName: 'Иван Петров',
      messagePreview: 'Кога ще дойдеш?',
      chatUrl: 'http://localhost:3000/requests/123/chat',
    },
    provider_approved: {
      providerName: 'Марин Иванов',
      dashboardUrl: 'http://localhost:3000/dashboard/provider',
    },
  };

  return sendEmail({
    to,
    type,
    data: mockData[type],
  });
}
