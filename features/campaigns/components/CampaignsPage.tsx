'use client';

/**
 * Feature Component — Campaigns Page
 *
 * Searchable, filterable list of campaigns using TanStack Table + card grid view.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getCampaignsAction({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        channel: channelFilter === 'all' ? undefined : channelFilter,
        ownerId: ownerFilter === 'all' ? undefined : ownerFilter,
      });

      const usersRes = await getActiveUsersAction();

      if (res.success) {
        setCampaigns(res.campaigns);
      } else {
        toast.error(res.error || 'Failed to load campaigns.');
      }

      if (usersRes.success && usersRes.users) {
        setUsers(usersRes.users);
      }
    } catch {
      toast.error('An error occurred loading campaigns data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [search, statusFilter, channelFilter, ownerFilter]);

  async function handleArchive(id: string) {
    if (!confirm('Are you sure you want to archive this campaign?')) return;
    try {
      const res = await archiveCampaignAction(id);
      if (res.success) {
        toast.success('Campaign archived successfully.');
        loadData();
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
        return 'default'; // In standard, we can style it separately
      default:
        return 'secondary';
    }
  };

  const formatBudget = (val: number | null) => {
    if (val === null || val === undefined) return 'No budget set';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Table Setup
  const columnHelper = createColumnHelper<Campaign>();
  const columns = [
    columnHelper.accessor('name', {
      header: 'Campaign Name',
      cell: (info) => (
        <div className="font-semibold text-foreground">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const s = info.getValue();
        return (
          <Badge variant={getStatusBadgeVariant(s)} className="capitalize">
            {s}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('channel', {
      header: 'Channels',
      cell: (info) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {info.getValue().map((ch) => (
            <Badge key={ch} variant="outline" className="text-[10px] capitalize px-1 py-0 border-border/80">
              {ch}
            </Badge>
          ))}
        </div>
      ),
    }),
    columnHelper.accessor('budget', {
      header: 'Budget',
      cell: (info) => <span>{formatBudget(info.getValue())}</span>,
    }),
    columnHelper.accessor('startDate', {
      header: 'Timeline',
      cell: (info) => {
        const row = info.row.original;
        return (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.startDate)} — {row.endDate ? formatDate(row.endDate) : 'Ongoing'}
          </span>
        );
      },
    }),
    columnHelper.accessor('ownerId', {
      header: 'Owner',
      cell: (info) => <span className="text-xs">{getOwnerName(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const campaign = info.row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Link href={`/campaigns/${campaign.id}`} passHref>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/80">
                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Campaign Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Plan, monitor, and coordinate your multi-channel marketing campaigns.
          </p>
        </div>
        <NewCampaignDialog onSuccess={loadData} />
      </div>

      {/* Filters & Actions Panel */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-card p-3 rounded-lg border border-border/60 shadow-sm">
        <div className="flex flex-wrap gap-2.5 items-center flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
            <Input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Channels</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="twitter">Twitter/X</option>
            <option value="linkedin">LinkedIn</option>
            <option value="blog">Blog</option>
          </select>

          {/* Owner Filter */}
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Owners</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex border border-border/80 rounded-md p-0.5 bg-muted/40">
          <Button
            size="sm"
            variant={viewType === 'grid' ? 'default' : 'ghost'}
            className="h-8 px-2.5 py-1.5 cursor-pointer text-xs"
            onClick={() => setViewType('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewType === 'table' ? 'default' : 'ghost'}
            className="h-8 px-2.5 py-1.5 cursor-pointer text-xs"
            onClick={() => setViewType('table')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main List Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-52 bg-muted/50 border-none" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed rounded-lg">
          <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <h3 className="mt-3 text-sm font-semibold text-foreground">No campaigns found</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Try refining your filter criteria.</p>
        </div>
      ) : viewType === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map((camp) => (
            <Card key={camp.id} className="border border-border/80 hover:border-primary/40 shadow-sm bg-card hover:shadow transition-all relative overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-bold tracking-tight text-foreground line-clamp-1">
                      {camp.name}
                    </CardTitle>
                    <Badge variant={getStatusBadgeVariant(camp.status)} className="capitalize text-[10px] px-2 py-0">
                      {camp.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {camp.objective}
                  </p>
                </CardHeader>

                <CardContent className="p-4 pt-2 pb-2 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {camp.channel.map((ch) => (
                      <Badge key={ch} variant="outline" className="text-[10px] capitalize px-1.5 py-0 border-border/80 bg-muted/30">
                        {ch}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-foreground font-medium truncate">{formatBudget(camp.budget)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <UserIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-foreground truncate">{getOwnerName(camp.ownerId)}</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-2 border-t border-border/30 bg-muted/5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Start: {formatDate(camp.startDate)}</span>
                <div className="flex items-center gap-1">
                  <Link href={`/campaigns/${camp.id}`} passHref>
                    <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-[11px]">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50/10 dark:hover:bg-red-950/10"
                    onClick={() => handleArchive(camp.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground p-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/10 border-b border-border/40">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
