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

interface JobCompletedProps {
  customerName: string;
  providerName: string;
  requestDescription: string;
  completionNotes?: string;
  reviewUrl: string;
}

export default function JobCompleted({
  customerName,
  providerName,
  requestDescription,
  completionNotes,
  reviewUrl,
}: JobCompletedProps) {
  return (
    <Html>
      <Head />
      <Preview>Работата е завършена</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Работата е завършена!</Text>
            <Text style={paragraph}>
              Здравей {customerName},
            </Text>
            <Text style={paragraph}>
              {providerName} е завършил работата по вашата заявка за отвоз на боклук.
            </Text>

            {completionNotes && (
              <Section style={notesBox}>
                <Text style={label}>Бележки на доставчика:</Text>
                <Text style={value}>{completionNotes}</Text>
              </Section>
            )}

            <Text style={paragraph}>
              Можете да потвърдите завършването и да оцените доставчика.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={reviewUrl}>
                Потвърди и оцени
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

const notesBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  borderLeft: '4px solid #16a34a',
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
