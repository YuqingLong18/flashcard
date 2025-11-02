import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-[rgba(186,154,255,0.6)] focus-visible:ring-[rgba(186,154,255,0.45)] focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[rgb(186,154,255)] text-white shadow-[0_10px_30px_-12px_rgba(135,97,207,0.65)] hover:bg-[rgb(170,140,238)] focus-visible:ring-[rgb(216,195,255)]/70",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-[#d9c8ff] bg-white/80 text-[#4d3a8c] shadow-sm backdrop-blur-[2px] hover:bg-[#f5eeff] hover:text-[#3c2a6d] dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-[#f5efff] text-[#4d3a8c] hover:bg-[#ede3ff] hover:text-[#3c2a6d]",
        ghost:
          "text-[#4d3a8c] hover:bg-[#f7f2ff] hover:text-[#3c2a6d] dark:hover:bg-accent/40",
        link: "text-[#7e5fd6] underline-offset-4 hover:text-[#6243be] hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
