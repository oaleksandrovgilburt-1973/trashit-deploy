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

interface JobStartedProps {
  customerName: string;
  providerName: string;
  requestDescription: string;
  requestAddress: string;
  chatUrl: string;
}

export default function JobStarted({
  customerName,
  providerName,
  requestDescription,
  requestAddress,
  chatUrl,
}: JobStartedProps) {
  return (
    <Html>
      <Head />
      <Preview>Работата е започната</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Работата е започната</Text>
            <Text style={paragraph}>
              Здравей {customerName},
            </Text>
            <Text style={paragraph}>
              {providerName} е започнал работата по вашата заявка за отвоз на боклук.
            </Text>

            <Section style={detailsBox}>
              <Text style={label}>Адрес:</Text>
              <Text style={value}>{requestAddress}</Text>
            </Section>

            <Text style={paragraph}>
              Работата трябва да бъде завършена в скоро време. Можете да следите напредъка чрез чата.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={chatUrl}>
                Отворете чата
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
  color: '#7c3aed',
  margin: '16px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4b5563',
  margin: '16px 0',
};

const detailsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
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

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#7c3aed',
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
