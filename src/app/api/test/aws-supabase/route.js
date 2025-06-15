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
    
    console.log('🅰️ Testing AWS with Supabase video...')
    
    if (!submission.raw_video_path) {
      return NextResponse.json(
        { error: 'No Supabase video path available' },
        { status: 400 }
      )
    }
    
    // Get Supabase signed URL
    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from('dashcam-videos')
      .createSignedUrl(submission.raw_video_path, 3600)
    
    if (urlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: 'Failed to get video URL' },
        { status: 400 }
      )
    }
    
    const videoUrl = signedUrlData.signedUrl
    console.log('💾 Using Supabase video URL:', videoUrl.substring(0, 100) + '...')
    
    // Try AWS Rekognition
    try {
      const { analyzeVideoScenarios } = await import('@/lib/awsRekognition')
      
      const startTime = Date.now()
      console.log('⏱️ Starting AWS analysis...')
      
      const scenarios = await analyzeVideoScenarios(videoUrl, {
        submissionId: submission.id,
        filename: submission.original_filename,
        duration: submission.duration_seconds || 60
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log('✅ AWS analysis complete in', duration, 'ms')
      
      return NextResponse.json({
        success: true,
        method: 'aws_rekognition_supabase',
        analysisTime: duration,
        videoUrl: videoUrl.substring(0, 100) + '...',
        videoSize: '10.8MB',
        scenariosGenerated: scenarios.length,
        scenarios: scenarios.slice(0, 2), // First 2 for preview
        allScenarios: scenarios.map(s => ({
          type: s.scenario_type,
          confidence: s.confidence_score,
          tags: JSON.parse(s.tags)
        }))
      })
      
    } catch (awsError) {
      console.error('❌ AWS analysis failed:', awsError)
      
      return NextResponse.json({
        success: false,
        method: 'aws_rekognition_supabase', 
        error: awsError.message,
        stack: awsError.stack?.split('\n').slice(0, 5),
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