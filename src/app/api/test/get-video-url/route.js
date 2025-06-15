import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { submissionId } = await request.json()
    
    // Get submission
    const { data: submission, error } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()
    
    if (error || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    
    if (!submission.raw_video_path) {
      return NextResponse.json({ error: 'No video path' }, { status: 400 })
    }
    
    // Create fresh signed URL (1 hour expiry)
    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from('dashcam-videos')
      .createSignedUrl(submission.raw_video_path, 3600)
    
    if (urlError) {
      return NextResponse.json({ error: urlError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      videoUrl: signedUrlData.signedUrl,
      path: submission.raw_video_path,
      size: submission.raw_video_size_bytes,
      filename: submission.original_filename
    })
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}