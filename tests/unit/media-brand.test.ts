/**
 * Unit Tests — Media Library & Brand Center (Section 6)
 *
 * Tests: checksum-based duplicate detection, folder nesting depth limit,
 * single-active-guideline-version enforcement.
 */

import { describe, it, expect } from 'vitest';
import {
  detectChecksumDuplicate,
  calculateFolderDepth,
  MAX_FOLDER_DEPTH,
  canArchiveAsset,
  canHardDeleteAsset,
  getAssetCategory,
} from '@/domain/rules/MediaRules';
import {
  calculateNextGuidelineVersion,
  getGuidelinesToDeactivate,
  validateGuidelineContent,
} from '@/domain/rules/BrandRules';
import type { MediaAsset, MediaFolder, BrandGuideline } from '@/domain/entities';

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────

function makeAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: 'asset-1',
    filename: 'test.png',
    storagePath: '/uploads/test.png',
    mimeType: 'image/png',
    size: 1024,
    uploadedBy: 'user-1',
    checksum: 'abc123',
    altText: null,
    tags: [],
    folderId: null,
    width: 800,
    height: 600,
    duration: null,
    status: 'active',
    createdAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

function makeFolder(overrides: Partial<MediaFolder> = {}): MediaFolder {
  return {
    id: 'folder-1',
    name: 'Root Folder',
    parentFolderId: null,
    createdBy: 'user-1',
    createdAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

function makeGuideline(overrides: Partial<BrandGuideline> = {}): BrandGuideline {
  return {
    id: 'guideline-1',
    title: 'Brand Guidelines v1',
    content: 'Some brand content here.',
    version: 1,
    isActive: true,
    authorId: 'user-1',
    createdAt: new Date(),
    ...overrides,
  };
}

// ────────────────────────────────────────────────────
// Media Rules Tests
// ────────────────────────────────────────────────────

describe('MediaRules', () => {
  describe('detectChecksumDuplicate', () => {
    it('should detect duplicate when checksum matches an active asset', () => {
      const existing = [makeAsset({ checksum: 'abc123', status: 'active' })];
      const result = detectChecksumDuplicate('abc123', existing);
      expect(result.hasDuplicate).toBe(true);
      expect(result.existingAsset).toBeTruthy();
      expect(result.existingAsset?.id).toBe('asset-1');
    });

    it('should NOT flag duplicate when no checksum match', () => {
      const existing = [makeAsset({ checksum: 'def456', status: 'active' })];
      const result = detectChecksumDuplicate('abc123', existing);
      expect(result.hasDuplicate).toBe(false);
      expect(result.existingAsset).toBeNull();
    });

    it('should NOT flag duplicate for archived assets', () => {
      const existing = [makeAsset({ checksum: 'abc123', status: 'archived' })];
      const result = detectChecksumDuplicate('abc123', existing);
      expect(result.hasDuplicate).toBe(false);
    });

    it('should handle empty asset list gracefully', () => {
      const result = detectChecksumDuplicate('abc123', []);
      expect(result.hasDuplicate).toBe(false);
      expect(result.existingAsset).toBeNull();
    });
  });

  describe('calculateFolderDepth', () => {
    it('should return 0 for root-level folder', () => {
      const folder = makeFolder({ parentFolderId: null });
      const depth = calculateFolderDepth(folder, [folder]);
      expect(depth).toBe(0);
    });

    it('should return correct depth for nested folders', () => {
      const root = makeFolder({ id: 'f1', parentFolderId: null });
      const child = makeFolder({ id: 'f2', parentFolderId: 'f1' });
      const grandchild = makeFolder({ id: 'f3', parentFolderId: 'f2' });

      const allFolders = [root, child, grandchild];
      expect(calculateFolderDepth(grandchild, allFolders)).toBe(2);
    });

    it('should throw when nesting exceeds MAX_FOLDER_DEPTH', () => {
      const folders: MediaFolder[] = [];
      for (let i = 0; i <= MAX_FOLDER_DEPTH + 1; i++) {
        folders.push(
          makeFolder({
            id: `f${i}`,
            parentFolderId: i > 0 ? `f${i - 1}` : null,
          }),
        );
      }
      const deepFolder = folders[folders.length - 1]!;
      expect(() => calculateFolderDepth(deepFolder, folders)).toThrow(
        /depth limit/i,
      );
    });
  });

  describe('canArchiveAsset / canHardDeleteAsset', () => {
    it('should always allow archiving (even when referenced)', () => {
      expect(canArchiveAsset(true)).toBe(true);
      expect(canArchiveAsset(false)).toBe(true);
    });

    it('should block hard delete when referenced', () => {
      expect(canHardDeleteAsset(true)).toBe(false);
      expect(canHardDeleteAsset(false)).toBe(true);
    });
  });

  describe('getAssetCategory', () => {
    it('should categorize image types', () => {
      expect(getAssetCategory('image/png')).toBe('image');
      expect(getAssetCategory('image/jpeg')).toBe('image');
    });

    it('should categorize video types', () => {
      expect(getAssetCategory('video/mp4')).toBe('video');
    });

    it('should categorize audio types', () => {
      expect(getAssetCategory('audio/mpeg')).toBe('audio');
    });

    it('should categorize document types', () => {
      expect(getAssetCategory('application/pdf')).toBe('document');
      expect(getAssetCategory('text/plain')).toBe('document');
    });

    it('should return other for unknown types', () => {
      expect(getAssetCategory('application/octet-stream')).toBe('other');
    });
  });
});

// ────────────────────────────────────────────────────
// Brand Rules Tests
// ────────────────────────────────────────────────────

describe('BrandRules', () => {
  describe('calculateNextGuidelineVersion', () => {
    it('should increment version by 1', () => {
      expect(calculateNextGuidelineVersion(0)).toBe(1);
      expect(calculateNextGuidelineVersion(3)).toBe(4);
      expect(calculateNextGuidelineVersion(10)).toBe(11);
    });
  });

  describe('getGuidelinesToDeactivate', () => {
    it('should return IDs of all active guidelines', () => {
      const guidelines = [
        makeGuideline({ id: 'g1', isActive: true }),
        makeGuideline({ id: 'g2', isActive: false }),
        makeGuideline({ id: 'g3', isActive: true }),
      ];
      const result = getGuidelinesToDeactivate(guidelines);
      expect(result).toEqual(['g1', 'g3']);
    });

    it('should return empty array when no guidelines are active', () => {
      const guidelines = [
        makeGuideline({ id: 'g1', isActive: false }),
        makeGuideline({ id: 'g2', isActive: false }),
      ];
      const result = getGuidelinesToDeactivate(guidelines);
      expect(result).toEqual([]);
    });

    it('should enforce single-active-version (at most one active)', () => {
      // After deactivation + new publish, exactly one should be active
      const guidelines = [
        makeGuideline({ id: 'g1', isActive: true, version: 1 }),
      ];
      const toDeactivate = getGuidelinesToDeactivate(guidelines);
      expect(toDeactivate).toHaveLength(1);
    });
  });

  describe('validateGuidelineContent', () => {
    it('should reject empty title', () => {
      const result = validateGuidelineContent('', 'Some content here.');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('title');
    });

    it('should reject empty content', () => {
      const result = validateGuidelineContent('Title', '');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject content shorter than 10 characters', () => {
      const result = validateGuidelineContent('Title', 'Short');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too short');
    });

    it('should accept valid content', () => {
      const result = validateGuidelineContent('Brand Guidelines', 'This is our official brand identity document with all necessary guidelines.');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
