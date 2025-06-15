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
    
    // Check if scenarios already exist
    const { data: existingScenarios } = await supabaseAdmin
      .from('video_scenarios')
      .select('*')
      .eq('video_submission_id', submissionId)
    
    if (existingScenarios && existingScenarios.length > 0) {
      console.log('ℹ️ Scenarios already exist for this video:', existingScenarios.length)
      return NextResponse.json({
        success: true,
        message: 'Scenarios already exist',
        scenariosCreated: 0,
        existingScenarios: existingScenarios.length
      })
    }
    
    console.log('🎯 Starting AI scenario generation...')
    
    // Try to get video URL for AI analysis
    let videoUrl = null
    let duration = submission.duration_seconds || 60
    
    // Priority 1: Use Mux playback URL if available
    if (submission.mux_playback_id) {
      videoUrl = `https://stream.mux.com/${submission.mux_playback_id}.mp4`
      console.log('🎬 Using Mux video URL:', videoUrl)
    } 
    // Priority 2: Use Supabase raw video if available
    else if (submission.raw_video_path) {
      // Generate signed URL for AI services to access
      try {
        const { data: signedUrlData } = await supabaseAdmin.storage
          .from('dashcam-videos')
          .createSignedUrl(submission.raw_video_path, 3600) // 1 hour expiry
        
        if (signedUrlData?.signedUrl) {
          videoUrl = signedUrlData.signedUrl
          console.log('💾 Using Supabase video URL:', videoUrl.substring(0, 100) + '...')
        }
      } catch (error) {
        console.error('Failed to create signed URL:', error)
      }
    }
    
    let awsScenarios = []
    let googleScenarios = []
    let scenarios = []
    let analysisMethod = 'fallback'
    
    if (videoUrl) {
      console.log('🤖 Starting PRODUCTION AI analysis with both AWS and Google...')
      
      // Run AWS Rekognition
      try {
        console.log('🅰️ Running AWS Rekognition analysis...')
        awsScenarios = await analyzeVideoWithAWS(videoUrl, submission)
        if (awsScenarios && awsScenarios.length > 0) {
          console.log('✅ AWS Rekognition found', awsScenarios.length, 'scenarios')
        } else {
          console.log('⚠️ AWS Rekognition returned no scenarios')
        }
      } catch (awsError) {
        console.error('❌ AWS Rekognition failed:', awsError.message)
      }
      
      // Run Google Video Intelligence (regardless of AWS results)
      try {
        console.log('🅶 Running Google Video Intelligence analysis...')
        googleScenarios = await analyzeVideoWithGoogle(videoUrl, submission)
        if (googleScenarios && googleScenarios.length > 0) {
          console.log('✅ Google Video Intelligence found', googleScenarios.length, 'scenarios')
        } else {
          console.log('⚠️ Google Video Intelligence returned no scenarios')
        }
      } catch (googleError) {
        console.error('❌ Google Video Intelligence failed:', googleError.message)
      }
      
      // Combine results from both services
      const allScenarios = [...(awsScenarios || []), ...(googleScenarios || [])]
      
      if (allScenarios.length > 0) {
        scenarios = allScenarios
        if (awsScenarios.length > 0 && googleScenarios.length > 0) {
          analysisMethod = 'aws_and_google_combined'
        } else if (awsScenarios.length > 0) {
          analysisMethod = 'aws_rekognition_only'
        } else {
          analysisMethod = 'google_video_intelligence_only'
        }
        console.log('🎯 Combined AI analysis: AWS found', awsScenarios.length, 'scenarios, Google found', googleScenarios.length, 'scenarios')
      } else {
        console.log('⚠️ Both AI services failed or returned no results')
      }
    }
    
    // Fallback: Generate synthetic scenarios
    if (scenarios.length === 0) {
      console.log('⚠️ AI analysis not available, using fallback scenario generation')
      analysisMethod = 'synthetic'
      
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
          tags: JSON.stringify(['synthetic', analysisMethod, type]),
          is_approved: false
        })
      }
    }
    
    // Insert scenarios into database
    console.log('💾 Inserting', scenarios.length, 'scenarios into database...')
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('video_scenarios')
      .insert(scenarios)
      .select()
    
    if (insertError) {
      console.error('❌ Database insert error:', insertError)
      throw insertError
    }
    
    console.log('✅ Successfully created', inserted.length, 'scenarios using', analysisMethod)
    
    return NextResponse.json({
      success: true,
      message: `Scenarios generated using ${analysisMethod}`,
      scenariosCreated: inserted.length,
      analysisMethod,
      videoUrl: videoUrl ? 'Available' : 'Not available',
      scenarios: inserted
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

// AWS Rekognition Video Analysis
async function analyzeVideoWithAWS(videoUrl, submission) {
  try {
    console.log('🅰️ Starting AWS Rekognition analysis...')
    
    // Import AWS Rekognition module
    const { analyzeVideoScenarios } = await import('@/lib/awsRekognition')
    
    const scenarios = await analyzeVideoScenarios(videoUrl, {
      submissionId: submission.id,
      filename: submission.original_filename,
      duration: submission.duration_seconds || 60
    })
    
    console.log('🅰️ AWS analysis result:', scenarios?.length || 0, 'scenarios')
    return scenarios || []
    
  } catch (error) {
    console.error('🅰️ AWS Rekognition error:', error)
    throw error
  }
}

// Google Video Intelligence Analysis  
async function analyzeVideoWithGoogle(videoUrl, submission) {
  try {
    console.log('🅶 Starting Google Video Intelligence analysis...')
    
    // Import Google Video Intelligence module
    const { analyzeVideoScenarios } = await import('@/lib/googleVideoIntelligence')
    
    const scenarios = await analyzeVideoScenarios(videoUrl, {
      submissionId: submission.id,
      filename: submission.original_filename,
      duration: submission.duration_seconds || 60
    })
    
    console.log('🅶 Google analysis result:', scenarios?.length || 0, 'scenarios')
    return scenarios || []
    
  } catch (error) {
    console.error('🅶 Google Video Intelligence error:', error)
    throw error
  }
}