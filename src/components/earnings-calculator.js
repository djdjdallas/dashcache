"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"

export function EarningsCalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(20)
  const [qualityScore, setQualityScore] = useState(80)

  // Calculate estimated earnings based on hours and quality
  const calculateEarnings = () => {
    // Base rate per hour
    const baseRate = 1.25
    // Quality multiplier (80% quality = 1x, 100% quality = 1.5x)
    const qualityMultiplier = 0.5 + (qualityScore / 100) * 1
    // Weekly earnings
    const weeklyEarnings = hoursPerWeek * baseRate * qualityMultiplier
    // Monthly earnings (4.33 weeks per month on average)
    const monthlyEarnings = weeklyEarnings * 4.33

    return {
      weekly: weeklyEarnings.toFixed(2),
      monthly: monthlyEarnings.toFixed(2),
      yearly: (monthlyEarnings * 12).toFixed(2),
    }
  }

  const earnings = calculateEarnings()

  return (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 border-b border-gray-800">
        <CardTitle className="text-xl">Earnings Calculator</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="hours">Hours Driven Per Week</Label>
              <span className="text-sm font-medium">{hoursPerWeek} hours</span>
            </div>
            <Slider
              id="hours"
              min={5}
              max={60}
              step={1}
              value={[hoursPerWeek]}
              onValueChange={(value) => setHoursPerWeek(value[0])}
              className="[&>span]:bg-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>5h</span>
              <span>60h</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="quality">Footage Quality Score</Label>
              <span className="text-sm font-medium">{qualityScore}%</span>
            </div>
            <Slider
              id="quality"
              min={50}
              max={100}
              step={1}
              value={[qualityScore]}
              onValueChange={(value) => setQualityScore(value[0])}
              className="[&>span]:bg-green-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <h4 className="text-sm font-medium mb-3">Estimated Earnings</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-gray-400">Weekly</div>
                <div className="text-lg font-bold text-blue-500">${earnings.weekly}</div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-gray-400">Monthly</div>
                <div className="text-lg font-bold text-purple-500">${earnings.monthly}</div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-gray-400">Yearly</div>
                <div className="text-lg font-bold text-green-500">${earnings.yearly}</div>
              </div>
            </div>
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Earning Now</Button>
        </div>
      </CardContent>
    </Card>
  )
}