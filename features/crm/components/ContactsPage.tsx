'use client';

/**
 * Feature Component â€” Contacts Page
 *
 * Searchable, filterable list of CRM contacts using TanStack Table + shared UI components.
 * Per BR-800: duplicate contacts are flagged with a visual indicator.
 */

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, AlertTriangle, Eye, Trash2, ShieldAlert } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Input,
  Button,
  Badge,
} from '@/shared/components/ui';
import type { Contact } from '@/domain/entities';
import { detectDuplicates } from '@/domain/rules';
import { getContactsAction, archiveContactAction } from '../actions';
import { NewContactDialog } from './NewContactDialog';

export function ContactsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const { data: contactsRes, isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts', { search, statusFilter }],
    queryFn: () => getContactsAction({
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    staleTime: 300000, // 5 mins (contacts change rarely)
  });

  const contacts = contactsRes?.success ? contactsRes.contacts : [];
  const loading = loadingContacts;

  async function handleArchive(id: string) {
    if (!confirm('Are you sure you want to archive this contact?')) return;
    try {
      const res = await archiveContactAction(id);
      if (res.success) {
        toast.success('Contact archived successfully.');
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      } else {
        toast.error(res.error || 'Failed to archive contact.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    }
  }


  // Check if a contact is a potential duplicate of another contact in the current list
  const isPotentialDuplicate = (contact: Contact) => {
    const others = contacts.filter((c) => c.id !== contact.id);
    const { hasDuplicates } = detectDuplicates(
      {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        organization: contact.organization,
      },
      others,
    );
    return hasDuplicates;
  };

  const columnHelper = createColumnHelper<Contact>();

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => {
        const contact = info.row.original;
        const duplicate = isPotentialDuplicate(contact);
        return (
          <div className="flex items-center gap-2">
            <div className="font-semibold text-foreground">{contact.name}</div>
            {duplicate && (
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-600 bg-yellow-50/50 dark:bg-yellow-950/10 dark:text-yellow-400 gap-1 px-1.5 py-0 text-[10px] uppercase font-semibold">
                <ShieldAlert className="h-3 w-3" /> Duplicate
              </Badge>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('organization', {
      header: 'Organization',
      cell: (info) => info.getValue() || <span className="text-muted-foreground/60">â€”</span>,
    }),
    columnHelper.accessor('email', {
      header: 'Contact Details',
      cell: (info) => {
        const contact = info.row.original;
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            {contact.email && <span className="text-foreground">{contact.email}</span>}
            {contact.phone && <span className="text-muted-foreground">{contact.phone}</span>}
            {!contact.email && !contact.phone && (
              <span className="text-muted-foreground/60">â€”</span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        return (
          <Badge
            variant={status === 'active' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {status}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const contact = info.row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Link href={`/crm/${contact.id}`} passHref>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                <Eye className="h-3.5 w-3.5" /> Details
              </Button>
            </Link>
            {contact.status === 'active' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => handleArchive(contact.id)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Archive
              </Button>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="animate-fade-up space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
            CRM
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-mer-text flex items-center gap-3">
            Contacts
            {!loading && contacts.length > 0 && (
              <span className="text-xs font-normal text-mer-muted bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.08]">
                {contacts.length} {contacts.length === 1 ? 'user' : 'users'}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-mer-muted">Manage your organisations and contact list.</p>
        </div>
        <NewContactDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['contacts'] })} />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mer-muted" />
          <Input
            placeholder="Search contactsâ€¦"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)]"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.6)] p-1">
          {(['active', 'archived', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-150 cursor-pointer ${
                statusFilter === f
                  ? 'bg-[rgba(77,216,255,0.12)] text-mer-cyan border border-[rgba(77,216,255,0.25)]'
                  : 'text-mer-muted hover:text-mer-text'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3 rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] p-6">
          {[1,2,3].map((i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : contacts.length > 0 ? (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] py-16 text-center backdrop-blur-md">
          <AlertTriangle className="h-8 w-8 text-mer-muted/60" />
          <h3 className="mt-4 text-sm font-semibold text-mer-text">No contacts found</h3>
          <p className="mt-1 text-xs text-mer-muted">Try adjusting your search terms or add a new contact.</p>
        </div>
      )}
    </div>
  );
}
