import * as React from "react"
import { cn } from "@/lib/utils"

interface SegmentedControlProps {
  value: string
  onValueChange: (value: string) => void
  items: { value: string; label: string }[]
  className?: string
}

export function SegmentedControl({
  value,
  onValueChange,
  items,
  className,
}: SegmentedControlProps) {
  return (
    <div className={cn(
      "w-full p-1 flex flex-col sm:flex-row gap-1 rounded-lg bg-muted",
      className
    )}>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onValueChange(item.value)}
          className={cn(
            "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all",
            "hover:bg-background/50",
            value === item.value 
              ? "bg-background shadow-sm" 
              : "text-muted-foreground"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
} 