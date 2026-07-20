'use client';

/**
 * Feature Component â€” Campaigns Page
 *
 * Searchable, filterable list of campaigns using TanStack Table + card grid view.
 */

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Grid,
  List,
  Eye,
  Trash2,
  Calendar,
  DollarSign,
  User as UserIcon,
} from 'lucide-react';
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
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/shared/components/ui';
import type { Campaign, User } from '@/domain/entities';
import { getCampaignsAction, archiveCampaignAction } from '../actions';
import { getActiveUsersAction } from '@/features/tasks/actions';
import { NewCampaignDialog } from './NewCampaignDialog';

export function CampaignsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');

  const { data: campaignsRes, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['campaigns', { search, statusFilter, channelFilter, ownerFilter }],
    queryFn: () => getCampaignsAction({
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      channel: channelFilter === 'all' ? undefined : channelFilter,
      ownerId: ownerFilter === 'all' ? undefined : ownerFilter,
    }),
    staleTime: 120000, // 2 mins
  });

  const { data: usersRes } = useQuery({
    queryKey: ['activeUsers'],
    queryFn: () => getActiveUsersAction(),
    staleTime: 300000, // 5 mins
  });

  const campaigns = campaignsRes?.success ? campaignsRes.campaigns : [];
  const users = usersRes?.success && usersRes.users ? usersRes.users : [];
  const loading = loadingCampaigns;

  async function handleArchive(id: string) {
    if (!confirm('Are you sure you want to archive this campaign?')) return;
    try {
      const res = await archiveCampaignAction(id);
      if (res.success) {
        toast.success('Campaign archived successfully.');
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      } else {
        toast.error(res.error || 'Failed to archive campaign.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    }
  }

  const getOwnerName = (ownerId: string) => {
    const user = users.find((u) => u.id === ownerId);
    return user ? user.fullName : 'Unknown';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'paused':
        return 'outline';
      case 'completed':
        return 'default';
      case 'archived':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatBudget = (budget: number | null) => {
    if (budget === null) return 'No budget';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // TanStack Table setup
  const columnHelper = createColumnHelper<Campaign>();
  const columns = [
    columnHelper.accessor('name', {
      header: 'Campaign Name',
      cell: (info) => (
        <span className="font-bold text-foreground truncate block max-w-xs">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <Badge variant={getStatusBadgeVariant(info.getValue())} className="capitalize text-[10px] px-2 py-0.5">
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('channel', {
      header: 'Channels',
      cell: (info) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {info.getValue().map((ch) => (
            <Badge key={ch} variant="outline" className="text-[9px] capitalize px-1 py-0 border-border/80 bg-muted/20">
              {ch}
            </Badge>
          ))}
        </div>
      ),
    }),
    columnHelper.accessor('budget', {
      header: 'Budget',
      cell: (info) => <span className="font-medium text-foreground">{formatBudget(info.getValue())}</span>,
    }),
    columnHelper.accessor('ownerId', {
      header: 'Owner',
      cell: (info) => <span className="text-foreground">{getOwnerName(info.getValue())}</span>,
    }),
    columnHelper.accessor('startDate', {
      header: 'Start Date',
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const campaign = info.row.original;
        return (
          <div className="flex items-center gap-1">
            <Link href={`/campaigns/${campaign.id}`} passHref>
              <Button size="sm" variant="ghost" className="h-8 px-2 gap-1 text-xs">
                <Eye className="h-4 w-4" />
                View
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50/10 dark:hover:bg-red-950/10"
              onClick={() => handleArchive(campaign.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: campaigns,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="animate-fade-up space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">Meridian OS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-mer-text">Campaign Centre</h1>
          <p className="mt-1 text-sm text-mer-muted">Plan, monitor and coordinate your multi-channel campaigns.</p>
        </div>
        <NewCampaignDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['campaigns'] })} />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mer-muted" />
            <Input
              type="text"
              placeholder="Search campaignsâ€¦"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)]"
            />
          </div>

          {[{
            value: statusFilter,
            onChange: setStatusFilter,
            options: [['all','All Statuses'],['draft','Draft'],['active','Active'],['paused','Paused'],['completed','Completed'],['archived','Archived']],
          },{
            value: channelFilter,
            onChange: setChannelFilter,
            options: [['all','All Channels'],['instagram','Instagram'],['tiktok','TikTok'],['email','Email'],['whatsapp','WhatsApp'],['twitter','Twitter/X'],['linkedin','LinkedIn'],['blog','Blog']],
          },{
            value: ownerFilter,
            onChange: setOwnerFilter,
            options: [['all','All Owners'], ...users.map((u) => [u.id, u.fullName])],
          }].map((sel, i) => (
            <select
              key={i}
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="h-9 rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.7)] px-3 text-xs text-mer-text outline-none focus:border-[var(--mer-border-hover)]"
            >
              {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.6)] p-1">
          {([['grid', Grid],['table', List]] as const).map(([vt, Icon]) => (
            <button
              key={vt}
              onClick={() => setViewType(vt)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
                viewType === vt
                  ? 'bg-[rgba(77,216,255,0.12)] text-mer-cyan border border-[rgba(77,216,255,0.25)]'
                  : 'text-mer-muted hover:text-mer-text'
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Main list area */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-[16px] border border-[var(--mer-border-glow)] bg-white/[0.02]" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] py-16 text-center backdrop-blur-md">
          <Calendar className="h-8 w-8 text-mer-muted/60" />
          <h3 className="mt-3 text-sm font-semibold text-mer-text">No campaigns found</h3>
          <p className="text-xs text-mer-muted mt-0.5">Try refining your filter criteria.</p>
        </div>
      ) : viewType === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md transition-all duration-200 hover:border-[var(--mer-border-hover)] hover:shadow-[0_0_20px_var(--mer-glow-cyan)]"
            >
              <div className="flex flex-1 flex-col p-5">
                {/* Header */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold leading-snug text-mer-text line-clamp-1">{camp.name}</h3>
                  <Badge
                    variant={
                      camp.status === 'active' ? 'green' :
                      camp.status === 'completed' ? 'cyan' :
                      camp.status === 'paused' ? 'amber' :
                      camp.status === 'archived' ? 'red' : 'muted'
                    }
                    className="capitalize text-[10px] shrink-0"
                  >
                    {camp.status}
                  </Badge>
                </div>
                <p className="mb-3 text-xs text-mer-muted line-clamp-2 leading-relaxed">{camp.objective}</p>

                {/* Channel badges */}
                <div className="flex flex-wrap gap-1">
                  {camp.channel.map((ch) => (
                    <Badge key={ch} variant="muted" className="text-[9px] capitalize">{ch}</Badge>
                  ))}
                </div>

                {/* Meta */}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--mer-border-glow)] pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-mer-muted">
                    <DollarSign className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-mer-text font-medium truncate">{formatBudget(camp.budget)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-mer-muted">
                    <UserIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-mer-text truncate">{getOwnerName(camp.ownerId)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[var(--mer-border-glow)] px-4 py-2.5">
                <span className="text-[11px] text-mer-muted">{formatDate(camp.startDate)}</span>
                <div className="flex items-center gap-1">
                  <Link href={`/campaigns/${camp.id}`} passHref>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px] text-mer-muted hover:text-mer-cyan">
                      <Eye className="h-3 w-3" /> View
                    </Button>
                  </Link>
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-mer-muted hover:text-mer-red"
                    onClick={() => handleArchive(camp.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
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
      )}
    </div>
  );
}

      {/* Page Header */}
