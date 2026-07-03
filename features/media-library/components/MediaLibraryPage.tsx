'use client';

/**
 * Feature Component — Media Library Page
 *
 * Grid/list view with folder navigation, drag-and-drop upload, search/filter.
 * Upload flow shows duplicate warning when checksum matches.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
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
} from '@/shared/components/ui';
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
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<MediaFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetsRes, foldersRes] = await Promise.all([
        getMediaAssetsAction({
          search: search || undefined,
          folderId: search ? undefined : currentFolderId,
          status: 'active',
        }),
        getMediaFoldersAction(currentFolderId),
      ]);

      if (assetsRes.success) setAssets(assetsRes.assets);
      if (foldersRes.success) setFolders(foldersRes.folders);

      if (currentFolderId) {
        const bcRes = await getFolderBreadcrumbsAction(currentFolderId);
        if (bcRes.success) setBreadcrumbs(bcRes.breadcrumbs);
      } else {
        setBreadcrumbs([]);
      }
    } catch {
      toast.error('Failed to load media library.');
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => loadData(), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Media Library
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload, organize, and manage all your media assets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateFolder(true)}
            className="gap-1.5"
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
          <Button
            size="sm"
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

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        <button
          onClick={() => navigateToFolder(null)}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Home className="h-3.5 w-3.5" />
          Root
        </button>
        {breadcrumbs.map((bc) => (
          <span key={bc.id} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <button
              onClick={() => navigateToFolder(bc.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {bc.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="media-search"
            placeholder="Search by filename, alt text, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center border border-border rounded-md">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            aria-label="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone + Content */}
      <div
        className={`
          min-h-[400px] rounded-xl border-2 border-dashed transition-all
          ${dragOver ? 'border-primary bg-primary/5' : 'border-border/40 bg-transparent'}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="flex flex-col items-center justify-center h-[400px] text-primary">
            <Upload className="h-12 w-12 mb-2 animate-bounce" />
            <p className="text-sm font-medium">Drop files to upload</p>
          </div>
        )}

        {!dragOver && loading && (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        )}

        {!dragOver && !loading && (
          <div className="p-4">
            {/* Folders */}
            {folders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Folders
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.id)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-accent/30 transition-all group"
                    >
                      <Folder className="h-8 w-8 text-primary/60 group-hover:text-primary transition-colors" />
                      <span className="text-xs font-medium text-foreground truncate max-w-full">
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assets */}
            {assets.length === 0 && folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Image className="h-16 w-16 mb-3 opacity-20" />
                <p className="text-sm font-medium">No media assets yet</p>
                <p className="text-xs mt-1">Drag and drop files here or click Upload</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {assets.map((asset) => {
                  const IconComponent = getFileIcon(asset.mimeType);
                  const isImage = asset.mimeType.startsWith('image/');
                  return (
                    <Card
                      key={asset.id}
                      className="group relative overflow-hidden border-border/60 hover:border-primary/40 transition-all cursor-default"
                    >
                      {/* Thumbnail / Icon */}
                      <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                        {isImage ? (
                          <img
                            src={asset.storagePath}
                            alt={asset.altText || asset.filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <IconComponent className="h-10 w-10 text-muted-foreground/40" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-foreground truncate">
                          {asset.filename}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatFileSize(asset.size)} · {asset.mimeType.split('/')[1]?.toUpperCase()}
                        </p>
                        {asset.tags.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {asset.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Actions (on hover) */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleArchive(asset.id)}
                          className="bg-background/80 backdrop-blur-sm border border-border/60 p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Archive"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-1">
                {assets.map((asset) => {
                  const IconComponent = getFileIcon(asset.mimeType);
                  return (
                    <div
                      key={asset.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/30 border border-transparent hover:border-border/40 transition-all group"
                    >
                      <IconComponent className="h-5 w-5 text-muted-foreground/60 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {asset.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(asset.size)} · {asset.mimeType} · {new Date(asset.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {asset.tags.length > 0 && (
                        <div className="flex gap-1 flex-shrink-0">
                          {asset.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[9px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleArchive(asset.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all flex-shrink-0"
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="sm:max-w-[400px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
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
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreateFolder(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Warning Dialog */}
      {duplicateWarning && (
        <Dialog open={!!duplicateWarning} onOpenChange={() => setDuplicateWarning(null)}>
          <DialogContent className="sm:max-w-[450px] border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
                Duplicate File Detected
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                A file with the same checksum already exists in your library:
              </p>
              <Card className="p-3 border-amber-500/20 bg-amber-500/5">
                <p className="text-sm font-medium text-foreground">
                  {duplicateWarning.existingAsset.filename}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatFileSize(duplicateWarning.existingAsset.size)} ·{' '}
                  Uploaded {new Date(duplicateWarning.existingAsset.createdAt).toLocaleDateString()}
                </p>
              </Card>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDuplicateWarning(null)}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.success('Using existing asset.');
                    setDuplicateWarning(null);
                  }}
                >
                  Use Existing
                </Button>
                <Button
                  size="sm"
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
