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

interface JobClosedProps {
  customerName: string;
  providerName: string;
  requestDescription: string;
  amount: string;
  dashboardUrl: string;
}

export default function JobClosed({
  customerName,
  providerName,
  requestDescription,
  amount,
  dashboardUrl,
}: JobClosedProps) {
  return (
    <Html>
      <Head />
      <Preview>Работата е затворена и плащането е обработено</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Работата е затворена</Text>
            <Text style={paragraph}>
              Здравей {customerName},
            </Text>
            <Text style={paragraph}>
              Работата по вашата заявка е официално затворена. Плащането е обработено успешно.
            </Text>

            <Section style={paymentBox}>
              <Text style={label}>Доставчик:</Text>
              <Text style={value}>{providerName}</Text>
              <Text style={label} style={{ marginTop: '12px' }}>Сума:</Text>
              <Text style={amount}>{amount} лв.</Text>
            </Section>

            <Text style={paragraph}>
              Благодарим ви, че използвате TRASHit! Ако имате някакви въпроси, можете да се свържете с нас.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={dashboardUrl}>
                Моят панел
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
  color: '#059669',
  margin: '16px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4b5563',
  margin: '16px 0',
};

const paymentBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  borderLeft: '4px solid #059669',
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
};

const amount = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#059669',
  margin: '8px 0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#059669',
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
