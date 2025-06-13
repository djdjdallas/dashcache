import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Build query
    let query = supabaseAdmin
      .from('video_submissions')
      .select(`
        *,
        profiles (
          full_name,
          email
        ),
        video_scenarios (
          id,
          scenario_type,
          is_approved
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (status) {
      query = query.eq('upload_status', status)
    }
    
    const { data: submissions, error } = await query
    
    if (error) {
      console.error('Error fetching video submissions:', error)
      throw error
    }
    
    // Get status counts
    const { data: statusCounts } = await supabaseAdmin
      .from('video_submissions')
      .select('upload_status')
    
    const statusDistribution = statusCounts?.reduce((acc, curr) => {
      acc[curr.upload_status] = (acc[curr.upload_status] || 0) + 1
      return acc
    }, {}) || {}
    
    // Format the response
    const formattedSubmissions = submissions.map(sub => ({
      id: sub.id,
      filename: sub.original_filename,
      status: sub.upload_status,
      driver: sub.profiles?.full_name || sub.profiles?.email || 'Unknown',
      mux: {
        uploadId: sub.mux_upload_id,
        assetId: sub.mux_asset_id,
        playbackId: sub.mux_playback_id
      },
      duration: sub.duration_seconds,
      fileSize: sub.file_size_mb,
      scenarios: sub.video_scenarios?.length || 0,
      approvedScenarios: sub.video_scenarios?.filter(s => s.is_approved).length || 0,
      isAnonymized: sub.is_anonymized,
      sightengineJobId: sub.sightengine_job_id,
      notes: sub.processing_notes,
      createdAt: sub.created_at
    }))
    
    return NextResponse.json({
      submissions: formattedSubmissions,
      total: submissions.length,
      statusDistribution,
      stats: {
        totalVideos: statusCounts?.length || 0,
        withScenarios: submissions.filter(s => s.video_scenarios?.length > 0).length,
        withoutScenarios: submissions.filter(s => !s.video_scenarios?.length).length,
        anonymized: submissions.filter(s => s.is_anonymized).length
      }
    })
    
  } catch (error) {
    console.error('Error in video status API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video status' },
      { status: 500 }
    )
  }
}

// POST endpoint to update video status (for testing/recovery)
export async function POST(request) {
  try {
    const { submissionId, updates } = await request.json()
    
    if (!submissionId || !updates) {
      return NextResponse.json(
        { error: 'submissionId and updates required' },
        { status: 400 }
      )
    }
    
    // Validate allowed updates
    const allowedFields = [
      'upload_status',
      'mux_upload_id',
      'mux_asset_id', 
      'mux_playback_id',
      'duration_seconds',
      'processing_notes'
    ]
    
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {})
    
    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabaseAdmin
      .from('video_submissions')
      .update(filteredUpdates)
      .eq('id', submissionId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating video submission:', error)
      throw error
    }
    
    return NextResponse.json({
      success: true,
      updated: data
    })
    
  } catch (error) {
    console.error('Error in video status POST:', error)
    return NextResponse.json(
      { error: 'Failed to update video status' },
      { status: 500 }
    )
  }
}