"use client"

import { CheckCircle, Clock, Gift, Shield, Star, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export function EarlyAccessBenefits({ className }) {
  const benefits = [
    {
      icon: Users,
      title: "Early access before public launch",
      description: "Be among the first 500 drivers to join DashCache",
      highlight: true
    },
    {
      icon: Star,
      title: "Exclusive 50% earnings bonus for first 3 months",
      description: "Double your income during the initial period",
      highlight: true
    },
    {
      icon: Gift,
      title: "Free DashCache-compatible dashcam (worth $200)",
      description: "Premium 4K dashcam with built-in GPS and WiFi",
      highlight: true
    },
    {
      icon: Shield,
      title: "Priority customer support",
      description: "Dedicated support line with 24/7 response time"
    },
    {
      icon: Clock,
      title: "Locked-in pricing for life",
      description: "Your commission rate will never increase"
    }
  ]

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
          Be First. Earn More.
        </h2>
        <div className="inline-flex items-center gap-2 bg-red-950/50 border border-red-500/50 rounded-full px-4 py-2">
          <Clock className="h-4 w-4 text-red-400" />
          <span className="text-red-400 font-medium text-sm">
            Only 500 early access spots remaining
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {benefits.map((benefit, index) => {
          const IconComponent = benefit.icon
          return (
            <div
              key={index}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border transition-all duration-300 hover:shadow-lg",
                benefit.highlight
                  ? "bg-gradient-to-r from-blue-950/30 to-green-950/30 border-blue-500/30 hover:border-blue-400/50"
                  : "bg-gray-900/50 border-gray-700 hover:border-gray-600"
              )}
            >
              <div className={cn(
                "rounded-full p-2 flex-shrink-0 mt-1",
                benefit.highlight
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-gray-700/50 text-gray-400"
              )}>
                <CheckCircle className="h-5 w-5" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "rounded-lg p-2 flex-shrink-0",
                    benefit.highlight
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-700/50 text-gray-400"
                  )}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-semibold mb-1",
                      benefit.highlight ? "text-white" : "text-gray-300"
                    )}>
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-gradient-to-r from-purple-950/30 to-blue-950/30 border border-purple-500/30 rounded-lg p-6 text-center">
        <div className="mb-3">
          <span className="text-2xl">💎</span>
          <h3 className="text-lg font-bold text-purple-300 mt-2">
            VIP Status
          </h3>
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Early access members get permanent VIP status with exclusive features and higher earning potential.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-purple-400">
          <Star className="h-4 w-4" />
          <span>Lifetime membership benefits</span>
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm text-gray-400 mb-2">
          🎯 <strong>Limited Time:</strong> Early access closes in
        </div>
        <div className="text-xs text-gray-500">
          or when we reach 500 members - whichever comes first
        </div>
      </div>
    </div>
  )
}