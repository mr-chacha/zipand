"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"
import { formatPhone } from "@/lib/phone"

function Input({ className, type, onChange, defaultValue, ...props }: React.ComponentProps<"input">) {
  const tel = type === "tel"
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm app:h-11 app:border-foreground/30 app:text-base app:focus-visible:border-ring dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      defaultValue={tel && typeof defaultValue === "string" ? formatPhone(defaultValue) : defaultValue}
      onChange={
        tel
          ? (e: React.ChangeEvent<HTMLInputElement>) => {
              e.currentTarget.value = formatPhone(e.currentTarget.value)
              onChange?.(e)
            }
          : onChange
      }
      {...(tel && { inputMode: "tel" as const, maxLength: 13 })}
      {...props}
    />
  )
}

export { Input }
