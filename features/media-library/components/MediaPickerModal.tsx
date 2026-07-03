'use client';

/**
 * Feature Component — Media Picker Modal
 *
 * Reusable modal for selecting media assets. Used by Content Studio's
 * editor to attach media, and anywhere else a media picker is needed.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Image, Film, FileText, Music, File, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Badge,
} from '@/shared/components/ui';
import type { MediaAsset } from '@/domain/entities';
import { getMediaAssetsAction } from '../actions';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  /** If true, show multi-select with confirm */
  multiple?: boolean;
  onSelectMultiple?: (assets: MediaAsset[]) => void;
  /** Filter by MIME type prefix e.g. 'image/' */
  mimeFilter?: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  multiple = false,
  onSelectMultiple,
  mimeFilter,
}: MediaPickerModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function loadAssets() {
    setLoading(true);
    try {
      const res = await getMediaAssetsAction({
        search: search || undefined,
        mimeTypePrefix: mimeFilter,
        status: 'active',
      });
      if (res.success) {
        setAssets(res.assets);
      }
    } catch {
      toast.error('Failed to load media assets.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      loadAssets();
      setSelected(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => loadAssets(), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function handleSelect(asset: MediaAsset) {
    if (multiple) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(asset.id)) next.delete(asset.id);
        else next.add(asset.id);
        return next;
      });
    } else {
      onSelect(asset);
      onClose();
    }
  }

  function handleConfirmMultiple() {
    const selectedAssets = assets.filter((a) => selected.has(a.id));
    onSelectMultiple?.(selectedAssets);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Select Media
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by filename or alt text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto min-h-[300px] mt-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Image className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">No media assets found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
              {assets.map((asset) => {
                const isSelected = selected.has(asset.id);
                const IconComponent = getFileIcon(asset.mimeType);
                const isImage = asset.mimeType.startsWith('image/');

                return (
                  <button
                    key={asset.id}
                    type="button"
                    className={`
                      relative group rounded-lg border p-2 text-left transition-all hover:border-primary/50 hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary/50
                      ${isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-border/60'}
                    `}
                    onClick={() => handleSelect(asset)}
                  >
                    {/* Thumbnail / Icon */}
                    <div className="aspect-square rounded-md bg-muted/50 flex items-center justify-center overflow-hidden mb-2">
                      {isImage ? (
                        <img
                          src={asset.storagePath}
                          alt={asset.altText || asset.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IconComponent className="h-8 w-8 text-muted-foreground/60" />
                      )}
                    </div>

                    {/* Filename */}
                    <p className="text-xs font-medium text-foreground truncate">
                      {asset.filename}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatFileSize(asset.size)}
                    </p>

                    {/* Tags */}
                    {asset.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {asset.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Multi-select confirm */}
        {multiple && selected.size > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {selected.size} item{selected.size > 1 ? 's' : ''} selected
            </p>
            <Button onClick={handleConfirmMultiple} size="sm" className="gap-1">
              <Check className="h-3.5 w-3.5" />
              Confirm Selection
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
