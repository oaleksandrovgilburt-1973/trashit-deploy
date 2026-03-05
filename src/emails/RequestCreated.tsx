import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';

interface RequestCreatedProps {
  customerName: string;
  requestDescription: string;
  requestAddress: string;
  region: string;
  price: string;
  requestUrl: string;
}

export default function RequestCreated({
  customerName,
  requestDescription,
  requestAddress,
  region,
  price,
  requestUrl,
}: RequestCreatedProps) {
  return (
    <Html>
      <Head />
      <Preview>Вашата заявка е създадена успешно</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Заявката е създадена</Text>
            <Text style={paragraph}>
              Здравей {customerName},
            </Text>
            <Text style={paragraph}>
              Вашата заявка за отвоз на боклук е създадена успешно. Очаквайте доставчици да я видят и да я приемат.
            </Text>

            <Section style={detailsBox}>
              <Row>
                <Text style={label}>Описание:</Text>
                <Text style={value}>{requestDescription}</Text>
              </Row>
              <Row>
                <Text style={label}>Адрес:</Text>
                <Text style={value}>{requestAddress}</Text>
              </Row>
              <Row>
                <Text style={label}>Регион:</Text>
                <Text style={value}>{region}</Text>
              </Row>
              <Row>
                <Text style={label}>Предложена цена:</Text>
                <Text style={value}>{price} лв.</Text>
              </Row>
            </Section>

            <Section style={buttonSection}>
              <Button style={button} href={requestUrl}>
                Преглед на заявката
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
  color: '#1f2937',
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
