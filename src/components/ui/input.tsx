import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[#4d3a8c] placeholder:text-[#9f90c9] selection:bg-[rgba(186,154,255,0.35)] selection:text-[#3b2978] dark:bg-input/30 border border-[#dccaFF] bg-white/80 px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[rgba(186,154,255,0.8)] focus-visible:ring-[rgba(186,154,255,0.35)] focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-[#352463]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
