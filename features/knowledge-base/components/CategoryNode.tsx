import { useState } from 'react';
import { Folder, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import type { KbCategory } from '@/domain/entities';

interface CategoryNodeProps {
  category: KbCategory;
  allCategories: KbCategory[];
  selectedCategoryId: string | null;
  onSelect: (id: string | null) => void;
  onAddSubcategory: (parentId: string) => void;
}

export function CategoryNode({
  category,
  allCategories,
  selectedCategoryId,
  onSelect,
  onAddSubcategory,
}: CategoryNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const children = allCategories.filter((c) => c.parentCategoryId === category.id);
  const isSelected = selectedCategoryId === category.id;

  return (
    <div className="pl-3">
      <div
        className={`flex items-center justify-between py-1.5 px-2 rounded-md transition-colors cursor-pointer group text-sm ${
          isSelected
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(category.id);
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-0.5 rounded hover:bg-muted text-muted-foreground"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <div className="w-4.5" />
          )}
          <Folder className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground/60'}`} />
          <span className="truncate">{category.name}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSubcategory(category.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded text-muted-foreground shrink-0 transition-opacity"
          title="Add subcategory"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && children.length > 0 && (
        <div className="mt-0.5 border-l border-border/40 ml-2">
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              allCategories={allCategories}
              selectedCategoryId={selectedCategoryId}
              onSelect={onSelect}
              onAddSubcategory={onAddSubcategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
