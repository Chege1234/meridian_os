/**
 * CRM List Page Route
 *
 * Thin route page — renders the CRM list page feature component.
 */

import { ContactsPage } from '@/features/crm';

export const metadata = {
  title: 'CRM Contacts | Meridian OS',
};

export default function CrmRoute() {
  return <ContactsPage />;
}
