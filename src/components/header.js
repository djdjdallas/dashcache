"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Camera, Menu } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isScrolled ? "bg-black/80 backdrop-blur-md border-b border-gray-800" : "bg-transparent",
      )}
    >
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-blue-500" />
          <span className="font-bold text-xl">DashCache</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <div className="relative group">
            <button className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1">
              Features
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-96 bg-gray-900 border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Link href="#" className="block p-3 rounded-md hover:bg-gray-800 transition-colors">
                      <div className="font-medium text-sm">For Drivers</div>
                      <div className="text-xs text-gray-400 mt-1">Earn passive income from your drives</div>
                    </Link>
                    <Link href="#" className="block p-3 rounded-md hover:bg-gray-800 transition-colors">
                      <div className="font-medium text-sm">For Buyers</div>
                      <div className="text-xs text-gray-400 mt-1">Access high-quality training data</div>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    <Link href="#" className="block p-3 rounded-md hover:bg-gray-800 transition-colors">
                      <div className="font-medium text-sm">Security</div>
                      <div className="text-xs text-gray-400 mt-1">Privacy protection & data security</div>
                    </Link>
                    <Link href="#" className="block p-3 rounded-md hover:bg-gray-800 transition-colors">
                      <div className="font-medium text-sm">Platform</div>
                      <div className="text-xs text-gray-400 mt-1">How DashCache works</div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            About
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/auth">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-gray-950 border-gray-800">
            <div className="flex flex-col gap-6 pt-6">
              <div className="flex items-center gap-2">
                <Camera className="h-6 w-6 text-blue-500" />
                <span className="font-bold text-xl">DashCache</span>
              </div>
              <nav className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="font-medium">Features</div>
                  <Link href="#" className="text-gray-400 hover:text-white text-sm pl-2">
                    For Drivers
                  </Link>
                  <Link href="#" className="text-gray-400 hover:text-white text-sm pl-2">
                    For Buyers
                  </Link>
                  <Link href="#" className="text-gray-400 hover:text-white text-sm pl-2">
                    Security
                  </Link>
                </div>
                <Link href="#" className="font-medium">
                  Pricing
                </Link>
                <Link href="#" className="font-medium">
                  About
                </Link>
                <div className="flex flex-col gap-2 pt-4">
                  <Link href="/auth">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Get Started</Button>
                  </Link>
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}