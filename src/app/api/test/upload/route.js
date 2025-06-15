import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createUploadUrl } from '@/lib/mux'

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('Test upload request:', body)

    // Test 1: Try creating submission record with current schema
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('video_submissions')
      .insert([{
        driver_id: body.userId || 'test-user-id',
        original_filename: body.filename || 'test.mp4',
        upload_status: 'pending',
        file_size_mb: Math.round((body.fileSize || 1000000) / (1024 * 1024) * 100) / 100
      }])
      .select()
      .single()

    // Test 2: Try creating Mux upload URL
    let muxResult = null
    try {
      const { uploadUrl, uploadId } = await createUploadUrl(process.env.NEXT_PUBLIC_SITE_URL)
      muxResult = { success: true, uploadId, hasUrl: !!uploadUrl }
    } catch (muxError) {
      muxResult = { success: false, error: muxError.message }
    }

    return NextResponse.json({
      success: true,
      tests: {
        database: {
          submissionCreated: !submissionError,
          submissionId: submission?.id,
          error: submissionError?.message
        },
        mux: muxResult,
        request: body
      }
    })

  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Send POST with userId, filename, fileSize to test upload flow' 
  })
}