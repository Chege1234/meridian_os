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
  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<ContactInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateContactSchemaInput>({
    resolver: zodResolver(updateContactSchema),
  });

  async function loadDetail() {
    try {
      const res = await getContactDetailAction(contactId);
      if (res.success && res.contact) {
        setContact(res.contact);
        setInteractions(res.interactions || []);
        reset({
          name: res.contact.name,
          organization: res.contact.organization || '',
          email: res.contact.email || '',
          phone: res.contact.phone || '',
          notes: res.contact.notes || '',
        });
      } else {
        toast.error(res.error || 'Failed to load contact details.');
      }
    } catch {
      toast.error('An error occurred loading contact details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [contactId]);

  async function onSave(data: UpdateContactSchemaInput) {
    try {
      const res = await updateContactAction({ id: contactId, data });
      if (res.success && res.contact) {
        setContact(res.contact);
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
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Back Button */}
      <div>
        <Link href="/crm" passHref>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to CRM
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Panel: Profile Info Card */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-base">
                  {contact.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground line-clamp-1">
                    {contact.name}
                  </CardTitle>
                  {contact.organization && (
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <Building className="h-3 w-3" />
                      {contact.organization}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {!editing ? (
                // View Mode
                <div className="space-y-4 text-sm">
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{contact.phone}</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</span>
                    <p className="text-xs text-foreground/80 leading-relaxed bg-muted/40 p-2.5 rounded border border-border/20 whitespace-pre-wrap min-h-[80px]">
                      {contact.notes || 'No notes added.'}
                    </p>
                  </div>
                  <Button onClick={() => setEditing(true)} size="sm" className="w-full">
                    Edit Profile
                  </Button>
                </div>
              ) : (
                // Edit Form Mode
                <form onSubmit={handleSubmit(onSave)} className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Name</label>
                    <Input {...register('name')} placeholder="Full name" />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Organization</label>
                    <Input {...register('organization')} placeholder="Organization" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Email</label>
                    <Input {...register('email')} type="text" placeholder="Email" />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Phone</label>
                    <Input {...register('phone')} placeholder="Phone" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Notes</label>
                    <textarea
                      {...register('notes')}
                      placeholder="Notes..."
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="flex-1" disabled={!isDirty}>
                      Save
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Tabs for Timeline & Tasks */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="p-5">
              <Tabs defaultValue="timeline">
                <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-sm font-semibold border-none px-3 py-1 cursor-pointer">
                      Activities & Timeline
                    </Badge>
                  </div>
                  <LogInteractionDialog contactId={contact.id} onSuccess={loadDetail} />
                </div>

                {/* Timeline content */}
                <div className="space-y-4">
                  {interactions.length > 0 ? (
                    <div className="relative pl-6 border-l border-border/60 space-y-6">
                      {interactions.map((interaction) => (
                        <div key={interaction.id} className="relative">
                          {/* Timeline Dot Icon */}
                          <span className="absolute -left-[35px] top-1 flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-background shadow-sm">
                            {getInteractionIcon(interaction.type)}
                          </span>

                          {/* Interaction Info */}
                          <div className="space-y-1 bg-muted/20 border border-border/40 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold capitalize text-foreground">
                                {interaction.type} logged
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(interaction.occurredAt)}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                              {interaction.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                      <h4 className="mt-3 text-xs font-semibold text-foreground">No interactions logged</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Use Log Activity to append logs.</p>
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Associated Tasks Board panel */}
          <Card className="border border-border/80 shadow-sm bg-card p-5">
            <TaskBoard contactId={contact.id} contactName={contact.name} />
          </Card>
        </div>
      </div>
    </div>
  );
}
