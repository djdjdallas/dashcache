import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/mux'
import { supabaseAdmin } from '@/lib/supabase'
import { anonymizeVideo, calculateEarnings } from '@/lib/sightengine'

// Helper function to log webhook errors
async function logWebhookError(service, errorData) {
  try {
    await supabaseAdmin
      .from('webhook_logs')
      .insert([{
        service,
        event_type: 'error',
        error_message: errorData.error,
        error_details: JSON.stringify(errorData),
        created_at: new Date().toISOString()
      }])
  } catch (logError) {
    console.error('Failed to log webhook error:', logError)
  }
}

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
      // Upload Events
      case 'video.upload.created':
        console.log('📤 Upload created:', event.object?.id)
        await handleUploadCreated(event)
        break
        
      case 'video.upload.asset_created':
        await handleUploadCompleted(event)
        break
      
      case 'video.upload.cancelled':
      case 'video.upload.errored':
        await handleUploadError(event)
        break
      
      // Asset Events
      case 'video.asset.created':
        console.log('🎬 Asset created:', event.object?.id)
        await handleAssetCreated(event)
        break
        
      case 'video.asset.ready':
        await handleAssetReady(event)
        break
      
      case 'video.asset.updated':
        console.log('🔄 Asset updated:', event.object?.id)
        await handleAssetUpdated(event)
        break
        
      case 'video.asset.errored':
        await handleAssetError(event)
        break
        
      case 'video.asset.deleted':
        console.log('🗑️ Asset deleted:', event.object?.id)
        await handleAssetDeleted(event)
        break
      
      // Track Events (for subtitles, audio tracks, etc.)
      case 'video.asset.track.created':
      case 'video.asset.track.ready':
      case 'video.asset.track.errored':
      case 'video.asset.track.deleted':
        console.log('🎵 Track event:', event.type, event.object?.id)
        // Track events can be handled if needed for subtitles
        break
      
      // Static Renditions Events (for downloadable MP4s)
      case 'video.asset.static_renditions.ready':
      case 'video.asset.static_renditions.preparing':
      case 'video.asset.static_renditions.deleted':
      case 'video.asset.static_renditions.errored':
        console.log('📦 Static renditions event:', event.type)
        // Handle if you want to offer MP4 downloads
        break
        
      // Master Access Events
      case 'video.asset.master.ready':
      case 'video.asset.master.preparing':
      case 'video.asset.master.deleted':
      case 'video.asset.master.errored':
        console.log('🎞️ Master access event:', event.type)
        // Handle if you want to offer original file downloads
        break
      
      // Warning Events
      case 'video.asset.warning':
        console.warn('⚠️ Asset warning:', event.data)
        await handleAssetWarning(event)
        break
      
      default:
        console.log('📨 Unhandled Mux webhook event:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('💥 Mux webhook error:', error)
    
    // Log detailed error information
    await logWebhookError('mux', {
      error: error.message,
      stack: error.stack,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString()
    })
    
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
    console.log('🎥 ASSET READY EVENT RECEIVED!')
    const asset = event.object
    const assetId = asset.id
    
    console.log('📊 Asset details:', {
      id: assetId,
      status: asset.status,
      duration: asset.duration,
      playbackIds: asset.playback_ids?.length || 0
    })

    // Find submission by asset ID
    const { data: submission, error } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('mux_asset_id', assetId)
      .single()

    if (error || !submission) {
      console.error('❌ Could not find submission for asset:', assetId)
      console.error('Database error:', error)
      
      // Debug: Check if asset ID exists in any submission
      const { data: allSubmissions } = await supabaseAdmin
        .from('video_submissions')
        .select('id, mux_asset_id, mux_upload_id, original_filename')
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('📋 Recent submissions for debugging:', allSubmissions)
      return
    }

    console.log('✅ Found submission for asset ready:', submission.id, submission.original_filename)

    // Update submission with playback info and duration
    const playbackId = asset.playback_ids?.[0]?.id
    const duration = asset.duration

    const { error: updateError } = await supabaseAdmin
      .from('video_submissions')
      .update({
        mux_playback_id: playbackId,
        duration_seconds: duration,
        upload_status: 'ready'
      })
      .eq('id', submission.id)

    if (updateError) {
      console.error('❌ Failed to update submission:', updateError)
      return
    }

    console.log(`✅ Asset ready for submission ${submission.id}, playback: ${playbackId}, duration: ${duration}s`)

    // Start video processing pipeline
    if (playbackId) {
      console.log('🚀 Starting video processing pipeline...')
      await processVideo(submission, playbackId, duration)
    } else {
      console.error('⚠️ No playback ID available, skipping video processing')
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

async function handleUploadCreated(event) {
  try {
    console.log('📝 Recording upload creation')
    const uploadId = event.object.id
    
    // Log webhook event for debugging
    await supabaseAdmin
      .from('webhook_logs')
      .insert([{
        service: 'mux',
        event_type: event.type,
        event_id: event.id,
        event_data: JSON.stringify(event),
        created_at: new Date().toISOString()
      }])
    
  } catch (error) {
    console.error('Error handling upload created:', error)
  }
}

async function handleAssetCreated(event) {
  try {
    console.log('🎬 Processing asset created event')
    const asset = event.object
    const uploadId = event.data?.upload_id
    
    if (uploadId) {
      // Find submission by upload ID
      const { data: submission } = await supabaseAdmin
        .from('video_submissions')
        .select('*')
        .eq('mux_upload_id', uploadId)
        .single()
      
      if (submission && !submission.mux_asset_id) {
        // Update with asset ID
        await supabaseAdmin
          .from('video_submissions')
          .update({
            mux_asset_id: asset.id,
            upload_status: 'processing'
          })
          .eq('id', submission.id)
          
        console.log(`✅ Linked asset ${asset.id} to submission ${submission.id}`)
      }
    }
  } catch (error) {
    console.error('Error handling asset created:', error)
  }
}

async function handleAssetUpdated(event) {
  try {
    const asset = event.object
    console.log('🔄 Asset updated:', asset.id, 'Status:', asset.status)
    
    // Update submission if status changed
    const { data: submission } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('mux_asset_id', asset.id)
      .single()
    
    if (submission) {
      let updates = {}
      
      // Update playback ID if available
      if (asset.playback_ids?.[0]?.id && !submission.mux_playback_id) {
        updates.mux_playback_id = asset.playback_ids[0].id
      }
      
      // Update duration if available
      if (asset.duration && !submission.duration_seconds) {
        updates.duration_seconds = asset.duration
      }
      
      if (Object.keys(updates).length > 0) {
        await supabaseAdmin
          .from('video_submissions')
          .update(updates)
          .eq('id', submission.id)
          
        console.log(`✅ Updated submission ${submission.id}:`, updates)
      }
    }
  } catch (error) {
    console.error('Error handling asset updated:', error)
  }
}

async function handleAssetDeleted(event) {
  try {
    const assetId = event.object.id
    console.log('🗑️ Processing asset deletion:', assetId)
    
    // Update submission status
    await supabaseAdmin
      .from('video_submissions')
      .update({
        upload_status: 'deleted',
        processing_notes: 'Asset was deleted from Mux'
      })
      .eq('mux_asset_id', assetId)
      
  } catch (error) {
    console.error('Error handling asset deleted:', error)
  }
}

async function handleAssetWarning(event) {
  try {
    const assetId = event.object.id
    const warning = event.data
    
    console.warn('⚠️ Asset warning received:', assetId, warning)
    
    // Log warning but don't fail the video
    await supabaseAdmin
      .from('video_submissions')
      .update({
        processing_notes: `Warning: ${JSON.stringify(warning)}`
      })
      .eq('mux_asset_id', assetId)
      
  } catch (error) {
    console.error('Error handling asset warning:', error)
  }
}

// Generate synthetic scenarios for testing/demo purposes
async function generateSyntheticScenarios(submission, duration) {
  const scenarios = []
  const durationInSeconds = duration || 60
  
  // Define scenario types with their typical frequency
  const scenarioTypes = [
    { type: 'intersection_turn', frequency: 0.3, avgDuration: 15 },
    { type: 'pedestrian_crossing', frequency: 0.2, avgDuration: 10 },
    { type: 'highway_merging', frequency: 0.15, avgDuration: 20 },
    { type: 'parking', frequency: 0.1, avgDuration: 30 },
    { type: 'weather_driving', frequency: 0.05, avgDuration: 60 }
  ]
  
  let currentTime = 0
  
  // Generate scenarios throughout the video
  while (currentTime < durationInSeconds) {
    // Randomly pick a scenario type
    const random = Math.random()
    let cumulativeFreq = 0
    
    for (const scenarioType of scenarioTypes) {
      cumulativeFreq += scenarioType.frequency
      
      if (random < cumulativeFreq) {
        const startTime = currentTime
        const duration = Math.min(
          scenarioType.avgDuration + (Math.random() * 10 - 5), // Add some variance
          durationInSeconds - currentTime
        )
        const endTime = startTime + duration
        
        scenarios.push({
          type: scenarioType.type,
          start_time: Math.round(startTime),
          end_time: Math.round(endTime),
          confidence: 0.7 + Math.random() * 0.25, // 0.7 to 0.95
          tags: generateScenarioTags(scenarioType.type),
          metadata: {
            synthetic: true,
            filename: submission.original_filename
          }
        })
        
        currentTime = endTime + (Math.random() * 20 + 10) // Gap between scenarios
        break
      }
    }
    
    // If no scenario was selected, advance time
    if (scenarios.length === 0 || scenarios[scenarios.length - 1].end_time < currentTime) {
      currentTime += 30
    }
  }
  
  return scenarios
}

// Generate relevant tags for each scenario type
function generateScenarioTags(scenarioType) {
  const tagMap = {
    'intersection_turn': ['traffic_light', 'left_turn', 'multiple_vehicles'],
    'pedestrian_crossing': ['crosswalk', 'pedestrian_present', 'urban'],
    'highway_merging': ['highway', 'lane_change', 'high_speed'],
    'parking': ['parallel_parking', 'urban', 'tight_space'],
    'weather_driving': ['rain', 'reduced_visibility', 'wet_road']
  }
  
  return tagMap[scenarioType] || ['general_driving']
}

async function processVideo(submission, playbackId, duration) {
  try {
    // Generate video URL for processing
    const videoUrl = `https://stream.mux.com/${playbackId}.mp4`
    
    console.log('🎯 Starting video processing for submission:', submission.id)
    
    // For now, we'll create synthetic scenarios based on video metadata
    // In production, you'd use a proper AI service for video analysis
    const scenarios = await generateSyntheticScenarios(submission, duration)
    
    console.log(`📊 Generated ${scenarios.length} scenarios for video`)
    
    if (scenarios.length > 0) {
      // Insert scenarios
      const scenarioRecords = scenarios.map(scenario => ({
        video_submission_id: submission.id,
        scenario_type: scenario.type,
        start_time_seconds: scenario.start_time,
        end_time_seconds: scenario.end_time,
        confidence_score: scenario.confidence,
        tags: JSON.stringify(scenario.tags),
        is_approved: false
      }))

      const { data: insertedScenarios, error: insertError } = await supabaseAdmin
        .from('video_scenarios')
        .insert(scenarioRecords)
        .select()

      if (insertError) {
        console.error('❌ Error inserting scenarios:', insertError)
      } else {
        console.log(`✅ Inserted ${insertedScenarios.length} scenarios`)
      }
    }
    
    // Start anonymization separately
    try {
      const anonymizationResult = await anonymizeVideo(videoUrl, {
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/sightengine`
      })
      
      if (anonymizationResult.job_id) {
        await supabaseAdmin
          .from('video_submissions')
          .update({
            sightengine_job_id: anonymizationResult.job_id,
            upload_status: 'anonymizing'
          })
          .eq('id', submission.id)
        
        console.log('🔄 Anonymization started with job ID:', anonymizationResult.job_id)
      }
    } catch (anonError) {
      console.error('⚠️ Anonymization failed (non-fatal):', anonError.message)
      // Don't fail the entire process if anonymization fails
      // Mark as completed without anonymization
      await supabaseAdmin
        .from('video_submissions')
        .update({
          upload_status: 'completed',
          processing_notes: 'Completed without anonymization'
        })
        .eq('id', submission.id)
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

    console.log(`✅ Video processing completed for submission ${submission.id}, earnings: $${earnings}`)

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