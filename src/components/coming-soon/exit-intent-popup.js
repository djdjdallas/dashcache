"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { X, Gift, Mail, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    let isExiting = false

    const handleMouseLeave = (e) => {
      // Only trigger if mouse is leaving the top of the page and we haven't shown the popup yet
      if (e.clientY <= 0 && !hasShown && !isExiting) {
        isExiting = true
        setHasShown(true)
        setIsOpen(true)
      }
    }

    // Add a small delay before enabling exit intent to avoid false triggers
    const enableExitIntent = () => {
      document.addEventListener('mouseleave', handleMouseLeave)
    }

    const timer = setTimeout(enableExitIntent, 3000) // Enable after 3 seconds

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [hasShown])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Exit intent email signup:', email)
    setIsSubmitted(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-gray-900 border border-green-500/50 text-white max-w-md">
          <div className="text-center p-6">
            <div className="mb-4">
              <Gift className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-green-400 mb-2">
                Bonus Secured! 🎉
              </h3>
              <p className="text-gray-300 text-sm">
                Check your email for your exclusive driver guide and early access details.
              </p>
            </div>
            <Button 
              onClick={handleClose}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              Continue Browsing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-gray-900 border border-blue-500/50 text-white max-w-md">
        <div className="relative">
          <button
            onClick={handleClose}
            className="absolute right-0 top-0 p-2 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-center p-6">
            <div className="mb-6">
              <div className="bg-red-950/50 border border-red-500/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-red-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">
                Wait! Don't Miss Out
              </h2>
              <p className="text-gray-300 text-sm mb-4">
                Before you go, grab your <strong className="text-blue-400">$25 signup bonus</strong> and 
                free driver guide to maximizing rideshare earnings.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-950/30 to-purple-950/30 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Gift className="h-5 w-5 text-blue-400" />
                <span className="font-semibold text-blue-300">Exclusive Exit Offer</span>
              </div>
              <ul className="text-sm text-gray-300 space-y-1 text-left">
                <li>✅ $25 bonus when you join (limited time)</li>
                <li>✅ Free "Rideshare Earnings Maximizer" guide</li>
                <li>✅ Early access notification (worth $200 dashcam)</li>
              </ul>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white pl-10"
                    required
                  />
                </div>
                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                >
                  Claim Bonus
                </Button>
              </div>
            </form>

            <div className="mt-4 text-xs text-gray-500">
              No spam, unsubscribe anytime. Offer expires in 24 hours.
            </div>

            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-300 text-sm mt-4 underline"
            >
              No thanks, I'll pass on the bonus
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}