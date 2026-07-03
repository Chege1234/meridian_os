/**
 * Domain Entity — ContentItem & ContentVersion
 *
 * Core Content Studio entity types. Framework-independent.
 */

export type ContentPlatform =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'email'
  | 'blog'
  | 'whatsapp';

export type ContentType =
  | 'post'
  | 'story'
  | 'reel'
  | 'caption'
  | 'article'
  | 'email_copy';

export type ContentStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived';

export interface ContentItem {
  readonly id: string;
  readonly campaignId: string | null;
  readonly platform: ContentPlatform;
  readonly type: ContentType;
  readonly caption: string | null;
  readonly body: string | null;
  readonly status: ContentStatus;
  readonly publishDate: Date | null;
  readonly authorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface ContentVersion {
  readonly id: string;
  readonly contentItemId: string;
  readonly body: string | null;
  readonly caption: string | null;
  readonly authorId: string;
  readonly summary: string | null;
  readonly createdAt: Date;
}

export interface MediaAsset {
  readonly id: string;
  readonly filename: string;
  readonly storagePath: string;
  readonly mimeType: string;
  readonly size: number;
  readonly uploadedBy: string;
  readonly checksum: string;
  readonly createdAt: Date;
}

export interface ContentMedia {
  readonly contentItemId: string;
  readonly mediaId: string;
  readonly position: number;
}

export interface CreateContentInput {
  readonly campaignId?: string | null;
  readonly platform: ContentPlatform;
  readonly type: ContentType;
  readonly caption?: string | null;
  readonly body?: string | null;
  readonly authorId: string;
  readonly status?: ContentStatus;
}

export interface UpdateContentInput {
  readonly campaignId?: string | null;
  readonly platform?: ContentPlatform;
  readonly type?: ContentType;
  readonly caption?: string | null;
  readonly body?: string | null;
  readonly status?: ContentStatus;
  readonly publishDate?: Date | null;
  readonly authorId: string; // The person updating
  readonly versionSummary?: string; // Change summary for the version snapshot
}
