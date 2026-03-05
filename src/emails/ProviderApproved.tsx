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

interface ProviderApprovedProps {
  providerName: string;
  dashboardUrl: string;
}

export default function ProviderApproved({
  providerName,
  dashboardUrl,
}: ProviderApprovedProps) {
  return (
    <Html>
      <Head />
      <Preview>Вашият профил е одобрен!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Профилът е одобрен!</Text>
            <Text style={paragraph}>
              Здравей {providerName},
            </Text>
            <Text style={paragraph}>
              Поздравления! Вашият профил е одобрен от администратора на TRASHit. Сега можете да приемате работи и да печелите пари.
            </Text>

            <Section style={infoBox}>
              <Text style={infoText}>
                ✓ Профилът е активен
              </Text>
              <Text style={infoText}>
                ✓ Можете да видите отворени заявки в избраните региони
              </Text>
              <Text style={infoText}>
                ✓ Можете да приемате работи и да печелите пари
              </Text>
            </Section>

            <Text style={paragraph}>
              Отворете панела си, за да видите всички налични работи в избраните региони.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={dashboardUrl}>
                Отворете панела
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
  color: '#16a34a',
  margin: '16px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4b5563',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  borderLeft: '4px solid #16a34a',
};

const infoText = {
  fontSize: '14px',
  color: '#166534',
  margin: '8px 0',
  lineHeight: '1.6',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#16a34a',
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
