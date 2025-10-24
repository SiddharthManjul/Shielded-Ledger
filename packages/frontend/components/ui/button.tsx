import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-display font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 relative overflow-hidden tracking-wider uppercase",
  {
    variants: {
      variant: {
        // Primary - Neon yellow with glow
        default: "futuristic-primary",
        
        // Secondary - Outlined with animated border
        secondary: "futuristic-secondary",
        
        // Outline - Transparent with neon border
        outline: "futuristic-outline",
        
        // Ghost - Minimal with hover transform
        ghost: "futuristic-ghost",
        
        // Destructive - Red with warning effects
        destructive: "futuristic-destructive",
        
        // Success - Green with energy effects
        success: "futuristic-success",
        
        // Info - Cyan with data stream
        info: "futuristic-info",
        
        // Link - Simple underlined
        link: "text-yellow-accent underline-offset-4 hover:underline tracking-normal normal-case font-sans",
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-4",
        sm: "h-8 px-4 gap-1.5 text-xs has-[>svg]:px-3",
        lg: "h-12 px-8 text-base has-[>svg]:px-6",
        xl: "h-14 px-10 text-lg has-[>svg]:px-8",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
