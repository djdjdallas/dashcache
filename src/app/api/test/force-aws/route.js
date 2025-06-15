import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
    
    console.log('🅰️ Testing AWS Rekognition directly...')
    
    // Get video URL
    let videoUrl = null
    if (submission.mux_playback_id) {
      videoUrl = `https://stream.mux.com/${submission.mux_playback_id}.mp4`
    } else if (submission.raw_video_path) {
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from('dashcam-videos')
        .createSignedUrl(submission.raw_video_path, 3600)
      
      if (signedUrlData?.signedUrl) {
        videoUrl = signedUrlData.signedUrl
      }
    }
    
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'No video URL available' },
        { status: 400 }
      )
    }
    
    console.log('🎬 Video URL:', videoUrl.substring(0, 100) + '...')
    
    // Try AWS Rekognition directly
    try {
      const { analyzeVideoScenarios } = await import('@/lib/awsRekognition')
      
      const scenarios = await analyzeVideoScenarios(videoUrl, {
        submissionId: submission.id,
        filename: submission.original_filename,
        duration: submission.duration_seconds || 60
      })
      
      return NextResponse.json({
        success: true,
        method: 'aws_rekognition_direct',
        scenariosGenerated: scenarios.length,
        videoUrl: videoUrl.substring(0, 100) + '...',
        scenarios: scenarios.slice(0, 3) // First 3 for preview
      })
      
    } catch (awsError) {
      console.error('AWS test failed:', awsError)
      
      return NextResponse.json({
        success: false,
        method: 'aws_rekognition_direct',
        error: awsError.message,
        videoUrl: videoUrl.substring(0, 100) + '...'
      })
    }
    
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}