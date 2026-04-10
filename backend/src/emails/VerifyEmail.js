import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Tailwind,
} from '@react-email/components';

export function VerifyEmail({ name, url }) {
  return (
    <Html>
      <Head />
      <Preview>Verifica o teu email</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white my-10 mx-auto p-8 rounded-lg shadow-lg max-w-[465px]">
            <Heading className="text-2xl font-bold text-gray-900 text-center">
              Olá, {name}!
            </Heading>
            
            <Text className="text-gray-600 text-base leading-6 mt-4">
              Obrigado por te registares. Clica no botão abaixo para verificar o teu email:
            </Text>

            <Section className="mt-6 text-center">
              <Button
                href={url}
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold text-sm no-underline"
              >
                Verificar Email
              </Button>
            </Section>

            <Text className="text-gray-500 text-sm mt-6 text-center">
              Se o botão não funcionar, copia este link:
            </Text>
            <Text className="text-gray-400 text-xs text-center break-all">
              {url}
            </Text>

            <Section className="mt-8 border-t border-gray-200 pt-6">
              <Text className="text-gray-400 text-xs text-center">
                Se não criaste esta conta, ignora este email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default VerifyEmail;