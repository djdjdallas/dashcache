import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Test the same query the admin page uses
    const { data: scenarios, error: scenarioError } = await supabaseAdmin
      .from('video_scenarios')
      .select(`
        *,
        video_submissions (
          id,
          original_filename,
          mux_playback_id,
          duration_seconds,
          profiles (
            full_name,
            email
          )
        )
      `)
      .eq('is_approved', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (scenarioError) {
      throw scenarioError
    }

    // Check if scenarios have playback IDs
    const scenariosWithPlayback = scenarios?.filter(s => s.video_submissions?.mux_playback_id) || []
    
    return NextResponse.json({
      success: true,
      totalScenarios: scenarios?.length || 0,
      scenariosWithPlayback: scenariosWithPlayback.length,
      sampleScenarios: scenarios?.slice(0, 2).map(s => ({
        id: s.id,
        scenario_type: s.scenario_type,
        filename: s.video_submissions?.original_filename,
        hasPlaybackId: !!s.video_submissions?.mux_playback_id,
        playbackId: s.video_submissions?.mux_playback_id?.substring(0, 10) + '...'
      })) || []
    })

  } catch (error) {
    console.error('Admin data test error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}