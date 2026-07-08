'use client';

/**
 * Feature Component — Brand Center Page
 *
 * Brand kit overview: logos, color palette swatches, typography samples,
 * templates. Guideline editor with version history.
 * Edit permissions restricted to Owner/Admin.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Palette,
  Type,
  Image,
  FileText,
  Plus,
  Edit3,
  Save,
  History,
  Eye,
  Trash2,
  Copy,
  Check,
  X,
  BookOpen,
  Sparkles,
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
import type { BrandAsset, BrandGuideline, ActiveBrandKit, BrandAssetType, MediaAsset } from '@/domain/entities';
import { MediaPickerModal } from '@/features/media-library/components/MediaPickerModal';
import {
  getBrandKitAction,
  getBrandGuidelinesAction,
  createBrandAssetAction,
  updateBrandAssetAction,
  deleteBrandAssetAction,
  publishGuidelineAction,
} from '../actions';

const ASSET_TYPE_ICONS: Record<string, typeof Palette> = {
  logo: Image,
  color_palette: Palette,
  font: Type,
  template: FileText,
  guideline_doc: BookOpen,
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: 'Logos',
  color_palette: 'Color Palettes',
  font: 'Typography',
  template: 'Templates',
  guideline_doc: 'Guideline Documents',
};

interface ColorEntry {
  name: string;
  hex: string;
}

export function BrandCenterPage() {
  const [brandKit, setBrandKit] = useState<ActiveBrandKit | null>(null);
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'guidelines'>('overview');

  // Create asset dialog
  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [newAssetType, setNewAssetType] = useState<BrandAssetType>('logo');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetDesc, setNewAssetDesc] = useState('');
  // Color palette-specific state
  const [paletteColors, setPaletteColors] = useState<ColorEntry[]>([
    { name: 'Primary', hex: '#6366f1' },
  ]);
  // Font-specific state
  const [fontFamily, setFontFamily] = useState('');
  const [fontWeights, setFontWeights] = useState('400, 500, 600, 700');

  // Media picker state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);


  // Guideline editor
  const [showGuidelineEditor, setShowGuidelineEditor] = useState(false);
  const [guidelineTitle, setGuidelineTitle] = useState('');
  const [guidelineContent, setGuidelineContent] = useState('');
  const [publishingGuideline, setPublishingGuideline] = useState(false);

  // Version viewer
  const [viewingGuideline, setViewingGuideline] = useState<BrandGuideline | null>(null);

  // Copied hex feedback
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [kitRes, guidelinesRes] = await Promise.all([
        getBrandKitAction(),
        getBrandGuidelinesAction(),
      ]);
      if (kitRes.success && kitRes.brandKit) setBrandKit(kitRes.brandKit);
      if (guidelinesRes.success) {
        setGuidelines(guidelinesRes.guidelines ?? []);
      }
    } catch {
      toast.error('Failed to load brand center.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateAsset() {
    if (!newAssetName.trim()) return;

    let value: Record<string, unknown> = {};
    if (newAssetType === 'color_palette') {
      value = { colors: paletteColors };
    } else if (newAssetType === 'font') {
      value = {
        family: fontFamily,
        weights: fontWeights.split(',').map((w) => parseInt(w.trim(), 10)).filter(Boolean),
      };
    }

    const res = await createBrandAssetAction({
      type: newAssetType,
      name: newAssetName.trim(),
      description: newAssetDesc || undefined,
      mediaId: selectedMedia?.id || undefined,
      value,
    });

    if (res.success) {
      toast.success(`Brand asset "${newAssetName}" created.`);
      setShowCreateAsset(false);
      resetCreateForm();
      loadData();
    } else {
      toast.error(res.error || 'Failed to create brand asset.');
    }
  }

  function resetCreateForm() {
    setNewAssetName('');
    setNewAssetDesc('');
    setNewAssetType('logo');
    setPaletteColors([{ name: 'Primary', hex: '#6366f1' }]);
    setFontFamily('');
    setFontWeights('400, 500, 600, 700');
    setSelectedMedia(null);
  }

  async function handleDeleteAsset(id: string) {
    if (!confirm('Delete this brand asset? This action is reversible (soft delete).')) return;
    const res = await deleteBrandAssetAction(id);
    if (res.success) {
      toast.success('Brand asset deleted.');
      loadData();
    } else {
      toast.error(res.error || 'Failed to delete.');
    }
  }

  async function handlePublishGuideline() {
    if (!guidelineTitle.trim() || !guidelineContent.trim()) return;
    setPublishingGuideline(true);
    try {
      const res = await publishGuidelineAction({
        title: guidelineTitle.trim(),
        content: guidelineContent,
      });
      if (res.success) {
        toast.success(`Guideline v${res.guideline?.version} published.`);
        setShowGuidelineEditor(false);
        setGuidelineTitle('');
        setGuidelineContent('');
        loadData();
      } else {
        toast.error(res.error || 'Failed to publish.');
      }
    } finally {
      setPublishingGuideline(false);
    }
  }

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  }

  function addPaletteColor() {
    setPaletteColors([...paletteColors, { name: '', hex: '#000000' }]);
  }

  function updatePaletteColor(index: number, field: 'name' | 'hex', value: string) {
    const next = [...paletteColors];
    const current = next[index];
    if (current) {
      next[index] = {
        name: field === 'name' ? value : current.name,
        hex: field === 'hex' ? value : current.hex,
      };
      setPaletteColors(next);
    }
  }

  function removePaletteColor(index: number) {
    setPaletteColors(paletteColors.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Brand Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your single source of truth for brand identity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGuidelineTitle(brandKit?.activeGuideline?.title || '');
              setGuidelineContent(brandKit?.activeGuideline?.content || '');
              setShowGuidelineEditor(true);
            }}
            className="gap-1.5"
          >
            <Edit3 className="h-4 w-4" />
            {brandKit?.activeGuideline ? 'Edit Guidelines' : 'Create Guidelines'}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateAsset(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Brand Kit Overview
        </button>
        <button
          onClick={() => setActiveTab('guidelines')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'guidelines'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Guidelines & History
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Logos */}
          <AssetSection
            type="logo"
            assets={brandKit?.logos ?? []}
            onDelete={handleDeleteAsset}
          />

          {/* Color Palettes */}
          <section>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-primary" />
              Color Palettes
            </h2>
            {brandKit?.colorPalettes && brandKit.colorPalettes.length > 0 ? (
              <div className="space-y-4">
                {brandKit.colorPalettes.map((asset) => {
                  const colors = (asset.value as { colors?: ColorEntry[] })?.colors ?? [];
                  return (
                    <Card key={asset.id} className="p-4 border-border/60">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-foreground">{asset.name}</h3>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {colors.map((color, i) => (
                          <button
                            key={i}
                            onClick={() => copyHex(color.hex)}
                            className="group flex flex-col items-center gap-1.5"
                            title={`Click to copy ${color.hex}`}
                          >
                            <div
                              className="w-14 h-14 rounded-lg border border-border/60 shadow-sm group-hover:ring-2 group-hover:ring-primary/40 transition-all"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-[10px] font-medium text-foreground">
                              {color.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                              {copiedHex === color.hex ? (
                                <>
                                  <Check className="h-2.5 w-2.5 text-green-500" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-2.5 w-2.5" />
                                  {color.hex}
                                </>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState label="No color palettes" />
            )}
          </section>

          {/* Typography */}
          <section>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
              <Type className="h-4 w-4 text-primary" />
              Typography
            </h2>
            {brandKit?.fonts && brandKit.fonts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {brandKit.fonts.map((asset) => {
                  const fontVal = asset.value as { family?: string; weights?: number[] };
                  return (
                    <Card key={asset.id} className="p-4 border-border/60">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-foreground">{asset.name}</h3>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {fontVal.family && (
                        <p
                          className="text-2xl mb-2"
                          style={{ fontFamily: fontVal.family }}
                        >
                          {fontVal.family}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        The quick brown fox jumps over the lazy dog
                      </p>
                      {fontVal.weights && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {fontVal.weights.map((w) => (
                            <Badge key={w} variant="secondary" className="text-[9px]">
                              {w}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState label="No typography defined" />
            )}
          </section>

          {/* Templates */}
          <AssetSection
            type="template"
            assets={brandKit?.templates ?? []}
            onDelete={handleDeleteAsset}
          />

          {/* Guideline Docs */}
          <AssetSection
            type="guideline_doc"
            assets={brandKit?.guidelineDoc ?? []}
            onDelete={handleDeleteAsset}
          />
        </div>
      )}

      {activeTab === 'guidelines' && (
        <div className="space-y-4">
          {/* Active guideline */}
          {brandKit?.activeGuideline ? (
            <Card className="p-6 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground text-[10px]">
                    Active v{brandKit.activeGuideline.version}
                  </Badge>
                  <h3 className="text-sm font-semibold text-foreground">
                    {brandKit.activeGuideline.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Published {new Date(brandKit.activeGuideline.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap text-sm leading-relaxed">
                {brandKit.activeGuideline.content}
              </div>
            </Card>
          ) : (
            <Card className="p-8 flex flex-col items-center text-center border-border/60">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No brand guidelines published yet.
              </p>
              <Button
                size="sm"
                className="mt-3 gap-1"
                onClick={() => setShowGuidelineEditor(true)}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Create First Guideline
              </Button>
            </Card>
          )}

          {/* Version History */}
          {guidelines.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Version History
              </h3>
              <div className="space-y-2">
                {guidelines.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={g.isActive ? 'default' : 'secondary'}
                        className="text-[9px] w-12 justify-center"
                      >
                        v{g.version}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-foreground">{g.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(g.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {g.isActive && (
                        <Badge variant="outline" className="text-[9px] text-green-600 border-green-600/30">
                          Active
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingGuideline(g)}
                        className="gap-1 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Asset Dialog */}
      <Dialog open={showCreateAsset} onOpenChange={setShowCreateAsset}>
        <DialogContent className="sm:max-w-[500px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Brand Asset
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newAssetType}
                onChange={(e) => setNewAssetType(e.target.value as BrandAssetType)}
              >
                <option value="logo">Logo</option>
                <option value="color_palette">Color Palette</option>
                <option value="font">Font</option>
                <option value="template">Template</option>
                <option value="guideline_doc">Guideline Document</option>
              </select>
            </div>

            <Input
              id="brand-asset-name"
              placeholder="Asset name"
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
            />
             <Input
              id="brand-asset-desc"
              placeholder="Description (optional)"
              value={newAssetDesc}
              onChange={(e) => setNewAssetDesc(e.target.value)}
            />

            {/* Logo/Template Media Picker */}
            {(newAssetType === 'logo' || newAssetType === 'template') && (
              <div className="space-y-1.5 p-3 bg-muted/30 rounded-lg border border-border/40">
                <span className="text-xs font-medium text-muted-foreground block">
                  Media File
                </span>
                {selectedMedia ? (
                  <div className="flex items-center justify-between p-2 bg-background rounded-md border border-border/60">
                    <div className="flex items-center gap-2 min-w-0">
                      {selectedMedia.mimeType.startsWith('image/') ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-assets/${selectedMedia.storagePath}`}
                          alt={selectedMedia.filename}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Image className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{selectedMedia.filename}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {selectedMedia.mimeType}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMedia(null)}
                      className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMediaPicker(true)}
                    className="w-full gap-1.5"
                  >
                    <Image className="h-4 w-4" />
                    Select Image/File from Media Library
                  </Button>
                )}
              </div>
            )}

            {/* Color Palette Editor */}
            {newAssetType === 'color_palette' && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/40">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Colors
                </span>
                {paletteColors.map((color, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updatePaletteColor(i, 'hex', e.target.value)}
                      className="w-8 h-8 rounded border-0 cursor-pointer"
                    />
                    <Input
                      placeholder="Color name"
                      value={color.name}
                      onChange={(e) => updatePaletteColor(i, 'name', e.target.value)}
                      className="flex-1 h-8 text-xs"
                    />
                    <Input
                      placeholder="#hex"
                      value={color.hex}
                      onChange={(e) => updatePaletteColor(i, 'hex', e.target.value)}
                      className="w-24 h-8 text-xs font-mono"
                    />
                    {paletteColors.length > 1 && (
                      <button
                        onClick={() => removePaletteColor(i)}
                        className="p-1 hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPaletteColor} className="w-full gap-1 text-xs">
                  <Plus className="h-3 w-3" />
                  Add Color
                </Button>
              </div>
            )}

            {/* Font Editor */}
            {newAssetType === 'font' && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/40">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Font Details
                </span>
                <Input
                  placeholder="Font family (e.g. Inter, Roboto)"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="Weights (comma-separated, e.g. 400, 500, 700)"
                  value={fontWeights}
                  onChange={(e) => setFontWeights(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowCreateAsset(false); resetCreateForm(); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateAsset} disabled={!newAssetName.trim()}>
                Create Asset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guideline Editor Dialog */}
      <Dialog open={showGuidelineEditor} onOpenChange={setShowGuidelineEditor}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {brandKit?.activeGuideline ? 'Publish New Guideline Version' : 'Create Brand Guidelines'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 flex-1 overflow-hidden flex flex-col">
            <Input
              id="guideline-title"
              placeholder="Guideline title"
              value={guidelineTitle}
              onChange={(e) => setGuidelineTitle(e.target.value)}
            />
            <textarea
              id="guideline-content"
              className="flex-1 min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Write your brand guidelines here... Supports markdown formatting."
              value={guidelineContent}
              onChange={(e) => setGuidelineContent(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Publishing creates a new immutable version. Previous versions are preserved in history (BR-1100).
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowGuidelineEditor(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePublishGuideline}
                disabled={publishingGuideline || !guidelineTitle.trim() || !guidelineContent.trim()}
                className="gap-1"
              >
                <Save className="h-3.5 w-3.5" />
                {publishingGuideline ? 'Publishing...' : 'Publish Guideline'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Guideline Version */}
      {viewingGuideline && (
        <Dialog open={!!viewingGuideline} onOpenChange={() => setViewingGuideline(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Guideline v{viewingGuideline.version}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3 rounded-lg border border-border/40">
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Title:</span>
                  <span className="text-foreground font-semibold">{viewingGuideline.title}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Published:</span>
                  <span className="text-foreground font-semibold">
                    {new Date(viewingGuideline.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg border border-border/60 max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed">
                {viewingGuideline.content}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(asset) => setSelectedMedia(asset)}
        mimeFilter={newAssetType === 'logo' ? 'image/' : undefined}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────

function AssetSection({
  type,
  assets,
  onDelete,
}: {
  type: string;
  assets: readonly BrandAsset[];
  onDelete: (id: string) => void;
}) {
  const IconComponent = ASSET_TYPE_ICONS[type] ?? FileText;
  const label = ASSET_TYPE_LABELS[type] ?? type;

  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
        <IconComponent className="h-4 w-4 text-primary" />
        {label}
      </h2>
      {assets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <Card key={asset.id} className="p-4 border-border/60 group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-foreground truncate">{asset.name}</h3>
                  <button
                    onClick={() => onDelete(asset.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {type === 'logo' && asset.media && (
                  <div className="aspect-[3/2] w-full rounded-md bg-muted/30 border border-border/40 flex items-center justify-center overflow-hidden mb-3">
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-assets/${asset.media.storagePath}`}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
                {asset.description && (
                  <p className="text-xs text-muted-foreground mb-2">{asset.description}</p>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Added {new Date(asset.createdAt).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState label={`No ${label.toLowerCase()}`} />
      )}
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-8 text-center text-muted-foreground/60">
      <p className="text-sm">{label}</p>
    </div>
  );
}
