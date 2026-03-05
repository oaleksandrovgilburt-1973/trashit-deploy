import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface DisputeOpenedProps {
  recipientName: string;
  recipientRole: 'customer' | 'provider';
  otherPartyName: string;
  reason: string;
  dashboardUrl: string;
}

export default function DisputeOpened({
  recipientName,
  recipientRole,
  otherPartyName,
  reason,
  dashboardUrl,
}: DisputeOpenedProps) {
  const isCustomer = recipientRole === 'customer';

  return (
    <Html>
      <Head />
      <Preview>Спор е отворен</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Спор е отворен</Text>
            <Text style={paragraph}>
              Здравей {recipientName},
            </Text>
            <Text style={paragraph}>
              {isCustomer
                ? `Клиентът ${otherPartyName} е отворил спор относно вашата работа.`
                : `Доставчикът ${otherPartyName} е отворил спор относно вашата заявка.`}
            </Text>

            <Section style={disputeBox}>
              <Text style={label}>Причина:</Text>
              <Text style={value}>{reason}</Text>
            </Section>

            <Text style={paragraph}>
              Администраторът на TRASHit ще разгледа спора и ще вземе решение в течение на 48 часа.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={dashboardUrl}>
                Преглед на спора
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              © 2024 TRASHit. Всички права запазени.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f3f4f6',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#dc2626',
  margin: '16px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4b5563',
  margin: '16px 0',
};

const disputeBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  borderLeft: '4px solid #dc2626',
};

const label = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '8px 0',
};

const value = {
  fontSize: '14px',
  color: '#1f2937',
  margin: '8px 0',
  lineHeight: '1.6',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
};
