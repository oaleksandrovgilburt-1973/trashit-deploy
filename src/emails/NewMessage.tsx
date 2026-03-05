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

interface NewMessageProps {
  recipientName: string;
  senderName: string;
  messagePreview: string;
  chatUrl: string;
}

export default function NewMessage({
  recipientName,
  senderName,
  messagePreview,
  chatUrl,
}: NewMessageProps) {
  return (
    <Html>
      <Head />
      <Preview>Ново съобщение от {senderName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Ново съобщение</Text>
            <Text style={paragraph}>
              Здравей {recipientName},
            </Text>
            <Text style={paragraph}>
              {senderName} ви е изпратил ново съобщение:
            </Text>

            <Section style={messageBox}>
              <Text style={messageText}>"{messagePreview}"</Text>
            </Section>

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
  color: '#2563eb',
  margin: '16px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4b5563',
  margin: '16px 0',
};

const messageBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  borderLeft: '4px solid #2563eb',
};

const messageText = {
  fontSize: '14px',
  color: '#1f2937',
  fontStyle: 'italic',
  margin: '0',
  lineHeight: '1.6',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
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
