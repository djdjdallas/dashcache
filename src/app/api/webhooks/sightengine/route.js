import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('SightEngine webhook event:', body)

    // SightEngine sends the job status and results
    const { job_id, status, output_url, error } = body

    if (!job_id) {
      console.error('No job_id in SightEngine webhook')
      return NextResponse.json(
        { error: 'Missing job_id' },
        { status: 400 }
      )
    }

    // Find submission by SightEngine job ID
    const { data: submission, error: dbError } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('sightengine_job_id', job_id)
      .single()

    if (dbError || !submission) {
      console.error('Could not find submission for SightEngine job:', job_id)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    switch (status) {
      case 'completed':
        await handleAnonymizationCompleted(submission, output_url)
        break
      
      case 'failed':
        await handleAnonymizationFailed(submission, error)
        break
      
      case 'processing':
        // Update status to show anonymization is in progress
        await supabaseAdmin
          .from('video_submissions')
          .update({
            upload_status: 'anonymizing',
            processing_notes: 'Video anonymization in progress'
          })
          .eq('id', submission.id)
        break
      
      default:
        console.log('Unhandled SightEngine status:', status)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('SightEngine webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleAnonymizationCompleted(submission, outputUrl) {
  try {
    // Update submission with anonymized video URL
    await supabaseAdmin
      .from('video_submissions')
      .update({
        is_anonymized: true,
        anonymized_video_url: outputUrl,
        upload_status: 'completed',
        processing_notes: 'Video successfully anonymized'
      })
      .eq('id', submission.id)

    console.log(`Anonymization completed for submission ${submission.id}`)

    // Notify the driver that their video is ready
    await notifyDriverVideoReady(submission)

  } catch (error) {
    console.error('Error handling anonymization completion:', error)
  }
}

async function handleAnonymizationFailed(submission, error) {
  try {
    // Update submission with failure status
    await supabaseAdmin
      .from('video_submissions')
      .update({
        upload_status: 'failed',
        processing_notes: `Anonymization failed: ${error?.message || 'Unknown error'}`
      })
      .eq('id', submission.id)

    console.log(`Anonymization failed for submission ${submission.id}:`, error)

  } catch (error) {
    console.error('Error handling anonymization failure:', error)
  }
}

async function notifyDriverVideoReady(submission) {
  try {
    // Here you could implement various notification methods:
    // 1. Email notification
    // 2. In-app notification
    // 3. Push notification
    // 4. SMS notification

    // For now, let's create a simple notification record
    await supabaseAdmin
      .from('notifications')
      .insert([{
        user_id: submission.driver_id,
        type: 'video_processed',
        title: 'Video Processing Complete',
        message: `Your video "${submission.original_filename}" has been successfully processed and is now available for sale.`,
        metadata: JSON.stringify({
          submission_id: submission.id,
          filename: submission.original_filename
        }),
        is_read: false
      }])

    console.log(`Notification created for driver ${submission.driver_id}`)

  } catch (error) {
    console.error('Error creating notification:', error)
  }
}