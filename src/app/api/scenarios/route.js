import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const approved = searchParams.get('approved')
    const scenario_type = searchParams.get('type')
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('video_scenarios')
      .select(`
        *,
        video_submissions!inner (
          id,
          original_filename,
          mux_playback_id,
          driver_id,
          duration_seconds,
          is_anonymized,
          profiles!inner (
            full_name,
            email
          )
        )
      `)

    // Apply filters
    if (approved !== null) {
      query = query.eq('is_approved', approved === 'true')
    }

    if (scenario_type) {
      query = query.eq('scenario_type', scenario_type)
    }

    if (search) {
      query = query.or(`scenario_type.ilike.%${search}%, tags.ilike.%${search}%`)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (error) {
      console.error('Error fetching scenarios:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scenarios' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('video_scenarios')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      scenarios: data || [],
      count: data?.length || 0,
      total: count || 0,
      pagination: {
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: count > parseInt(offset) + parseInt(limit)
      }
    })

  } catch (error) {
    console.error('Error in scenarios API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { videoSubmissionId, scenarios } = await request.json()

    if (!videoSubmissionId || !scenarios || !Array.isArray(scenarios)) {
      return NextResponse.json(
        { error: 'Video submission ID and scenarios array required' },
        { status: 400 }
      )
    }

    // Verify the video submission exists
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('video_submissions')
      .select('id, duration_seconds')
      .eq('id', videoSubmissionId)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Video submission not found' },
        { status: 404 }
      )
    }

    // Process and validate scenarios
    const processedScenarios = scenarios.map(scenario => ({
      video_submission_id: videoSubmissionId,
      scenario_type: scenario.type || 'general_driving',
      start_time_seconds: Math.max(0, scenario.startTime || 0),
      end_time_seconds: Math.min(submission.duration_seconds || 60, scenario.endTime || 60),
      confidence_score: Math.min(1.0, Math.max(0.0, scenario.confidence || 0.5)),
      tags: JSON.stringify(scenario.tags || []),
      metadata: JSON.stringify(scenario.metadata || {}),
      is_approved: false,
      created_at: new Date().toISOString()
    }))

    // Insert scenarios
    const { data, error } = await supabaseAdmin
      .from('video_scenarios')
      .insert(processedScenarios)
      .select()

    if (error) {
      console.error('Error creating scenarios:', error)
      return NextResponse.json(
        { error: 'Failed to create scenarios' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scenarios: data,
      count: data.length
    })

  } catch (error) {
    console.error('Error creating scenarios:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request) {
  try {
    const { scenarioId, updates } = await request.json()

    if (!scenarioId) {
      return NextResponse.json(
        { error: 'Scenario ID required' },
        { status: 400 }
      )
    }

    // Validate updates
    const allowedUpdates = [
      'scenario_type', 
      'start_time_seconds', 
      'end_time_seconds', 
      'confidence_score', 
      'tags', 
      'metadata', 
      'is_approved', 
      'approval_notes'
    ]

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {})

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('video_scenarios')
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', scenarioId)
      .select()
      .single()

    if (error) {
      console.error('Error updating scenario:', error)
      return NextResponse.json(
        { error: 'Failed to update scenario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scenario: data
    })

  } catch (error) {
    console.error('Error updating scenario:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const scenarioId = searchParams.get('id')

    if (!scenarioId) {
      return NextResponse.json(
        { error: 'Scenario ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('video_scenarios')
      .delete()
      .eq('id', scenarioId)

    if (error) {
      console.error('Error deleting scenario:', error)
      return NextResponse.json(
        { error: 'Failed to delete scenario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Scenario deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting scenario:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for scenario statistics
export async function OPTIONS(request) {
  try {
    const { data: stats, error } = await supabaseAdmin
      .from('video_scenarios')
      .select(`
        scenario_type,
        is_approved,
        confidence_score
      `)

    if (error) {
      throw error
    }

    // Calculate statistics
    const totalScenarios = stats.length
    const approvedScenarios = stats.filter(s => s.is_approved).length
    const avgConfidence = stats.reduce((sum, s) => sum + s.confidence_score, 0) / totalScenarios

    const typeDistribution = stats.reduce((acc, scenario) => {
      acc[scenario.scenario_type] = (acc[scenario.scenario_type] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      total: totalScenarios,
      approved: approvedScenarios,
      pending: totalScenarios - approvedScenarios,
      averageConfidence: avgConfidence || 0,
      typeDistribution
    })

  } catch (error) {
    console.error('Error fetching scenario statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}