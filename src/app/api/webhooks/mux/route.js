import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/mux'
import { supabaseAdmin } from '@/lib/supabase'
import { anonymizeVideo, analyzeVideoContent, extractScenarios, calculateEarnings } from '@/lib/sightengine'

export async function POST(request) {
  try {
    console.log('🔔 Mux webhook received!')
    const body = await request.text()
    const signature = request.headers.get('mux-signature')
    
    console.log('📦 Webhook body length:', body.length)
    console.log('🔐 Signature present:', !!signature)

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, process.env.MUX_WEBHOOK_SECRET)) {
      console.error('❌ Invalid Mux webhook signature')
      console.log('Expected signature verification failed')
      console.log('Webhook secret present:', !!process.env.MUX_WEBHOOK_SECRET)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    console.log('✅ Mux webhook event verified:', event.type, event.object?.id)
    console.log('📄 Full event:', JSON.stringify(event, null, 2))

    switch (event.type) {
      case 'video.upload.asset_created':
        await handleUploadCompleted(event)
        break
      
      case 'video.asset.ready':
        await handleAssetReady(event)
        break
      
      case 'video.asset.errored':
        await handleAssetError(event)
        break
      
      case 'video.upload.cancelled':
      case 'video.upload.errored':
        await handleUploadError(event)
        break
      
      default:
        console.log('Unhandled Mux webhook event:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Mux webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleUploadCompleted(event) {
  try {
    console.log('🎬 Processing upload completed event')
    const uploadId = event.object.id
    const assetId = event.data.asset_id

    console.log('🔍 Looking for submission with upload ID:', uploadId)

    // Find submission by upload ID
    const { data: submission, error } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('mux_upload_id', uploadId)
      .single()

    if (error || !submission) {
      console.error('❌ Could not find submission for upload:', uploadId)
      console.error('Database error:', error)
      
      // Try to find any recent submissions for debugging
      const { data: recentSubmissions } = await supabaseAdmin
        .from('video_submissions')
        .select('id, mux_upload_id, original_filename, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('📋 Recent submissions:', recentSubmissions)
      return
    }

    console.log('✅ Found submission:', submission.id, submission.original_filename)

    // Update submission with asset ID
    const { error: updateError } = await supabaseAdmin
      .from('video_submissions')
      .update({
        mux_asset_id: assetId,
        upload_status: 'processing'
      })
      .eq('id', submission.id)

    if (updateError) {
      console.error('❌ Failed to update submission:', updateError)
    } else {
      console.log(`✅ Upload completed for submission ${submission.id}, asset: ${assetId}`)
    }

  } catch (error) {
    console.error('💥 Error handling upload completion:', error)
  }
}

async function handleAssetReady(event) {
  try {
    const asset = event.object
    const assetId = asset.id

    // Find submission by asset ID
    const { data: submission, error } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('mux_asset_id', assetId)
      .single()

    if (error || !submission) {
      console.error('Could not find submission for asset:', assetId)
      return
    }

    // Update submission with playback info and duration
    const playbackId = asset.playback_ids?.[0]?.id
    const duration = asset.duration

    await supabaseAdmin
      .from('video_submissions')
      .update({
        mux_playback_id: playbackId,
        duration_seconds: duration,
        upload_status: 'ready'
      })
      .eq('id', submission.id)

    console.log(`Asset ready for submission ${submission.id}, playback: ${playbackId}`)

    // Start video processing pipeline
    if (playbackId) {
      await processVideo(submission, playbackId, duration)
    }

  } catch (error) {
    console.error('Error handling asset ready:', error)
  }
}

async function handleAssetError(event) {
  try {
    const assetId = event.object.id
    const errors = event.object.errors

    // Find submission by asset ID
    const { data: submission, error } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('mux_asset_id', assetId)
      .single()

    if (error || !submission) {
      console.error('Could not find submission for asset:', assetId)
      return
    }

    // Update submission with error status
    await supabaseAdmin
      .from('video_submissions')
      .update({
        upload_status: 'failed',
        processing_notes: `Asset processing failed: ${JSON.stringify(errors)}`
      })
      .eq('id', submission.id)

    console.log(`Asset failed for submission ${submission.id}:`, errors)

  } catch (error) {
    console.error('Error handling asset error:', error)
  }
}

async function handleUploadError(event) {
  try {
    const uploadId = event.object.id
    const error = event.object.error

    // Find submission by upload ID
    const { data: submission, error: dbError } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('mux_upload_id', uploadId)
      .single()

    if (dbError || !submission) {
      console.error('Could not find submission for upload:', uploadId)
      return
    }

    // Update submission with error status
    await supabaseAdmin
      .from('video_submissions')
      .update({
        upload_status: 'failed',
        processing_notes: `Upload failed: ${error?.message || 'Unknown error'}`
      })
      .eq('id', submission.id)

    console.log(`Upload failed for submission ${submission.id}:`, error)

  } catch (error) {
    console.error('Error handling upload error:', error)
  }
}

async function processVideo(submission, playbackId, duration) {
  try {
    // Generate video URL for processing
    const videoUrl = `https://stream.mux.com/${playbackId}.mp4`
    
    // Start anonymization and analysis in parallel
    const [anonymizationResult, analysisResult] = await Promise.allSettled([
      anonymizeVideo(videoUrl, {
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/sightengine`
      }),
      analyzeVideoContent(videoUrl)
    ])

    // Handle anonymization result
    if (anonymizationResult.status === 'fulfilled') {
      await supabaseAdmin
        .from('video_submissions')
        .update({
          sightengine_job_id: anonymizationResult.value.job_id,
          upload_status: 'anonymizing'
        })
        .eq('id', submission.id)
    } else {
      console.error('Anonymization failed:', anonymizationResult.reason)
    }

    // Handle analysis result and extract scenarios
    if (analysisResult.status === 'fulfilled') {
      const scenarios = extractScenarios(analysisResult.value)
      
      if (scenarios.length > 0) {
        // Insert scenarios
        const scenarioRecords = scenarios.map(scenario => ({
          video_submission_id: submission.id,
          scenario_type: scenario.type,
          start_time_seconds: Math.max(0, scenario.timestamp - 5),
          end_time_seconds: Math.min(duration || 60, scenario.timestamp + 5),
          confidence_score: scenario.confidence,
          tags: JSON.stringify(scenario.details),
          is_approved: false
        }))

        await supabaseAdmin
          .from('video_scenarios')
          .insert(scenarioRecords)
      }

      // Calculate and record earnings
      const earnings = calculateEarnings(duration || 0, scenarios)
      
      await supabaseAdmin
        .from('driver_earnings')
        .insert([{
          driver_id: submission.driver_id,
          video_submission_id: submission.id,
          amount: earnings,
          earning_type: 'footage_contribution',
          payment_status: 'pending'
        }])

      // Update driver's total earnings
      const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('monthly_earnings, total_footage_contributed')
        .eq('id', submission.driver_id)
        .single()

      if (currentProfile) {
        const minutes = Math.max(1, Math.round((duration || 0) / 60))
        await supabaseAdmin
          .from('profiles')
          .update({
            monthly_earnings: (currentProfile.monthly_earnings || 0) + earnings,
            total_footage_contributed: (currentProfile.total_footage_contributed || 0) + minutes
          })
          .eq('id', submission.driver_id)
      }

      console.log(`Video processing completed for submission ${submission.id}, earnings: $${earnings}`)
    }

  } catch (error) {
    console.error('Error in video processing pipeline:', error)
    
    // Update submission with error
    await supabaseAdmin
      .from('video_submissions')
      .update({
        upload_status: 'failed',
        processing_notes: `Processing pipeline failed: ${error.message}`
      })
      .eq('id', submission.id)
  }
}