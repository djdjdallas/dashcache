"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const NavigationMenu = React.forwardRef(({ className, children, ...props }, ref) => (
  <nav ref={ref} className={cn("relative z-10 flex flex-1 items-center justify-center", className)} {...props}>
    {children}
  </nav>
))
NavigationMenu.displayName = "NavigationMenu"

const NavigationMenuList = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("group flex flex-1 list-none items-center justify-center space-x-1", className)}
    {...props}
  />
))
NavigationMenuList.displayName = "NavigationMenuList"

const NavigationMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
NavigationMenuItem.displayName = "NavigationMenuItem"

const NavigationMenuTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const [open, setOpen] = React.useState(false)
  
  return (
    <button
      ref={ref}
      className={cn(
        "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
      <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" />
    </button>
  )
})
NavigationMenuTrigger.displayName = "NavigationMenuTrigger"

const NavigationMenuContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute left-0 top-full mt-1.5 w-full data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in",
      className
    )}
    {...props}
  >
    <div className="w-[400px] overflow-hidden rounded-md border bg-popover p-4 text-popover-foreground shadow-lg">
      {props.children}
    </div>
  </div>
))
NavigationMenuContent.displayName = "NavigationMenuContent"

const NavigationMenuLink = React.forwardRef(({ className, asChild, ...props }, ref) => {
  if (asChild) {
    return React.cloneElement(props.children, {
      ref,
      className: cn(
        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      ),
      ...props
    })
  }
  
  return (
    <a
      ref={ref}
      className={cn(
        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
})
NavigationMenuLink.displayName = "NavigationMenuLink"

const navigationMenuTriggerStyle = () =>
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
}