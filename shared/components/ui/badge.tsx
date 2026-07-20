import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        /* shadcn originals — preserved */
        default:     "bg-primary/15 text-primary border-primary/20 [a]:hover:bg-primary/25",
        secondary:   "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive: "bg-destructive/10 text-destructive border-destructive/20 focus-visible:ring-destructive/20 [a]:hover:bg-destructive/20",
        outline:     "border-border text-foreground [a]:hover:bg-muted",
        ghost:       "hover:bg-muted hover:text-muted-foreground",
        link:        "text-primary underline-offset-4 hover:underline",
        /* Meridian semantic variants */
        cyan:   "bg-[rgba(77,216,255,0.12)]  text-mer-cyan  border-[rgba(77,216,255,0.25)]",
        green:  "bg-[rgba(52,211,153,0.12)]  text-mer-green border-[rgba(52,211,153,0.25)]",
        amber:  "bg-[rgba(232,169,60,0.12)]  text-mer-amber border-[rgba(232,169,60,0.25)]",
        red:    "bg-[rgba(240,87,107,0.12)]  text-mer-red   border-[rgba(240,87,107,0.25)]",
        blue:   "bg-[rgba(59,130,246,0.12)]  text-mer-blue  border-[rgba(59,130,246,0.25)]",
        muted:  "bg-white/5 text-mer-muted border-[var(--mer-border-glow)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
