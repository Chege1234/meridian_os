/**
 * CRM Contact Detail Route
 *
 * Thin route page — extracts parameter and renders CRM detail feature component.
 */

import { ContactDetailPage } from '@/features/crm';

export const metadata = {
  title: 'Contact Details | Meridian OS',
};

interface ContactDetailRouteProps {
  params: Promise<{ contactId: string }>;
}

export default async function ContactDetailRoute({
  params,
}: ContactDetailRouteProps) {
  const { contactId } = await params;
  return <ContactDetailPage contactId={contactId} />;
}
