import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Manually trigger scenario generation for a video
export async function POST(request) {
  try {
    const { submissionId } = await request.json()
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId required' },
        { status: 400 }
      )
    }
    
    // Get submission
    const { data: submission, error: subError } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()
    
    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    
    console.log('📹 Found submission:', submission)
    
    // Import the processVideo function
    const { processVideo } = await import('@/app/api/webhooks/mux/route.js')
      .catch(() => ({ processVideo: null }))
    
    if (!processVideo) {
      // Fallback: Generate scenarios directly
      console.log('⚠️ ProcessVideo not available, generating scenarios directly')
      
      const duration = submission.duration_seconds || 60
      const scenarios = []
      
      // Generate 3-5 scenarios
      const numScenarios = Math.floor(Math.random() * 3) + 3
      const scenarioTypes = [
        'intersection_turn',
        'pedestrian_crossing', 
        'highway_merging',
        'parking',
        'weather_driving'
      ]
      
      for (let i = 0; i < numScenarios; i++) {
        const startTime = Math.floor((duration / numScenarios) * i)
        const endTime = Math.min(startTime + 10 + Math.random() * 10, duration)
        const type = scenarioTypes[Math.floor(Math.random() * scenarioTypes.length)]
        
        scenarios.push({
          video_submission_id: submissionId,
          scenario_type: type,
          start_time_seconds: startTime,
          end_time_seconds: endTime,
          confidence_score: 0.7 + Math.random() * 0.25,
          tags: JSON.stringify(['manual', 'test', type]),
          is_approved: false
        })
      }
      
      // Insert scenarios
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('video_scenarios')
        .insert(scenarios)
        .select()
      
      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }
      
      // Update submission status if needed
      if (submission.upload_status === 'ready' || submission.upload_status === 'processing') {
        await supabaseAdmin
          .from('video_submissions')
          .update({ upload_status: 'completed' })
          .eq('id', submissionId)
      }
      
      return NextResponse.json({
        success: true,
        message: 'Scenarios generated manually',
        scenariosCreated: inserted.length,
        scenarios: inserted
      })
    }
    
    // Use processVideo if available
    const playbackId = submission.mux_playback_id || 'dummy-playback-id'
    const duration = submission.duration_seconds || 60
    
    console.log('🚀 Triggering processVideo...')
    await processVideo(submission, playbackId, duration)
    
    // Check if scenarios were created
    const { data: scenarios } = await supabaseAdmin
      .from('video_scenarios')
      .select('*')
      .eq('video_submission_id', submissionId)
    
    return NextResponse.json({
      success: true,
      message: 'Process video triggered',
      scenariosCreated: scenarios.length,
      submission: {
        id: submission.id,
        filename: submission.original_filename,
        status: submission.upload_status
      }
    })
    
  } catch (error) {
    console.error('Error triggering scenarios:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to trigger scenarios' },
      { status: 500 }
    )
  }
}

// GET endpoint to check video status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')
    
    if (!submissionId) {
      // Get recent videos without scenarios
      const { data: videos } = await supabaseAdmin
        .from('video_submissions')
        .select(`
          *,
          video_scenarios (count)
        `)
        .order('created_at', { ascending: false })
        .limit(10)
      
      const videosWithoutScenarios = videos?.filter(v => 
        !v.video_scenarios || v.video_scenarios[0]?.count === 0
      ) || []
      
      return NextResponse.json({
        videosWithoutScenarios: videosWithoutScenarios.map(v => ({
          id: v.id,
          filename: v.original_filename,
          status: v.upload_status,
          createdAt: v.created_at,
          hasScenarios: false
        }))
      })
    }
    
    // Get specific video with scenarios
    const { data: submission } = await supabaseAdmin
      .from('video_submissions')
      .select(`
        *,
        video_scenarios (*)
      `)
      .eq('id', submissionId)
      .single()
    
    return NextResponse.json({
      submission: {
        id: submission.id,
        filename: submission.original_filename,
        status: submission.upload_status,
        muxAssetId: submission.mux_asset_id,
        duration: submission.duration_seconds,
        scenarios: submission.video_scenarios || []
      }
    })
    
  } catch (error) {
    console.error('Error checking video status:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}