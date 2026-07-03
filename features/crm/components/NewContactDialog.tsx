'use client';

/**
 * Feature Component — New Contact Dialog
 *
 * Renders a dialog form using react-hook-form + zod resolver.
 * Validates fields on client and handles submission via createContactAction.
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
  Input,
} from '@/shared/components/ui';
import { createContactSchema, type CreateContactSchemaInput } from '../schemas';
import { createContactAction } from '../actions';

interface NewContactDialogProps {
  onSuccess: () => void;
}

export function NewContactDialog({ onSuccess }: NewContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateContactSchemaInput>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      name: '',
      organization: '',
      email: '',
      phone: '',
      notes: '',
    },
  });

  async function onSubmit(data: CreateContactSchemaInput) {
    setLoading(true);
    try {
      const res = await createContactAction(data);
      if (res.success) {
        toast.success(
          res.duplicateWarning
            ? 'Contact created with duplicate warnings.'
            : 'Contact created successfully.',
        );
        reset();
        setOpen(false);
        onSuccess();
      } else {
        toast.error(res.error || 'Failed to create contact.');
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
        <Button className="gap-1 shadow-sm">
          <Plus className="h-4 w-4" /> Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Full Name *
            </label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Organization */}
          <div className="space-y-1.5">
            <label htmlFor="organization" className="text-sm font-medium text-foreground">
              Organization
            </label>
            <Input
              id="organization"
              placeholder="ACME Corp"
              {...register('organization')}
              aria-invalid={!!errors.organization}
            />
            {errors.organization && (
              <p className="text-xs text-red-500 font-medium">
                {errors.organization.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="text"
              placeholder="john@example.com"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone
            </label>
            <Input
              id="phone"
              placeholder="+1 (555) 019-2834"
              {...register('phone')}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 font-medium">{errors.phone.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="notes" className="text-sm font-medium text-foreground">
              Notes
            </label>
            <textarea
              id="notes"
              placeholder="Key details..."
              rows={3}
              {...register('notes')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
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
              {loading ? 'Creating...' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
