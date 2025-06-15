"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const SheetContext = React.createContext({})

const Sheet = ({ open, onOpenChange, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <SheetContext.Provider value={{ open: open ?? isOpen, onOpenChange: onOpenChange ?? setIsOpen }}>
      {props.children}
    </SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef(({ children, asChild, ...props }, ref) => {
  const { onOpenChange } = React.useContext(SheetContext)
  
  if (asChild) {
    return React.cloneElement(children, {
      ...props,
      ref,
      onClick: (e) => {
        children.props.onClick?.(e)
        onOpenChange(true)
      },
    })
  }
  
  return (
    <button ref={ref} onClick={() => onOpenChange(true)} {...props}>
      {children}
    </button>
  )
})
SheetTrigger.displayName = "SheetTrigger"

const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(SheetContext)
  
  if (!open) return null
  
  const sideClasses = {
    right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
    top: "inset-x-0 top-0 border-b",
    bottom: "inset-x-0 bottom-0 border-t",
  }
  
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={ref}
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out",
          sideClasses[side],
          className
        )}
        {...props}
      >
        {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </>
  )
})
SheetContent.displayName = "SheetContent"

export { Sheet, SheetTrigger, SheetContent }