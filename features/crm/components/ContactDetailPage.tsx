'use client';

/**
 * Feature Component — Contact Detail Page
 *
 * Contact details view showing:
 * - Profile details (editable form using react-hook-form)
 * - Chronological append-only interaction log history (BR-801)
 * - Associated tasks Kanban board panel (BR-803)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Phone,
  Mail,
  Users as GroupIcon,
  FileText,
  Calendar,
  Building,
  User as UserIcon,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  Badge,
} from '@/shared/components/ui';
import type { Contact, ContactInteraction, Task } from '@/domain/entities';
import { TaskBoard } from '@/features/tasks';
import { updateContactSchema, type UpdateContactSchemaInput } from '../schemas';
import { getContactDetailAction, updateContactAction } from '../actions';
import { LogInteractionDialog } from './LogInteractionDialog';

interface ContactDetailPageProps {
  contactId: string;
}

export function ContactDetailPage({ contactId }: ContactDetailPageProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateContactSchemaInput>({
    resolver: zodResolver(updateContactSchema),
  });

  const { data: detailRes, isLoading: loadingContact } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => getContactDetailAction(contactId),
    staleTime: 300000, // 5 mins (contacts change rarely)
  });

  const contact = detailRes?.success ? detailRes.contact : null;
  const interactions = detailRes?.success ? detailRes.interactions || [] : [];
  const loading = loadingContact;

  function loadDetail() {
    queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
  }

  useEffect(() => {
    if (detailRes?.success && detailRes.contact) {
      reset({
        name: detailRes.contact.name,
        organization: detailRes.contact.organization || '',
        email: detailRes.contact.email || '',
        phone: detailRes.contact.phone || '',
        notes: detailRes.contact.notes || '',
      });
    }
  }, [detailRes, reset]);


  async function onSave(data: UpdateContactSchemaInput) {
    try {
      const res = await updateContactAction({ id: contactId, data });
      if (res.success) {
        setEditing(false);
        toast.success('Contact details updated.');
        loadDetail();
      } else {
        toast.error(res.error || 'Failed to update contact.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    }
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4 text-blue-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'meeting':
        return <GroupIcon className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-4">
        <div className="h-8 w-32 animate-pulse bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 h-80 animate-pulse bg-muted rounded-lg" />
          <div className="md:col-span-2 h-80 animate-pulse bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-foreground">Contact not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The contact may have been archived.</p>
        <Link href="/crm" className="mt-4 inline-flex">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Contacts
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/crm" passHref>
          <Button variant="outline" size="sm" className="gap-1.5 border-[var(--mer-border-glow)] text-mer-muted hover:text-mer-text">
            <ArrowLeft className="h-4 w-4" /> Back to CRM
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
        {/* Left Panel: Profile Info Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md overflow-hidden">
            <div className="border-b border-[var(--mer-border-glow)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[rgba(77,216,255,0.12)] border border-[rgba(77,216,255,0.25)] flex items-center justify-center text-mer-cyan font-bold text-sm shadow-[0_0_8px_rgba(77,216,255,0.15)]">
                  {contact.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold tracking-tight text-mer-text truncate">
                    {contact.name}
                  </h2>
                  {contact.organization && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-mer-muted">
                      <Building className="h-3.5 w-3.5" />
                      <span className="truncate">{contact.organization}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-5">
              {!editing ? (
                // View Mode
                <div className="space-y-4 text-xs">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-mer-text">
                      <Mail className="h-4 w-4 text-mer-cyan shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-mer-text">
                      <Phone className="h-4 w-4 text-mer-cyan shrink-0" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">Notes</span>
                    <p className="text-xs text-mer-text/80 leading-relaxed bg-[rgba(7,12,22,0.4)] p-3 rounded-xl border border-[var(--mer-border-glow)] whitespace-pre-wrap min-h-[90px]">
                      {contact.notes || 'No notes added.'}
                    </p>
                  </div>
                  <Button onClick={() => setEditing(true)} size="sm" className="w-full">
                    Edit Profile
                  </Button>
                </div>
              ) : (
                // Edit Form Mode
                <form onSubmit={handleSubmit(onSave)} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">Name</label>
                    <Input
                      {...register('name')}
                      placeholder="Full name"
                      className="bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)]"
                    />
                    {errors.name && <p className="text-xs text-mer-red mt-0.5">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">Organization</label>
                    <Input
                      {...register('organization')}
                      placeholder="Organization"
                      className="bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">Email</label>
                    <Input
                      {...register('email')}
                      type="text"
                      placeholder="Email"
                      className="bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)]"
                    />
                    {errors.email && <p className="text-xs text-mer-red mt-0.5">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">Phone</label>
                    <Input
                      {...register('phone')}
                      placeholder="Phone"
                      className="bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">Notes</label>
                    <textarea
                      {...register('notes')}
                      placeholder="Notes..."
                      rows={3}
                      className="flex w-full rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.6)] px-3 py-2 text-xs text-mer-text placeholder:text-mer-muted outline-none focus:border-[var(--mer-border-hover)] resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={!isDirty}>
                      Save
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Tabs for Timeline & Tasks */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md p-5">
            <div className="flex items-center justify-between border-b border-[var(--mer-border-glow)] pb-3 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-mer-muted flex items-center gap-1.5">
                Activities & Timeline
              </span>
              <LogInteractionDialog contactId={contact.id} onSuccess={loadDetail} />
            </div>

            {/* Timeline content */}
            <div className="space-y-4">
              {interactions.length > 0 ? (
                <div className="relative pl-6 border-l border-[var(--mer-border-glow)] space-y-6">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="relative">
                      {/* Timeline Dot Icon */}
                      <span className="absolute -left-[37px] top-1 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--mer-border-glow)] bg-[var(--mer-bg-base)] shadow-sm text-mer-text">
                        {getInteractionIcon(interaction.type)}
                      </span>

                      {/* Interaction Info */}
                      <div className="space-y-1 bg-[rgba(13,20,35,0.7)] border border-[var(--mer-border-glow)] p-3.5 rounded-xl hover:border-[var(--mer-border-hover)] transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold capitalize text-mer-text">
                            {interaction.type} logged
                          </span>
                          <span className="text-[10px] text-mer-muted flex items-center gap-1 font-mono">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(interaction.occurredAt)}
                          </span>
                        </div>
                        <p className="text-xs text-mer-text/80 leading-relaxed whitespace-pre-wrap">
                          {interaction.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-8 w-8 text-mer-muted/40" />
                  <h4 className="mt-3 text-xs font-semibold text-mer-text">No interactions logged</h4>
                  <p className="text-[11px] text-mer-muted mt-0.5">Use Log Activity to append logs.</p>
                </div>
              )}
            </div>
          </div>

          {/* Associated Tasks Board panel */}
          <div className="rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md p-5">
            <TaskBoard contactId={contact.id} contactName={contact.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
