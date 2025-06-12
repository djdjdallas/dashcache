import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Development-only endpoint to manually sync with Mux
export async function POST(request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const { submissionId, assetId, playbackId, duration } = await request.json()

    if (!submissionId || !assetId) {
      return NextResponse.json(
        { error: 'submissionId and assetId are required' },
        { status: 400 }
      )
    }

    // Update the submission with Mux data
    const { data, error } = await supabaseAdmin
      .from('video_submissions')
      .update({
        mux_asset_id: assetId,
        mux_playback_id: playbackId,
        upload_status: 'ready',
        duration_seconds: duration,
        processing_notes: 'Manually synced with Mux (development)'
      })
      .eq('id', submissionId)
      .select()
      .single()

    if (error) {
      console.error('Error syncing submission:', error)
      return NextResponse.json(
        { error: 'Failed to sync submission' },
        { status: 500 }
      )
    }

    console.log(`✅ Manually synced submission ${submissionId} with Mux asset ${assetId}`)

    return NextResponse.json({
      success: true,
      message: 'Submission synced successfully',
      submission: data
    })

  } catch (error) {
    console.error('Manual sync error:', error)
    return NextResponse.json(
      { error: 'Failed to process sync request' },
      { status: 500 }
    )
  }
}

// GET endpoint to list failed uploads that might need syncing
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const { data: failedUploads, error } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('upload_status', 'failed')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching failed uploads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch uploads' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      failedUploads: failedUploads.map(upload => ({
        id: upload.id,
        filename: upload.original_filename,
        createdAt: upload.created_at,
        processingNotes: upload.processing_notes,
        muxUploadId: upload.mux_upload_id
      }))
    })

  } catch (error) {
    console.error('Error listing failed uploads:', error)
    return NextResponse.json(
      { error: 'Failed to list uploads' },
      { status: 500 }
    )
  }
}