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
    
    console.log('🔍 Testing video URL accessibility...')
    
    const results = {}
    
    // Test Mux URL
    if (submission.mux_playback_id) {
      const muxUrl = `https://stream.mux.com/${submission.mux_playback_id}.mp4`
      console.log('🎬 Testing Mux URL:', muxUrl)
      
      try {
        const response = await fetch(muxUrl, { method: 'HEAD' })
        results.mux = {
          url: muxUrl,
          accessible: response.ok,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      } catch (error) {
        results.mux = {
          url: muxUrl,
          accessible: false,
          error: error.message
        }
      }
    }
    
    // Test Supabase URL
    if (submission.raw_video_path) {
      console.log('💾 Testing Supabase URL for path:', submission.raw_video_path)
      
      try {
        const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
          .from('dashcam-videos')
          .createSignedUrl(submission.raw_video_path, 60) // 1 minute for testing
        
        if (urlError) {
          results.supabase = {
            path: submission.raw_video_path,
            accessible: false,
            error: urlError.message
          }
        } else if (signedUrlData?.signedUrl) {
          const supabaseUrl = signedUrlData.signedUrl
          
          try {
            const response = await fetch(supabaseUrl, { method: 'HEAD' })
            results.supabase = {
              path: submission.raw_video_path,
              url: supabaseUrl.substring(0, 100) + '...',
              accessible: response.ok,
              status: response.status,
              contentLength: response.headers.get('content-length'),
              contentType: response.headers.get('content-type')
            }
          } catch (fetchError) {
            results.supabase = {
              path: submission.raw_video_path,
              url: supabaseUrl.substring(0, 100) + '...',
              accessible: false,
              error: fetchError.message
            }
          }
        }
      } catch (error) {
        results.supabase = {
          path: submission.raw_video_path,
          accessible: false,
          error: error.message
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        filename: submission.original_filename,
        muxPlaybackId: submission.mux_playback_id,
        rawVideoPath: submission.raw_video_path
      },
      videoUrls: results
    })
    
  } catch (error) {
    console.error('Video URL test error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}