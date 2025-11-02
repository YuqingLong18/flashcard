import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-[#dccaFF] bg-white/85 px-3 py-2 text-base text-[#352463] shadow-xs transition-[color,box-shadow] outline-none placeholder:text-[#9f90c9] selection:bg-[rgba(186,154,255,0.35)] selection:text-[#3b2978] focus-visible:border-[rgba(186,154,255,0.8)] focus-visible:ring-[rgba(186,154,255,0.35)] focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
