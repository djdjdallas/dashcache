import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Test endpoint to verify scenario extraction
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')
    
    if (submissionId) {
      // Get scenarios for specific submission
      const { data: scenarios, error } = await supabaseAdmin
        .from('video_scenarios')
        .select('*')
        .eq('video_submission_id', submissionId)
        .order('start_time_seconds')
      
      if (error) throw error
      
      return NextResponse.json({
        submissionId,
        scenarioCount: scenarios.length,
        scenarios: scenarios.map(s => ({
          ...s,
          tags: JSON.parse(s.tags || '[]')
        }))
      })
    } else {
      // Get recent scenarios
      const { data: recentScenarios, error } = await supabaseAdmin
        .from('video_scenarios')
        .select(`
          *,
          video_submissions (
            id,
            original_filename,
            upload_status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      
      return NextResponse.json({
        total: recentScenarios.length,
        scenarios: recentScenarios.map(s => ({
          ...s,
          tags: JSON.parse(s.tags || '[]')
        }))
      })
    }
  } catch (error) {
    console.error('Error fetching scenarios:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    )
  }
}

// Test scenario generation
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
    
    // Generate test scenarios
    const scenarios = []
    const duration = submission.duration_seconds || 60
    
    // Create 3-5 test scenarios
    const numScenarios = Math.floor(Math.random() * 3) + 3
    
    for (let i = 0; i < numScenarios; i++) {
      const startTime = Math.floor((duration / numScenarios) * i)
      const endTime = Math.min(startTime + 10 + Math.random() * 10, duration)
      
      const types = ['intersection_turn', 'pedestrian_crossing', 'highway_merging', 'parking', 'weather_driving']
      const type = types[Math.floor(Math.random() * types.length)]
      
      scenarios.push({
        video_submission_id: submissionId,
        scenario_type: type,
        start_time_seconds: startTime,
        end_time_seconds: endTime,
        confidence_score: 0.7 + Math.random() * 0.25,
        tags: JSON.stringify(['test', 'synthetic', type]),
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
    
    return NextResponse.json({
      success: true,
      created: inserted.length,
      scenarios: inserted
    })
    
  } catch (error) {
    console.error('Error creating test scenarios:', error)
    return NextResponse.json(
      { error: 'Failed to create scenarios' },
      { status: 500 }
    )
  }
}