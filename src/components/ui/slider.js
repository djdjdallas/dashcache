"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(value?.[0] || 0)
  
  const handleChange = (e) => {
    const newValue = Number(e.target.value)
    setInternalValue(newValue)
    onValueChange?.([newValue])
  }
  
  const percentage = ((value?.[0] || internalValue) - min) / (max - min) * 100
  
  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <div
          className="absolute h-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value?.[0] || internalValue}
        onChange={handleChange}
        className="absolute w-full h-full opacity-0 cursor-pointer"
        {...props}
      />
      <span
        className="absolute block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        style={{ left: `calc(${percentage}% - 10px)` }}
      />
    </div>
  )
})
Slider.displayName = "Slider"

export { Slider }