/**
 * Domain Entity — BrandAsset, BrandGuideline
 *
 * Brand Kit entities: logos, color palettes, fonts, templates, guideline docs.
 * BrandGuideline is immutable/versioned — new edits create new rows (per BR-1100/1101).
 * Per BR-1302: Changing branding updates every module automatically.
 */

export type BrandAssetType =
  | 'logo'
  | 'color_palette'
  | 'font'
  | 'template'
  | 'guideline_doc';

// Typed value shapes for each asset type
export interface ColorPaletteValue {
  readonly colors: ReadonlyArray<{ readonly name: string; readonly hex: string }>;
}

export interface FontValue {
  readonly family: string;
  readonly weights: readonly number[];
  readonly url?: string | null;
}

export interface LogoValue {
  readonly variant?: string;
  readonly usage?: string;
}

export type BrandAssetValue =
  | ColorPaletteValue
  | FontValue
  | LogoValue
  | Record<string, unknown>;

export interface BrandAsset {
  readonly id: string;
  readonly type: BrandAssetType;
  readonly name: string;
  readonly mediaId: string | null;
  readonly value: BrandAssetValue;
  readonly description: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
  readonly media?: { readonly storagePath: string; readonly filename: string } | null;
}

export interface BrandGuideline {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly version: number;
  readonly isActive: boolean;
  readonly authorId: string;
  readonly createdAt: Date;
}

export interface CreateBrandAssetInput {
  readonly type: BrandAssetType;
  readonly name: string;
  readonly mediaId?: string | null;
  readonly value?: BrandAssetValue;
  readonly description?: string | null;
  readonly createdBy: string;
}

export interface UpdateBrandAssetInput {
  readonly name?: string;
  readonly mediaId?: string | null;
  readonly value?: BrandAssetValue;
  readonly description?: string | null;
  readonly deletedAt?: Date | null;
  readonly deletedBy?: string | null;
}

export interface PublishBrandGuidelineInput {
  readonly title: string;
  readonly content: string;
  readonly authorId: string;
}

/** The full bundled brand kit returned by GetActiveBrandKit */
export interface ActiveBrandKit {
  readonly logos: readonly BrandAsset[];
  readonly colorPalettes: readonly BrandAsset[];
  readonly fonts: readonly BrandAsset[];
  readonly templates: readonly BrandAsset[];
  readonly guidelineDoc: readonly BrandAsset[];
  readonly activeGuideline: BrandGuideline | null;
}
