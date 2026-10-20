import Header from '@/components/shared/header';
import ContactClient from './contact-client';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Contact Us',
  description:
    'Questions about an order, sizing, or a design? Get in touch — we are happy to help.',
  path: '/contact',
});

export default function Contact() {
  return (
    <>
      <Header />
      <ContactClient />
    </>
  );
}