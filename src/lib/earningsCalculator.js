import { supabaseAdmin } from './supabase'

export const EARNINGS_TIERS = {
  BRONZE: { minVideos: 0, baseRate: 0.05, label: 'Bronze' },
  SILVER: { minVideos: 10, baseRate: 0.08, label: 'Silver' },
  GOLD: { minVideos: 50, baseRate: 0.10, label: 'Gold' },
  PLATINUM: { minVideos: 100, baseRate: 0.12, label: 'Platinum' }
}

export const EDGE_CASE_BOUNTIES = {
  // Critical edge cases (highest value)
  wrong_way_driver: 50.00,
  major_accident: 30.00,
  emergency_vehicle_interaction: 25.00,
  
  // High value edge cases
  extreme_weather: 20.00,
  construction_zone_complex: 15.00,
  animal_collision_near_miss: 15.00,
  
  // Medium value edge cases
  unusual_pedestrian_behavior: 10.00,
  road_rage_incident: 10.00,
  vehicle_breakdown: 8.00,
  
  // Standard edge cases
  minor_weather_event: 5.00,
  standard_construction: 5.00,
  delivery_vehicle_blocking: 5.00
}

export async function getDriverTier(driverId) {
  const { count } = await supabaseAdmin
    .from('video_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('driver_id', driverId)
    .eq('upload_status', 'completed')
  
  const videoCount = count || 0
  
  if (videoCount >= EARNINGS_TIERS.PLATINUM.minVideos) return EARNINGS_TIERS.PLATINUM
  if (videoCount >= EARNINGS_TIERS.GOLD.minVideos) return EARNINGS_TIERS.GOLD
  if (videoCount >= EARNINGS_TIERS.SILVER.minVideos) return EARNINGS_TIERS.SILVER
  return EARNINGS_TIERS.BRONZE
}

export async function calculateEnhancedEarnings(
  durationSeconds, 
  scenarios, 
  edgeCases, 
  valueScore,
  driverId
) {
  const minutes = durationSeconds / 60
  
  const driverTier = await getDriverTier(driverId)
  const baseRate = driverTier.baseRate
  
  let baseEarnings = minutes * baseRate
  
  const qualityBonus = valueScore > 0.8 ? (minutes * 0.02) : 
                       valueScore > 0.6 ? (minutes * 0.01) : 0
  
  const scenarioDensity = scenarios.length / minutes
  const densityBonus = scenarioDensity > 0.5 ? (minutes * 0.01) : 0
  
  const volumeBonus = minutes > 120 ? (minutes * 0.01) : 0
  
  const edgeCaseBounties = edgeCases.reduce((total, edgeCase) => {
    const bountyAmount = EDGE_CASE_BOUNTIES[edgeCase.type] || 5.00
    const confidenceMultiplier = edgeCase.confidence > 0.8 ? 1.0 : 
                                 edgeCase.confidence > 0.6 ? 0.5 : 0.25
    return total + (bountyAmount * confidenceMultiplier)
  }, 0)
  
  const timeBonus = calculateTimeBonus(scenarios, minutes)
  
  const perMinuteEarnings = baseEarnings + qualityBonus + densityBonus + volumeBonus + timeBonus
  
  const totalEarnings = perMinuteEarnings + edgeCaseBounties
  
  const maxPerMinute = minutes * 0.20
  const cappedEarnings = Math.min(perMinuteEarnings, maxPerMinute) + edgeCaseBounties
  
  return {
    total: cappedEarnings,
    breakdown: {
      base: baseEarnings,
      tier: driverTier.label,
      qualityBonus,
      densityBonus,
      volumeBonus,
      timeBonus,
      edgeCaseBounties,
      effectiveRate: cappedEarnings / minutes
    }
  }
}

function calculateTimeBonus(scenarios, minutes) {
  let bonus = 0
  
  scenarios.forEach(scenario => {
    if (scenario.metadata?.time_of_day === 'night') {
      bonus += 0.01 * (scenario.end_time - scenario.start_time) / 60
    }
    
    if (['rain', 'snow', 'fog'].includes(scenario.metadata?.weather)) {
      bonus += 0.015 * (scenario.end_time - scenario.start_time) / 60
    }
  })
  
  return bonus
}

export function formatEarningsBreakdown(breakdown) {
  const items = [
    { label: `Base (${breakdown.tier})`, amount: breakdown.base },
    { label: 'Quality Bonus', amount: breakdown.qualityBonus },
    { label: 'Rich Data Bonus', amount: breakdown.densityBonus },
    { label: 'Volume Bonus', amount: breakdown.volumeBonus },
    { label: 'Conditions Bonus', amount: breakdown.timeBonus },
    { label: 'Edge Case Bounties', amount: breakdown.edgeCaseBounties }
  ].filter(item => item.amount > 0)
  
  return items
}