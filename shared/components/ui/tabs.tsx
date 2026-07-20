"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center p-[3px] text-mer-muted group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-[rgba(255,255,255,0.05)] rounded-xl border border-[var(--mer-border-glow)]",
        line:    "gap-1 bg-transparent rounded-none",
        /* Meridian pill variant — Image 2 segmented control */
        pill:    "bg-[rgba(7,12,22,0.7)] rounded-full border border-[var(--mer-border-glow)] px-1 gap-1 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-2px)] flex-1 items-center justify-center gap-1.5",
        "rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap",
        "text-mer-muted transition-all duration-200",
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
        "hover:text-mer-text",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        /* Default variant active */
        "group-data-[variant=default]/tabs-list:data-active:bg-[rgba(77,216,255,0.1)]",
        "group-data-[variant=default]/tabs-list:data-active:text-mer-cyan",
        "group-data-[variant=default]/tabs-list:data-active:border-[rgba(77,216,255,0.25)]",
        "group-data-[variant=default]/tabs-list:data-active:shadow-[0_0_8px_rgba(77,216,255,0.15)]",
        /* Pill variant active */
        "group-data-[variant=pill]/tabs-list:rounded-full",
        "group-data-[variant=pill]/tabs-list:data-active:bg-[rgba(77,216,255,0.15)]",
        "group-data-[variant=pill]/tabs-list:data-active:text-mer-cyan",
        "group-data-[variant=pill]/tabs-list:data-active:border-[rgba(77,216,255,0.3)]",
        /* Line variant — unchanged */
        "group-data-[variant=line]/tabs-list:bg-transparent",
        "group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "after:absolute after:bg-mer-cyan after:opacity-0 after:transition-opacity",
        "group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5",
        "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
