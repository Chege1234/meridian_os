'use client';

/**
 * Feature Component â€” Media Library Page
 *
 * Grid/list view with folder navigation, drag-and-drop upload, search/filter.
 * Upload flow shows duplicate warning when checksum matches.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Upload,
  FolderPlus,
  Grid3X3,
  List,
  Image,
  Film,
  FileText,
  Music,
  File,
  Folder,
  ChevronRight,
  Home,
  MoreVertical,
  Archive,
  Move,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/components/ui';
import { GlassPanel } from '@/shared/components/ui/GlassPanel';
import type { MediaAsset, MediaFolder } from '@/domain/entities';
import {
  getMediaAssetsAction,
  getMediaFoldersAction,
  getFolderBreadcrumbsAction,
  uploadMediaAction,
  createFolderAction,
  archiveMediaAction,
  checkDuplicateAction,
} from '../actions';

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

type ViewMode = 'grid' | 'list';

export function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Create folder dialog
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Duplicate warning dialog
  const [duplicateWarning, setDuplicateWarning] = useState<{
    file: File;
    existingAsset: MediaAsset;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data: assetsRes, isLoading: loadingAssets } = useQuery({
    queryKey: ['mediaAssets', { search: debouncedSearch, currentFolderId }],
    queryFn: () => getMediaAssetsAction({
      search: debouncedSearch || undefined,
      folderId: debouncedSearch ? undefined : currentFolderId,
      status: 'active',
    }),
    staleTime: 180000, // 3 mins
  });

  const { data: foldersRes, isLoading: loadingFolders } = useQuery({
    queryKey: ['mediaFolders', currentFolderId],
    queryFn: () => getMediaFoldersAction(currentFolderId),
    staleTime: 180000, // 3 mins
  });

  const { data: bcRes } = useQuery({
    queryKey: ['mediaBreadcrumbs', currentFolderId],
    queryFn: () => getFolderBreadcrumbsAction(currentFolderId!),
    enabled: !!currentFolderId,
    staleTime: 180000, // 3 mins
  });

  const assets = assetsRes?.success ? assetsRes.assets : [];
  const folders = foldersRes?.success ? foldersRes.folders : [];
  const breadcrumbs = currentFolderId && bcRes?.success ? bcRes.breadcrumbs : [];
  const loading = loadingAssets || loadingFolders;

  const loadData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['mediaAssets'] });
    queryClient.invalidateQueries({ queryKey: ['mediaFolders'] });
    queryClient.invalidateQueries({ queryKey: ['mediaBreadcrumbs'] });
  }, [queryClient]);


  function navigateToFolder(folderId: string | null) {
    setCurrentFolderId(folderId);
    setSearch('');
  }

  async function handleUpload(file: File, forceUpload = false) {
    setUploading(true);
    try {
      // Pre-check for duplicate
      if (!forceUpload) {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(buffer));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const dupRes = await checkDuplicateAction(checksum);
        if (dupRes.success && dupRes.hasDuplicate && dupRes.existingAsset) {
          setDuplicateWarning({ file, existingAsset: dupRes.existingAsset });
          setUploading(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);
      formData.append('folderId', currentFolderId || '');
      formData.append('forceUpload', forceUpload.toString());

      const res = await uploadMediaAction(formData);
      if (res.success) {
        toast.success(`Uploaded "${file.name}" successfully.`);
        loadData();
      } else {
        toast.error(res.error || 'Upload failed.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      toast.error(message);
    } finally {
      setUploading(false);
      setDuplicateWarning(null);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => handleUpload(file));
    }
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach((file) => handleUpload(file));
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const res = await createFolderAction({
      name: newFolderName.trim(),
      parentFolderId: currentFolderId,
    });
    if (res.success) {
      toast.success(`Folder "${newFolderName}" created.`);
      setShowCreateFolder(false);
      setNewFolderName('');
      loadData();
    } else {
      toast.error(res.error || 'Failed to create folder.');
    }
  }

  async function handleArchive(assetId: string) {
    if (!confirm('Archive this media asset? It will remain accessible in existing content.')) return;
    const res = await archiveMediaAction(assetId);
    if (res.success) {
      toast.success('Media asset archived.');
      loadData();
    } else {
      toast.error(res.error || 'Failed to archive.');
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
            Meridian OS
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-mer-text">
            Media Library
          </h1>
          <p className="mt-1 text-sm text-mer-muted">
            Upload, organize, and manage all your media assets in a secure repository.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateFolder(true)}
            className="gap-1.5 border-[var(--mer-border-glow)] hover:border-[var(--mer-border-hover)]"
          >
            <FolderPlus className="h-4 w-4 text-mer-cyan" />
            New Folder
          </Button>
          <Button
            size="sm"
            variant="glow"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-1.5"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Upload media files"
          />
        </div>
      </div>

      {/* Navigation & Controls Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md p-4">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => navigateToFolder(null)}
            className="text-mer-muted hover:text-mer-cyan transition-colors flex items-center gap-1 font-medium cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            Root
          </button>
          {breadcrumbs.map((bc) => (
            <span key={bc.id} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-mer-muted/40" />
              <button
                onClick={() => navigateToFolder(bc.id)}
                className="text-mer-muted hover:text-mer-cyan transition-colors font-medium cursor-pointer"
              >
                {bc.name}
              </button>
            </span>
          ))}
        </nav>

        {/* Search + View Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mer-muted" />
            <Input
              id="media-search"
              placeholder="Search by filename, alt, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)] text-xs h-9"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.6)] p-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[rgba(77,216,255,0.12)] text-mer-cyan border border-[rgba(77,216,255,0.25)]'
                  : 'text-mer-muted hover:text-mer-text'
              }`}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[rgba(77,216,255,0.12)] text-mer-cyan border border-[rgba(77,216,255,0.25)]'
                  : 'text-mer-muted hover:text-mer-text'
              }`}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Drag & Drop Zone + Content */}
      <div
        className={`
          min-h-[420px] rounded-[16px] border border-dashed transition-all duration-200
          ${dragOver ? 'border-mer-cyan bg-[rgba(77,216,255,0.04)] shadow-[0_0_24px_var(--mer-glow-cyan)]' : 'border-[var(--mer-border-glow)] bg-[var(--mer-surface)]/30'}
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="flex flex-col items-center justify-center h-[420px] text-mer-cyan">
            <Upload className="h-12 w-12 mb-3 animate-bounce" />
            <p className="text-sm font-semibold tracking-wide">Drop files to upload</p>
          </div>
        )}

        {!dragOver && loading && (
          <div className="flex items-center justify-center h-[420px]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-mer-cyan border-t-transparent shadow-[0_0_12px_rgba(77,216,255,0.3)]" />
          </div>
        )}

        {!dragOver && !loading && (
          <div className="p-5">
            {/* Folders Section */}
            {folders.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-semibold text-mer-muted uppercase tracking-widest mb-3">
                  Folders
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.id)}
                      className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(13,20,35,0.6)] hover:border-[var(--mer-border-hover)] hover:shadow-[0_0_12px_var(--mer-glow-cyan)] hover:bg-[rgba(13,20,35,0.85)] transition-all group text-center cursor-pointer"
                    >
                      <Folder className="h-7 w-7 text-mer-cyan/70 group-hover:text-mer-cyan transition-colors" />
                      <span className="text-xs font-semibold text-mer-text truncate max-w-full">
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assets Section */}
            {assets.length === 0 && folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[320px] text-mer-muted">
                <Image className="h-16 w-16 mb-4 opacity-20 text-mer-cyan" />
                <p className="text-sm font-semibold text-mer-text">No media assets in this folder</p>
                <p className="text-xs mt-1">Drag and drop files here or click Upload to get started.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="space-y-3">
                {assets.length > 0 && (
                  <p className="text-[10px] font-semibold text-mer-muted uppercase tracking-widest">
                    Media Items ({assets.length})
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {assets.map((asset) => {
                    const IconComponent = getFileIcon(asset.mimeType);
                    const isImage = asset.mimeType.startsWith('image/');
                    return (
                      <div
                        key={asset.id}
                        className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[var(--mer-border-glow)] bg-[rgba(13,20,35,0.65)] hover:border-[var(--mer-border-hover)] hover:shadow-[0_0_16px_var(--mer-glow-cyan)] transition-all duration-200"
                      >
                        {/* Thumbnail or Icon */}
                        <div className="h-28 bg-[rgba(7,12,22,0.4)] flex items-center justify-center overflow-hidden border-b border-[var(--mer-border-glow)]">
                          {isImage ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-assets/${asset.storagePath}`}
                              alt={asset.altText || asset.filename}
                              className="max-h-full max-w-full object-contain p-2"
                              loading="lazy"
                            />
                          ) : (
                            <IconComponent className="h-8 w-8 text-mer-cyan/40" />
                          )}
                        </div>
                        {/* File details */}
                        <div className="p-3">
                          <p className="text-xs font-semibold text-mer-text truncate" title={asset.filename}>
                            {asset.filename}
                          </p>
                          <p className="text-[10px] text-mer-muted mt-0.5 font-mono">
                            {formatFileSize(asset.size)} Â· {asset.mimeType.split('/')[1]?.toUpperCase()}
                          </p>
                          {asset.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {asset.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="muted" className="text-[9px] px-1.5 py-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Actions (hover) */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleArchive(asset.id)}
                            className="bg-[rgba(7,12,22,0.85)] border border-[var(--mer-border-glow)] p-1.5 rounded-lg text-mer-muted hover:text-mer-red hover:border-mer-red/50 transition-colors cursor-pointer"
                            title="Archive"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* List View Table */
              <div className="space-y-3">
                {assets.length > 0 && (
                  <p className="text-[10px] font-semibold text-mer-muted uppercase tracking-widest">
                    Media Items ({assets.length})
                  </p>
                )}
                <div className="overflow-x-auto rounded-[16px] border border-[var(--mer-border-glow)]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Filename</TableHead>
                        <TableHead>Mime Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((asset) => {
                        const IconComponent = getFileIcon(asset.mimeType);
                        return (
                          <TableRow key={asset.id}>
                            <TableCell>
                              <div className="flex items-center gap-2.5 max-w-sm">
                                <IconComponent className="h-4 w-4 text-mer-cyan/60 shrink-0" />
                                <span className="font-semibold text-mer-text truncate" title={asset.filename}>
                                  {asset.filename}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-mer-muted uppercase">
                              {asset.mimeType}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-mer-text">
                              {formatFileSize(asset.size)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {asset.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="muted" className="text-[9px]">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                onClick={() => handleArchive(asset.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 text-mer-muted hover:text-mer-red transition-all cursor-pointer"
                                title="Archive"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-mer-cyan" />
              New Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              id="new-folder-name"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              className="bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)]"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Warning Dialog */}
      {duplicateWarning && (
        <Dialog open={!!duplicateWarning} onOpenChange={() => setDuplicateWarning(null)}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-mer-amber">
                <AlertTriangle className="h-4 w-4" />
                Duplicate File Detected
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-mer-muted leading-relaxed">
                A file with the identical content hash is already registered in your library:
              </p>
              <GlassPanel className="p-4 border-mer-amber/30 bg-mer-amber/5">
                <p className="text-sm font-semibold text-mer-text truncate">
                  {duplicateWarning.existingAsset.filename}
                </p>
                <p className="text-xs text-mer-muted mt-0.5 font-mono">
                  {formatFileSize(duplicateWarning.existingAsset.size)} Â·{' '}
                  Uploaded {new Date(duplicateWarning.existingAsset.createdAt).toLocaleDateString()}
                </p>
              </GlassPanel>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDuplicateWarning(null)}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.success('Using existing asset reference.');
                    setDuplicateWarning(null);
                  }}
                  className="border-[var(--mer-border-glow)] text-mer-text"
                >
                  Use Existing
                </Button>
                <Button
                  variant="glow"
                  onClick={() => {
                    handleUpload(duplicateWarning.file, true);
                  }}
                >
                  Upload Anyway
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
