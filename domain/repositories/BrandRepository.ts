/**
 * Domain — Brand Repository Interface
 *
 * Defines the contract for brand asset and guideline data access.
 */

import type {
  BrandAsset,
  BrandGuideline,
  BrandAssetType,
  CreateBrandAssetInput,
  UpdateBrandAssetInput,
  PublishBrandGuidelineInput,
} from '../entities/BrandAsset';

export interface BrandAssetRepository {
  findById(id: string): Promise<BrandAsset | null>;
  findAll(options?: {
    type?: BrandAssetType;
    includeDeleted?: boolean;
  }): Promise<BrandAsset[]>;
  create(input: CreateBrandAssetInput): Promise<BrandAsset>;
  update(id: string, input: UpdateBrandAssetInput): Promise<BrandAsset | null>;
  softDelete(id: string, deletedBy: string): Promise<void>;
}

export interface BrandGuidelineRepository {
  findById(id: string): Promise<BrandGuideline | null>;
  findAll(): Promise<BrandGuideline[]>;
  findActive(): Promise<BrandGuideline | null>;
  findLatestVersion(): Promise<number>;
  /** Deactivate all active guidelines (before publishing a new one) */
  deactivateAll(): Promise<void>;
  create(
    input: PublishBrandGuidelineInput & { version: number; isActive: boolean },
  ): Promise<BrandGuideline>;
}
