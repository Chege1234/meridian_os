'use client';

/**
 * Feature Component — New Campaign Dialog
 *
 * Renders a dialog form using react-hook-form + zod resolver.
 * Validates fields on client and handles submission via createCampaignAction.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Input,
} from '@/shared/components/ui';
import { createCampaignSchema, type CreateCampaignSchemaInput } from '../schemas';
import { createCampaignAction } from '../actions';
import { getActiveUsersAction } from '@/features/tasks/actions';
import type { User } from '@/domain/entities';

interface NewCampaignDialogProps {
  onSuccess: () => void;
}

const CHANNELS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'email', label: 'Email' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'blog', label: 'Blog' },
];

export function NewCampaignDialog({ onSuccess }: NewCampaignDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCampaignSchemaInput>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      objective: '',
      channel: [],
      startDate: new Date(),
      endDate: null,
      budget: null,
      ownerId: '',
    },
  });

  const selectedChannels = watch('channel') || [];

  useEffect(() => {
    async function loadUsers() {
      const res = await getActiveUsersAction();
      if (res.success && res.users) {
        setUsers(res.users);
        if (res.users.length > 0 && res.users[0]) {
          setValue('ownerId', res.users[0].id);
        }
      }
    }
    if (open) {
      loadUsers();
    }
  }, [open, setValue]);

  const handleChannelToggle = (channelId: string) => {
    if (selectedChannels.includes(channelId)) {
      setValue(
        'channel',
        selectedChannels.filter((c) => c !== channelId),
        { shouldValidate: true },
      );
    } else {
      setValue('channel', [...selectedChannels, channelId], { shouldValidate: true });
    }
  };

  async function onSubmit(data: CreateCampaignSchemaInput) {
    setLoading(true);
    try {
      const res = await createCampaignAction(data);
      if (res.success) {
        toast.success('Campaign created successfully.');
        reset();
        setOpen(false);
        onSuccess();
      } else {
        toast.error(res.error || 'Failed to create campaign.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-1 shadow-sm">
            <Plus className="h-4 w-4" /> Add Campaign
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Campaign Name *
            </label>
            <Input
              id="name"
              placeholder="e.g. Summer Camp Promo 2026"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Objective */}
          <div className="space-y-1.5">
            <label htmlFor="objective" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Objective *
            </label>
            <textarea
              id="objective"
              placeholder="Describe the objective of this campaign..."
              rows={3}
              {...register('objective')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              aria-invalid={!!errors.objective}
            />
            {errors.objective && (
              <p className="text-xs text-red-500 font-medium">{errors.objective.message}</p>
            )}
          </div>

          {/* Channels Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Channels *
            </label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => {
                const active = selectedChannels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleChannelToggle(ch.id)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer font-medium ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background text-muted-foreground border-border/80 hover:bg-muted/55 hover:text-foreground'
                    }`}
                  >
                    {ch.label}
                  </button>
                );
              })}
            </div>
            {errors.channel && (
              <p className="text-xs text-red-500 font-medium">{errors.channel.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="startDate" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Start Date *
              </label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                aria-invalid={!!errors.startDate}
              />
              {errors.startDate && (
                <p className="text-xs text-red-500 font-medium">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="endDate" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                End Date
              </label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
              />
            </div>
          </div>

          {/* Budget & Owner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="budget" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Budget ($)
              </label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                placeholder="Optional"
                {...register('budget', { valueAsNumber: true })}
                aria-invalid={!!errors.budget}
              />
              {errors.budget && (
                <p className="text-xs text-red-500 font-medium">{errors.budget.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ownerId" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Owner *
              </label>
              <select
                id="ownerId"
                {...register('ownerId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
              {errors.ownerId && (
                <p className="text-xs text-red-500 font-medium">{errors.ownerId.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
