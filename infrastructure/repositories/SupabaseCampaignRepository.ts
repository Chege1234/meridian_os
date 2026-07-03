/**
 * Infrastructure — Supabase Campaign Repository
 *
 * Implements CampaignRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Campaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignContactRole,
  CampaignMetric,
  CampaignMetricName,
  CampaignMetricSource,
  ContentItem,
  Contact,
} from '@/domain/entities';
import type { CampaignRepository } from '@/domain/repositories';

export function createSupabaseCampaignRepository(
  supabase: SupabaseClient,
): CampaignRepository {
  return {
    async findById(id: string): Promise<Campaign | null> {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      return data ? mapToCampaign(data) : null;
    },

    async findAll(options?: {
      search?: string;
      status?: string;
      ownerId?: string;
      channel?: string;
      includeDeleted?: boolean;
    }): Promise<Campaign[]> {
      let query = supabase.from('campaigns').select('*');

      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.ownerId) {
        query = query.eq('owner_id', options.ownerId);
      }

      if (options?.channel) {
        // Query jsonb array containing specific channel
        query = query.contains('channel', [options.channel]);
      }

      if (options?.search) {
        const s = `%${options.search}%`;
        query = query.or(`name.ilike.${s},objective.ilike.${s}`);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToCampaign);
    },

    async create(data: CreateCampaignInput): Promise<Campaign> {
      const { data: row, error } = await supabase
        .from('campaigns')
        .insert({
          name: data.name,
          objective: data.objective,
          status: 'draft',
          channel: data.channel,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate ? data.endDate.toISOString() : null,
          budget: data.budget ?? null,
          owner_id: data.ownerId,
          created_by: data.createdBy,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create campaign: ${error?.message}`);
      }

      return mapToCampaign(row);
    },

    async update(id: string, data: Partial<UpdateCampaignInput>): Promise<Campaign | null> {
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) dbData.name = data.name;
      if (data.objective !== undefined) dbData.objective = data.objective;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.channel !== undefined) dbData.channel = data.channel;
      if (data.startDate !== undefined) dbData.start_date = data.startDate.toISOString();
      if (data.endDate !== undefined) dbData.end_date = data.endDate ? data.endDate.toISOString() : null;
      if (data.budget !== undefined) dbData.budget = data.budget;
      if (data.ownerId !== undefined) dbData.owner_id = data.ownerId;

      const { data: row } = await supabase
        .from('campaigns')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return row ? mapToCampaign(row) : null;
    },

    async softDelete(id: string, deletedBy: string): Promise<void> {
      await supabase
        .from('campaigns')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
          status: 'archived',
        })
        .eq('id', id);
    },

    // Join: Content
    async attachContent(campaignId: string, contentItemId: string, position = 0): Promise<void> {
      // Per Section 3 list filtering: set campaign_id on contentItem as primary campaign reference
      await supabase
        .from('content_items')
        .update({ campaign_id: campaignId })
        .eq('id', contentItemId);

      const { error } = await supabase
        .from('campaign_content')
        .upsert({
          campaign_id: campaignId,
          content_item_id: contentItemId,
          position,
        });

      if (error) {
        throw new Error(`Failed to attach content: ${error.message}`);
      }
    },

    async detachContent(campaignId: string, contentItemId: string): Promise<void> {
      // Nullify the primary reference if it matches this campaign
      await supabase
        .from('content_items')
        .update({ campaign_id: null })
        .eq('id', contentItemId)
        .eq('campaign_id', campaignId);

      const { error } = await supabase
        .from('campaign_content')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('content_item_id', contentItemId);

      if (error) {
        throw new Error(`Failed to detach content: ${error.message}`);
      }
    },

    async findContentItems(campaignId: string): Promise<ContentItem[]> {
      const { data, error } = await supabase
        .from('campaign_content')
        .select('position, added_at, content_items(*)')
        .eq('campaign_id', campaignId)
        .order('position', { ascending: true });

      if (error || !data) return [];

      return data
        .map((row: any) => row.content_items)
        .filter(Boolean)
        .filter((c: any) => !c.deleted_at)
        .map(mapToContentItem);
    },

    // Join: Contacts
    async attachContact(campaignId: string, contactId: string, role: CampaignContactRole): Promise<void> {
      const { error } = await supabase
        .from('campaign_contacts')
        .upsert({
          campaign_id: campaignId,
          contact_id: contactId,
          role,
        });

      if (error) {
        throw new Error(`Failed to attach contact: ${error.message}`);
      }
    },

    async detachContact(campaignId: string, contactId: string): Promise<void> {
      const { error } = await supabase
        .from('campaign_contacts')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('contact_id', contactId);

      if (error) {
        throw new Error(`Failed to detach contact: ${error.message}`);
      }
    },

    async findContacts(campaignId: string): Promise<{ contact: Contact; role: CampaignContactRole }[]> {
      const { data, error } = await supabase
        .from('campaign_contacts')
        .select('role, added_at, contacts(*)')
        .eq('campaign_id', campaignId)
        .order('added_at', { ascending: true });

      if (error || !data) return [];

      return data
        .filter((row: any) => row.contacts && !row.contacts.deleted_at)
        .map((row: any) => ({
          contact: mapToContact(row.contacts),
          role: row.role,
        }));
    },

    // Metrics
    async recordMetric(
      campaignId: string,
      metricName: CampaignMetricName,
      value: number,
      createdBy: string,
      source: CampaignMetricSource = 'manual',
    ): Promise<CampaignMetric> {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .insert({
          campaign_id: campaignId,
          metric_name: metricName,
          value,
          source,
          created_by: createdBy,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(`Failed to record campaign metric: ${error?.message}`);
      }

      return mapToCampaignMetric(data);
    },

    async findMetrics(campaignId: string): Promise<CampaignMetric[]> {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('recorded_at', { ascending: false });

      if (error || !data) return [];
      return data.map(mapToCampaignMetric);
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToCampaign(row: any): Campaign {
  return {
    id: row.id,
    name: row.name,
    objective: row.objective,
    status: row.status,
    channel: Array.isArray(row.channel) ? row.channel : [],
    startDate: new Date(row.start_date),
    endDate: row.end_date ? new Date(row.end_date) : null,
    budget: row.budget ? parseFloat(row.budget) : null,
    ownerId: row.owner_id,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}

function mapToContentItem(row: any): ContentItem {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    platform: row.platform,
    type: row.type,
    caption: row.caption,
    body: row.body,
    status: row.status,
    publishDate: row.publish_date ? new Date(row.publish_date) : null,
    authorId: row.author_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}

function mapToContact(row: any): Contact {
  return {
    id: row.id,
    name: row.name,
    organization: row.organization,
    email: row.email,
    phone: row.phone,
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}

function mapToCampaignMetric(row: any): CampaignMetric {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    metricName: row.metric_name,
    value: parseFloat(row.value),
    recordedAt: new Date(row.recorded_at),
    source: row.source,
    createdBy: row.created_by,
  };
}
