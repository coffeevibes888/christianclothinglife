import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

type ResetPasswordProps = {
  email: string;
  resetLink: string;
};

export default function ResetPassword({ email, resetLink }: ResetPasswordProps) {
  return (
    <Html>
      <Preview>Reset your password</Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-slate-950 text-slate-50 m-0 py-10'>
          <Container className='max-w-xl mx-auto px-4'>
            <Section className='text-center mb-6'>
              <Img
                src='https://rockenmyvibe.com/images/logo.png'
                alt='Rocken My Vibe'
                width='160'
                className='mx-auto mb-3'
              />
              <Text className='text-xs uppercase tracking-[0.2em] text-slate-400'>
                Account Security
              </Text>
            </Section>

            <Section className='bg-slate-900 border border-slate-800 rounded-2xl px-6 py-8 shadow-md'>
              <Heading className='text-2xl font-semibold mb-2 text-slate-50'>
                Reset your password
              </Heading>
              <Text className='text-sm leading-relaxed text-slate-300 mb-4'>
                Hey {email},
              </Text>
              <Text className='text-sm leading-relaxed text-slate-300 mb-6'>
                We received a request to reset your Rocken My Vibe password. Tap the button below to securely choose a new one.
              </Text>

              <Section className='text-center mb-6'>
                <Button
                  href={resetLink}
                  className='inline-block rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-sky-500 px-10 py-3 text-sm font-semibold text-white shadow-lg'
                >
                  Reset password
                </Button>
              </Section>

              <Section className='border-t border-slate-800 pt-5 mt-4'>
                <Text className='text-xs text-slate-400 mb-2'>
                  Or copy and paste this link into your browser:
                </Text>
                <Text className='text-xs text-sky-400 break-all'>{resetLink}</Text>
              </Section>

              <Section className='border-t border-slate-800 pt-5 mt-5'>
                <Text className='text-[11px] leading-relaxed text-slate-400 mb-2'>
                  This link will expire in 1 hour for your security.
                </Text>
                <Text className='text-[11px] leading-relaxed text-slate-500'>
                  If you didn't request a password reset, you can safely ignore this email and your password will stay the same.
                </Text>
              </Section>
            </Section>

            <Section className='mt-6 text-center'>
              <Text className='text-[10px] tracking-[0.18em] uppercase text-slate-500 mb-1'>
                Rocken My Vibe
              </Text>
              <Text className='text-[10px] text-slate-600'>
                Feel the energy. Protect your account.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
