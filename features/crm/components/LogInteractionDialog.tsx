'use client';

/**
 * Feature Component — Log Interaction Dialog
 *
 * Modal form for logging a new interaction (call, meeting, email, note).
 * Per BR-801: append-only and immutable.
 */

import { useState } from 'react';
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
} from '@/shared/components/ui';
import { logInteractionSchema, type LogInteractionSchemaInput } from '../schemas';
import { logInteractionAction } from '../actions';

interface LogInteractionDialogProps {
  contactId: string;
  onSuccess: () => void;
}

export function LogInteractionDialog({ contactId, onSuccess }: LogInteractionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LogInteractionSchemaInput>({
    resolver: zodResolver(logInteractionSchema),
    defaultValues: {
      contactId,
      type: 'note',
      content: '',
    },
  });

  async function onSubmit(data: LogInteractionSchemaInput) {
    setLoading(true);
    try {
      const res = await logInteractionAction(data);
      if (res.success) {
        toast.success('Interaction logged successfully.');
        reset();
        setOpen(false);
        onSuccess();
      } else {
        toast.error(res.error || 'Failed to log interaction.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" /> Log Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Interaction Type */}
          <div className="space-y-1.5">
            <label htmlFor="type" className="text-sm font-medium text-foreground">
              Activity Type
            </label>
            <select
              id="type"
              {...register('type')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="note">Note</option>
            </select>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label htmlFor="content" className="text-sm font-medium text-foreground">
              Details *
            </label>
            <textarea
              id="content"
              placeholder="Discussed pricing plan options..."
              rows={4}
              {...register('content')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              aria-invalid={!!errors.content}
            />
            {errors.content && (
              <p className="text-xs text-red-500 font-medium">
                {errors.content.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Logging...' : 'Log Activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
