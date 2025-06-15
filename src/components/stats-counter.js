"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function StatsCounter({ end, duration = 2000, prefix = "", suffix = "", className }) {
  const [count, setCount] = useState(0)
  const countRef = useRef(null)
  const observerRef = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!countRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true

          const startTime = performance.now()
          const updateCount = (currentTime) => {
            const elapsedTime = currentTime - startTime
            const progress = Math.min(elapsedTime / duration, 1)
            const currentCount = Math.floor(progress * end)

            setCount(currentCount)

            if (progress < 1) {
              requestAnimationFrame(updateCount)
            } else {
              setCount(end)
            }
          }

          requestAnimationFrame(updateCount)
        }
      },
      { threshold: 0.1 },
    )

    observerRef.current.observe(countRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [end, duration])

  return (
    <span ref={countRef} className={cn("tabular-nums", className)}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}