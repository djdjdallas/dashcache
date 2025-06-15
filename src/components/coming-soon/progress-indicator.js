"use client"

import { useEffect, useState } from "react"
import { Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProgressIndicator({ className, current = 347, total = 500, label = "Early Access Spots" }) {
  const [animatedCurrent, setAnimatedCurrent] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const percentage = Math.min((current / total) * 100, 100)
  const remaining = Math.max(total - current, 0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isVisible) {
          setIsVisible(true)
          
          // Animate the counter
          const duration = 2000
          const startTime = performance.now()
          
          const updateCounter = (currentTime) => {
            const elapsedTime = currentTime - startTime
            const progress = Math.min(elapsedTime / duration, 1)
            const currentCount = Math.floor(progress * current)
            
            setAnimatedCurrent(currentCount)
            
            if (progress < 1) {
              requestAnimationFrame(updateCounter)
            } else {
              setAnimatedCurrent(current)
            }
          }
          
          requestAnimationFrame(updateCounter)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('progress-indicator')
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [current, isVisible])

  return (
    <div id="progress-indicator" className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-400" />
          <span className="font-medium text-gray-300">{label}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">
            <span className="text-blue-400 tabular-nums">{animatedCurrent.toLocaleString()}</span>
            <span className="text-gray-500"> / {total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-2000 ease-out relative"
            style={{ width: `${isVisible ? percentage : 0}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-green-400/50 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-gray-500">0</span>
          <span className="text-gray-400 font-medium">
            {percentage.toFixed(1)}% filled
          </span>
          <span className="text-gray-500">{total.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400 tabular-nums">
            {remaining.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">spots remaining</div>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="h-4 w-4 text-orange-400" />
            <span className="text-lg font-bold text-orange-400">Fast</span>
          </div>
          <div className="text-xs text-gray-400">filling up</div>
        </div>
      </div>

      {percentage > 80 && (
        <div className="bg-red-950/30 border border-red-500/50 rounded-lg p-3 text-center">
          <div className="text-red-400 font-medium text-sm mb-1">
            🚨 Almost Full!
          </div>
          <div className="text-xs text-red-300">
            Only {remaining} spots left - reserve yours now
          </div>
        </div>
      )}

      {percentage > 95 && (
        <div className="bg-yellow-950/30 border border-yellow-500/50 rounded-lg p-3 text-center animate-pulse">
          <div className="text-yellow-400 font-bold text-sm mb-1">
            ⚡ FINAL SPOTS ⚡
          </div>
          <div className="text-xs text-yellow-300">
            Less than {remaining} spots remaining!
          </div>
        </div>
      )}
    </div>
  )
}