import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenu = ({ children, ...props }) => {
  const [open, setOpen] = React.useState(false)
  
  const contextValue = { open, setOpen }
  
  return (
    <DropdownMenuContext.Provider value={contextValue}>
      <div className="relative inline-block text-left" {...props}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuContext = React.createContext()

const DropdownMenuTrigger = React.forwardRef(({ className, children, asChild, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
  
  const handleClick = () => {
    setOpen(!open)
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref,
      className: cn(children.props.className, className),
      onClick: handleClick,
      ...props
    })
  }
  
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef(({ className, align = "end", sideOffset = 4, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
  const contentRef = React.useRef()
  
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && contentRef.current && !contentRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen])
  
  if (!open) return null
  
  return (
    <div
      ref={(node) => {
        contentRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-900 shadow-md",
        align === "end" ? "right-0" : "left-0",
        "mt-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef(({ className, inset, onClick, ...props }, ref) => {
  const { setOpen } = React.useContext(DropdownMenuContext)
  
  const handleClick = (event) => {
    onClick?.(event)
    setOpen(false)
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
        inset && "pl-8",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", "bg-gray-200", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}