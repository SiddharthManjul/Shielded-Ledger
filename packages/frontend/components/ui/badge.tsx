import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex justify-center items-center gap-1 px-3 py-1 border aria-invalid:border-destructive focus-visible:border-ring aria-invalid:ring-destructive/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:aria-invalid:ring-destructive/40 w-fit [&>svg]:size-3 overflow-hidden font-medium text-xs whitespace-nowrap transition-all duration-300 [&>svg]:pointer-events-none shrink-0 corner-cut",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        gaming:
          "bg-yellow-accent/10 text-yellow-accent border-yellow-accent/30 [a&]:hover:bg-yellow-accent/20 [a&]:hover:border-yellow-accent/50",
        "gaming-blue":
          "bg-blue-500/10 text-blue-400 border-blue-500/30 [a&]:hover:bg-blue-500/20 [a&]:hover:border-blue-500/50",
        "gaming-green":
          "bg-green-500/10 text-green-400 border-green-500/30 [a&]:hover:bg-green-500/20 [a&]:hover:border-green-500/50",
        "gaming-purple":
          "bg-purple-500/10 text-purple-400 border-purple-500/30 [a&]:hover:bg-purple-500/20 [a&]:hover:border-purple-500/50",
        "gaming-red":
          "bg-red-500/10 text-red-400 border-red-500/30 [a&]:hover:bg-red-500/20 [a&]:hover:border-red-500/50",
      },
    },
    defaultVariants: {
      variant: "gaming",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
