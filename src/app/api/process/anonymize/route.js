import { NextResponse } from 'next/server'
import { anonymizeVideo, checkModerationStatus } from '@/lib/sightengine'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { videoUrl, submissionId } = await request.json()

    if (!videoUrl || !submissionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Start anonymization process
    const result = await anonymizeVideo(videoUrl)

    // Update submission with job ID
    const { error: updateError } = await supabaseAdmin
      .from('video_submissions')
      .update({
        sightengine_job_id: result.job_id,
        upload_status: 'processing'
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Error updating submission:', updateError)
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      jobId: result.job_id
    })

  } catch (error) {
    console.error('Anonymization error:', error)
    return NextResponse.json(
      { error: 'Anonymization failed' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const submissionId = searchParams.get('submissionId')

    if (!jobId || !submissionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check status with SightEngine
    const status = await checkModerationStatus(jobId)

    if (status.status === 'completed') {
      // Update submission as completed
      const { error: updateError } = await supabaseAdmin
        .from('video_submissions')
        .update({
          is_anonymized: true,
          upload_status: 'completed'
        })
        .eq('id', submissionId)

      if (updateError) {
        console.error('Error updating submission:', updateError)
      }
    } else if (status.status === 'failed') {
      // Update submission as failed
      await supabaseAdmin
        .from('video_submissions')
        .update({
          upload_status: 'failed',
          processing_notes: 'Anonymization failed'
        })
        .eq('id', submissionId)
    }

    return NextResponse.json({
      status: status.status,
      progress: status.progress || 0
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
}