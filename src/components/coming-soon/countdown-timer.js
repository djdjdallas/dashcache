"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function CountdownTimer({ targetDate, className }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      } else {
        setIsExpired(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (isExpired) {
    return (
      <div className={cn("text-center", className)}>
        <div className="text-2xl font-bold text-green-500">🎉 We're Live!</div>
      </div>
    )
  }

  const timeUnits = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds }
  ]

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {timeUnits.map((unit, index) => (
        <div key={unit.label} className="flex flex-col items-center">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 min-w-[60px] shadow-lg">
            <div className="text-2xl md:text-3xl font-bold text-blue-400 text-center tabular-nums">
              {unit.value.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-2 font-medium">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  )
}