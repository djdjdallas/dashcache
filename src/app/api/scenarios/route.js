import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const approved = searchParams.get('approved')
    const scenario_type = searchParams.get('type')
    const limit = searchParams.get('limit') || '50'

    let query = supabaseAdmin
      .from('video_scenarios')
      .select(`
        *,
        video_submissions (
          original_filename,
          mux_playback_id,
          driver_id,
          profiles (
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

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (error) {
      console.error('Error fetching scenarios:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scenarios' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      scenarios: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Error in scenarios API:', error)
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

    const { data, error } = await supabaseAdmin
      .from('video_scenarios')
      .update(updates)
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