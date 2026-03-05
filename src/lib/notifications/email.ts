/**
 * Email notification system using Resend
 * 
 * Setup:
 * 1. Install: npm install resend
 * 2. Get API key from https://resend.com/api-keys
 * 3. Add to .env.local: RESEND_API_KEY=re_xxxxx
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using Resend API
 * Note: Requires RESEND_API_KEY environment variable
 */
export async function sendEmail({ to, subject, html }: EmailParams) {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      'RESEND_API_KEY not configured. Email notifications disabled.'
    );
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@trashit.bg',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return { success: false, error: error.message };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notification when provider accepts a request
 */
export async function sendRequestAcceptedEmail(
  customerEmail: string,
  customerName: string,
  providerName: string,
  requestDescription: string,
  requestAddress: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Вашата заявка е възложена!</h2>
      
      <p>Здравей ${customerName},</p>
      
      <p>Добра новина! Доставчикът <strong>${providerName}</strong> е приел вашата заявка за:</p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Описание:</strong> ${requestDescription}</p>
        <p style="margin: 0;"><strong>Адрес:</strong> ${requestAddress}</p>
      </div>
      
      <p>Доставчикът ще се свърже с вас скоро за да уточни детайлите.</p>
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer" 
           style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Виж детайлите на заявката
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #6b7280; font-size: 12px;">
        TRASHit - Платформа за управление на отпадъци
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Вашата заявка е възложена! 🎉',
    html,
  });
}

/**
 * Send notification when request is completed
 */
export async function sendRequestCompletedEmail(
  customerEmail: string,
  customerName: string,
  providerName: string,
  requestDescription: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Вашата заявка е завършена!</h2>
      
      <p>Здравей ${customerName},</p>
      
      <p>Доставчикът <strong>${providerName}</strong> е завършил вашата заявка за:</p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Описание:</strong> ${requestDescription}</p>
      </div>
      
      <p>Благодарим ви, че използвате TRASHit! Ако имате отзиви, моля споделете ги с нас.</p>
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer" 
           style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Виж всички заявки
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #6b7280; font-size: 12px;">
        TRASHit - Платформа за управление на отпадъци
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Вашата заявка е завършена! ✅',
    html,
  });
}

/**
 * Send notification when provider starts a request
 */
export async function sendJobStartedEmail(
  customerEmail: string,
  customerName: string,
  providerName: string,
  requestDescription: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Работата е начната!</h2>
      
      <p>Здравей ${customerName},</p>
      
      <p>Доставчикът <strong>${providerName}</strong> е начал работа по вашата заявка:</p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Описание:</strong> ${requestDescription}</p>
      </div>
      
      <p>Очаквайте завършване на работата и снимки като доказателство.</p>
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer" 
           style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Проследи прогреса
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #6b7280; font-size: 12px;">
        TRASHit - Платформа за управление на отпадъци
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Работата е начната! 🚀',
    html,
  });
}

/**
 * Send notification to provider when request is created in their region
 */
export async function sendNewRequestAvailableEmail(
  providerEmail: string,
  providerName: string,
  requestDescription: string,
  requestAddress: string,
  regionName: string,
  priceOffer?: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Нова работа е налична!</h2>
      
      <p>Здравей ${providerName},</p>
      
      <p>Има нова заявка в региона <strong>${regionName}</strong>:</p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Описание:</strong> ${requestDescription}</p>
        <p style="margin: 0 0 8px 0;"><strong>Адрес:</strong> ${requestAddress}</p>
        ${priceOffer ? `<p style="margin: 0;"><strong>Предложена цена:</strong> ${priceOffer} лева</p>` : ''}
      </div>
      
      <p>Бързайте да я приемете преди друг доставчик!</p>
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/provider/jobs" 
           style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Виж налични работи
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #6b7280; font-size: 12px;">
        TRASHit - Платформа за управление на отпадъци
      </p>
    </div>
  `;

  return sendEmail({
    to: providerEmail,
    subject: 'Нова работа е налична в ' + regionName + '! 🔔',
    html,
  });
}
