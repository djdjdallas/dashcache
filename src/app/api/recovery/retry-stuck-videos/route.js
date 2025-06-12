import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAssetInfo } from '@/lib/mux'
import { checkProcessingStatus } from '@/lib/sightengine'

export async function POST(request) {
  try {
    const { videoId, action } = await request.json()

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID required' },
        { status: 400 }
      )
    }

    console.log(`🔧 Attempting recovery for video ${videoId} with action: ${action}`)

    // Get the stuck video
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    let recoveryResult = {}

    switch (action) {
      case 'check_mux_status':
        recoveryResult = await checkMuxStatus(video)
        break
      
      case 'check_sightengine_status':
        recoveryResult = await checkSightEngineStatus(video)
        break
      
      case 'force_complete':
        recoveryResult = await forceComplete(video)
        break
      
      case 'restart_processing':
        recoveryResult = await restartProcessing(video)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    console.log(`✅ Recovery completed for ${videoId}:`, recoveryResult)

    return NextResponse.json({
      success: true,
      action,
      result: recoveryResult
    })

  } catch (error) {
    console.error('💥 Recovery error:', error)
    return NextResponse.json(
      { error: 'Recovery failed' },
      { status: 500 }
    )
  }
}

async function checkMuxStatus(video) {
  try {
    if (!video.mux_asset_id) {
      return { status: 'no_asset_id', message: 'No Mux asset ID found' }
    }

    const assetInfo = await getAssetInfo(video.mux_asset_id)
    
    // Update video status based on Mux asset status
    let newStatus = video.upload_status
    if (assetInfo.status === 'ready' && video.upload_status === 'processing') {
      newStatus = 'ready'
    }

    if (newStatus !== video.upload_status) {
      await supabaseAdmin
        .from('video_submissions')
        .update({
          upload_status: newStatus,
          processing_notes: `Status updated from Mux: ${assetInfo.status}`
        })
        .eq('id', video.id)
    }

    return {
      status: 'checked',
      muxStatus: assetInfo.status,
      updated: newStatus !== video.upload_status,
      newStatus
    }
  } catch (error) {
    console.error('Error checking Mux status:', error)
    return { status: 'error', message: error.message }
  }
}

async function checkSightEngineStatus(video) {
  try {
    if (!video.sightengine_job_id) {
      return { status: 'no_job_id', message: 'No SightEngine job ID found' }
    }

    const jobStatus = await checkProcessingStatus(video.sightengine_job_id)
    
    let newStatus = video.upload_status
    if (jobStatus.status === 'completed' && video.upload_status === 'anonymizing') {
      newStatus = 'completed'
    } else if (jobStatus.status === 'failed') {
      newStatus = 'failed'
    }

    if (newStatus !== video.upload_status) {
      await supabaseAdmin
        .from('video_submissions')
        .update({
          upload_status: newStatus,
          processing_notes: `Status updated from SightEngine: ${jobStatus.status}`
        })
        .eq('id', video.id)
    }

    return {
      status: 'checked',
      sightengineStatus: jobStatus.status,
      updated: newStatus !== video.upload_status,
      newStatus
    }
  } catch (error) {
    console.error('Error checking SightEngine status:', error)
    return { status: 'error', message: error.message }
  }
}

async function forceComplete(video) {
  try {
    await supabaseAdmin
      .from('video_submissions')
      .update({
        upload_status: 'completed',
        processing_notes: 'Manually marked as completed (force recovery)',
        updated_at: new Date().toISOString()
      })
      .eq('id', video.id)

    return {
      status: 'force_completed',
      message: 'Video marked as completed'
    }
  } catch (error) {
    console.error('Error force completing video:', error)
    return { status: 'error', message: error.message }
  }
}

async function restartProcessing(video) {
  try {
    // Reset video to uploading status to restart the pipeline
    await supabaseAdmin
      .from('video_submissions')
      .update({
        upload_status: 'uploading',
        processing_notes: 'Processing restarted (recovery)',
        sightengine_job_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', video.id)

    return {
      status: 'restarted',
      message: 'Video processing restarted'
    }
  } catch (error) {
    console.error('Error restarting processing:', error)
    return { status: 'error', message: error.message }
  }
}

// GET endpoint to list stuck videos for recovery
export async function GET() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    const { data: stuckVideos, error } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .in('upload_status', ['uploading', 'processing', 'anonymizing'])
      .lt('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false })

    if (error) throw error

    const videosWithActions = stuckVideos.map(video => ({
      ...video,
      stuckDuration: Math.round((Date.now() - new Date(video.created_at)) / (1000 * 60)),
      suggestedActions: getSuggestedActions(video)
    }))

    return NextResponse.json({
      stuckVideos: videosWithActions,
      count: videosWithActions.length
    })

  } catch (error) {
    console.error('Error fetching stuck videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stuck videos' },
      { status: 500 }
    )
  }
}

function getSuggestedActions(video) {
  const actions = []
  
  switch (video.upload_status) {
    case 'uploading':
      if (video.mux_upload_id) {
        actions.push('check_mux_status')
      }
      if (!video.mux_asset_id) {
        actions.push('restart_processing')
      }
      break
      
    case 'processing':
      if (video.mux_asset_id) {
        actions.push('check_mux_status')
      }
      actions.push('force_complete')
      break
      
    case 'anonymizing':
      if (video.sightengine_job_id) {
        actions.push('check_sightengine_status')
      }
      actions.push('force_complete')
      break
  }
  
  return actions
}