/**
 * Domain Entity — Campaign, CampaignContacts, CampaignMetrics
 *
 * Core Campaign Center entity types. Framework-independent.
 */

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type CampaignContactRole = 'target' | 'participant' | 'referrer';

export type CampaignMetricName = 'reach' | 'clicks' | 'conversions' | 'signups' | 'revenue';

export type CampaignMetricSource = 'manual' | 'integration';

export interface Campaign {
  readonly id: string;
  readonly name: string;
  readonly objective: string;
  readonly status: CampaignStatus;
  readonly channel: string[]; // array of platforms: ['instagram', 'tiktok', 'email', 'whatsapp']
  readonly startDate: Date;
  readonly endDate: Date | null;
  readonly budget: number | null;
  readonly ownerId: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface CampaignContent {
  readonly campaignId: string;
  readonly contentItemId: string;
  readonly position: number;
  readonly addedAt: Date;
}

export interface CampaignContact {
  readonly campaignId: string;
  readonly contactId: string;
  readonly role: CampaignContactRole;
  readonly addedAt: Date;
}

export interface CampaignMetric {
  readonly id: string;
  readonly campaignId: string;
  readonly metricName: CampaignMetricName;
  readonly value: number;
  readonly recordedAt: Date;
  readonly source: CampaignMetricSource;
  readonly createdBy: string;
}

export interface CreateCampaignInput {
  readonly name: string;
  readonly objective: string;
  readonly channel: string[];
  readonly startDate: Date;
  readonly endDate?: Date | null;
  readonly budget?: number | null;
  readonly ownerId: string;
  readonly createdBy: string;
}

export interface UpdateCampaignInput {
  readonly name?: string;
  readonly objective?: string;
  readonly status?: CampaignStatus;
  readonly channel?: string[];
  readonly startDate?: Date;
  readonly endDate?: Date | null;
  readonly budget?: number | null;
  readonly ownerId?: string;
}
