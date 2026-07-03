/**
 * Domain Repository Interface — Campaign
 *
 * Interface only — implementation in infrastructure layer.
 */

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

export interface CampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  
  findAll(options?: {
    search?: string;
    status?: string;
    ownerId?: string;
    channel?: string;
    includeDeleted?: boolean;
  }): Promise<Campaign[]>;
  
  create(data: CreateCampaignInput): Promise<Campaign>;
  
  update(id: string, data: Partial<UpdateCampaignInput>): Promise<Campaign | null>;
  
  softDelete(id: string, deletedBy: string): Promise<void>;
  
  // Join: Content
  attachContent(campaignId: string, contentItemId: string, position?: number): Promise<void>;
  detachContent(campaignId: string, contentItemId: string): Promise<void>;
  findContentItems(campaignId: string): Promise<ContentItem[]>;
  
  // Join: Contacts
  attachContact(campaignId: string, contactId: string, role: CampaignContactRole): Promise<void>;
  detachContact(campaignId: string, contactId: string): Promise<void>;
  findContacts(campaignId: string): Promise<{ contact: Contact; role: CampaignContactRole }[]>;
  
  // Metrics
  recordMetric(
    campaignId: string,
    metricName: CampaignMetricName,
    value: number,
    createdBy: string,
    source?: CampaignMetricSource,
  ): Promise<CampaignMetric>;
  findMetrics(campaignId: string): Promise<CampaignMetric[]>;
}
