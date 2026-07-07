'use client';

/**
 * Feature Component — Contacts Page
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
      cell: (info) => info.getValue() || <span className="text-muted-foreground/60">—</span>,
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
              <span className="text-muted-foreground/60">—</span>
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
    <div className="space-y-6 animate-fade-in">
      {/* Title + Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Contacts (CRM)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organizations and contact list.
          </p>
        </div>
        <NewContactDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['contacts'] })} />
      </div>

      {/* Controls: Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-lg border border-border/80">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['active', 'archived', 'all'] as const).map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? 'default' : 'outline'}
              size="sm"
              className="capitalize text-xs font-medium"
              onClick={() => setStatusFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Table grid */}
      <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            <div className="h-6 w-full animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : contacts.length > 0 ? (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent">
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} className="text-xs uppercase font-semibold text-muted-foreground px-4 py-3">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3.5 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/60" />
            <h3 className="mt-4 text-sm font-semibold text-foreground">No contacts found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search terms or add a new contact.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
