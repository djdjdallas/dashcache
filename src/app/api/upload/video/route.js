import { NextRequest, NextResponse } from 'next/server'
import mux from '@/lib/mux'
import { supabaseAdmin } from '@/lib/supabase'
import { anonymizeVideo } from '@/lib/sightengine'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video')
    const userId = formData.get('userId')
    const filename = formData.get('filename')

    if (!videoFile || !userId || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!videoFile.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'File must be a video' },
        { status: 400 }
      )
    }

    // Create video submission record
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('video_submissions')
      .insert([{
        driver_id: userId,
        original_filename: filename,
        upload_status: 'uploading',
        file_size_mb: Math.round(videoFile.size / (1024 * 1024) * 100) / 100
      }])
      .select()
      .single()

    if (submissionError) {
      console.error('Error creating submission:', submissionError)
      return NextResponse.json(
        { error: 'Failed to create submission record' },
        { status: 500 }
      )
    }

    // Convert File to buffer for Mux upload
    const arrayBuffer = await videoFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    try {
      // Create Mux asset
      const asset = await mux.video.assets.create({
        input: [{
          url: `data:${videoFile.type};base64,${buffer.toString('base64')}`
        }],
        playback_policy: ['public'],
        test: process.env.NODE_ENV !== 'production'
      })

      // Update submission with Mux asset info
      const { error: updateError } = await supabaseAdmin
        .from('video_submissions')
        .update({
          mux_asset_id: asset.id,
          mux_playback_id: asset.playback_ids?.[0]?.id,
          upload_status: 'processing'
        })
        .eq('id', submission.id)

      if (updateError) {
        console.error('Error updating submission:', updateError)
      }

      // Start anonymization process in background
      if (asset.playback_ids?.[0]?.id) {
        const videoUrl = `https://stream.mux.com/${asset.playback_ids[0].id}.m3u8`
        
        // Note: In production, this should be done via a queue/background job
        anonymizeVideo(videoUrl)
          .then(async (anonymizationResult) => {
            // Update submission with anonymization info
            await supabaseAdmin
              .from('video_submissions')
              .update({
                is_anonymized: true,
                sightengine_job_id: anonymizationResult.job_id,
                upload_status: 'completed'
              })
              .eq('id', submission.id)
              
            // Extract scenarios (simplified - in production use proper AI)
            await extractScenarios(submission.id, asset)
            
            // Calculate and create driver earnings
            await calculateEarnings(userId, submission.id, asset.duration || 0)
          })
          .catch(async (error) => {
            console.error('Anonymization failed:', error)
            await supabaseAdmin
              .from('video_submissions')
              .update({
                upload_status: 'failed',
                processing_notes: error.message
              })
              .eq('id', submission.id)
          })
      }

      return NextResponse.json({
        success: true,
        submissionId: submission.id,
        muxAssetId: asset.id
      })

    } catch (muxError) {
      console.error('Mux upload failed:', muxError)
      
      // Update submission status to failed
      await supabaseAdmin
        .from('video_submissions')
        .update({
          upload_status: 'failed',
          processing_notes: muxError.message
        })
        .eq('id', submission.id)

      return NextResponse.json(
        { error: 'Video processing failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function extractScenarios(submissionId, asset) {
  // Simplified scenario extraction - in production, use proper AI/ML
  const scenarios = [
    {
      video_submission_id: submissionId,
      scenario_type: 'general_driving',
      start_time_seconds: 0,
      end_time_seconds: asset.duration || 60,
      confidence_score: 0.8,
      tags: ['urban', 'daytime'],
      is_approved: false
    }
  ]

  await supabaseAdmin
    .from('video_scenarios')
    .insert(scenarios)
}

async function calculateEarnings(driverId, submissionId, duration) {
  // Calculate earnings: $0.50-$2.00 per minute based on quality/scenarios
  const minutes = Math.max(1, Math.round(duration / 60))
  const ratePerMinute = 0.75 // Base rate
  const amount = minutes * ratePerMinute

  await supabaseAdmin
    .from('driver_earnings')
    .insert([{
      driver_id: driverId,
      video_submission_id: submissionId,
      amount: amount,
      earning_type: 'footage_contribution',
      payment_status: 'pending'
    }])

  // Update driver's total earnings
  const { data: currentProfile } = await supabaseAdmin
    .from('profiles')
    .select('monthly_earnings, total_footage_contributed')
    .eq('id', driverId)
    .single()

  if (currentProfile) {
    await supabaseAdmin
      .from('profiles')
      .update({
        monthly_earnings: (currentProfile.monthly_earnings || 0) + amount,
        total_footage_contributed: (currentProfile.total_footage_contributed || 0) + minutes
      })
      .eq('id', driverId)
  }
}