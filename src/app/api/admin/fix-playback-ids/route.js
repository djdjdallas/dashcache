import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAssetInfo } from '@/lib/mux'

export async function POST() {
  try {
    console.log('🔧 Starting playback ID fix...')
    
    // Get all submissions that have Mux asset IDs but no playback IDs
    const { data: submissions, error } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .not('mux_asset_id', 'is', null)
      .is('mux_playback_id', null)
    
    if (error) {
      throw error
    }
    
    console.log('📋 Found', submissions.length, 'submissions needing playback ID fixes')
    
    const results = []
    
    for (const submission of submissions) {
      try {
        console.log('🎬 Checking asset:', submission.mux_asset_id)
        
        // Get asset info from Mux
        const assetInfo = await getAssetInfo(submission.mux_asset_id)
        
        if (assetInfo && assetInfo.playback_ids && assetInfo.playback_ids.length > 0) {
          const playbackId = assetInfo.playback_ids[0].id
          const duration = assetInfo.duration ? Math.round(assetInfo.duration) : null
          
          console.log('✅ Found playback ID:', playbackId, 'duration:', duration)
          
          // Update the submission
          const { error: updateError } = await supabaseAdmin
            .from('video_submissions')
            .update({
              mux_playback_id: playbackId,
              duration_seconds: duration,
              upload_status: assetInfo.status === 'ready' ? 'completed' : 'processing'
            })
            .eq('id', submission.id)
          
          if (updateError) {
            console.error('❌ Update failed for', submission.id, ':', updateError)
            results.push({
              submissionId: submission.id,
              success: false,
              error: updateError.message
            })
          } else {
            console.log('✅ Updated submission:', submission.id)
            results.push({
              submissionId: submission.id,
              success: true,
              playbackId,
              duration,
              assetStatus: assetInfo.status
            })
          }
        } else {
          console.log('⚠️ No playback IDs found for asset:', submission.mux_asset_id)
          results.push({
            submissionId: submission.id,
            success: false,
            error: 'No playback IDs available from Mux'
          })
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (assetError) {
        console.error('❌ Failed to get asset info for', submission.mux_asset_id, ':', assetError)
        results.push({
          submissionId: submission.id,
          success: false,
          error: assetError.message
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    console.log('🎯 Playback ID fix complete:', successCount, 'successful,', failCount, 'failed')
    
    return NextResponse.json({
      success: true,
      message: `Processed ${submissions.length} submissions`,
      results: {
        total: submissions.length,
        successful: successCount,
        failed: failCount,
        details: results
      }
    })
    
  } catch (error) {
    console.error('💥 Playback ID fix error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}