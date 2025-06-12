import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Manually verify scenario accuracy
export async function POST(request) {
  try {
    const { scenarioId, isAccurate, actualScenarioType, notes } = await request.json()
    
    if (!scenarioId) {
      return NextResponse.json(
        { error: 'scenarioId required' },
        { status: 400 }
      )
    }
    
    // Get current scenario
    const { data: scenario, error } = await supabaseAdmin
      .from('video_scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single()
    
    if (error || !scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      )
    }
    
    // Update scenario with verification data
    const updates = {
      is_verified: true,
      is_accurate: isAccurate,
      verification_notes: notes,
      verified_at: new Date().toISOString()
    }
    
    // If user provided correct scenario type, update it
    if (actualScenarioType && actualScenarioType !== scenario.scenario_type) {
      updates.scenario_type = actualScenarioType
      updates.original_ai_prediction = scenario.scenario_type
    }
    
    const { error: updateError } = await supabaseAdmin
      .from('video_scenarios')
      .update(updates)
      .eq('id', scenarioId)
    
    if (updateError) {
      throw updateError
    }
    
    return NextResponse.json({
      success: true,
      message: 'Scenario verification recorded',
      scenarioId,
      isAccurate,
      updatedType: actualScenarioType
    })
    
  } catch (error) {
    console.error('Error verifying scenario:', error)
    return NextResponse.json(
      { error: 'Failed to verify scenario' },
      { status: 500 }
    )
  }
}

// Get accuracy statistics
export async function GET() {
  try {
    const { data: scenarios, error } = await supabaseAdmin
      .from('video_scenarios')
      .select('scenario_type, confidence_score, is_verified, is_accurate, tags')
    
    if (error) throw error
    
    const stats = {
      total: scenarios.length,
      verified: scenarios.filter(s => s.is_verified).length,
      accurate: scenarios.filter(s => s.is_accurate).length,
      byType: {}
    }
    
    // Calculate accuracy by scenario type
    const typeGroups = scenarios.reduce((acc, scenario) => {
      const type = scenario.scenario_type
      if (!acc[type]) {
        acc[type] = { total: 0, verified: 0, accurate: 0, avgConfidence: 0 }
      }
      acc[type].total++
      acc[type].avgConfidence += scenario.confidence_score
      
      if (scenario.is_verified) {
        acc[type].verified++
        if (scenario.is_accurate) {
          acc[type].accurate++
        }
      }
      return acc
    }, {})
    
    // Calculate final stats
    Object.keys(typeGroups).forEach(type => {
      const group = typeGroups[type]
      stats.byType[type] = {
        total: group.total,
        verified: group.verified,
        accurate: group.accurate,
        accuracy: group.verified > 0 ? (group.accurate / group.verified * 100).toFixed(1) + '%' : 'N/A',
        avgConfidence: (group.avgConfidence / group.total).toFixed(2)
      }
    })
    
    return NextResponse.json({
      overallStats: stats,
      typeBreakdown: stats.byType,
      needsVerification: scenarios.filter(s => !s.is_verified).length
    })
    
  } catch (error) {
    console.error('Error getting accuracy stats:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}