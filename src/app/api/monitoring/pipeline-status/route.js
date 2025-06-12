import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('📊 Fetching pipeline status metrics')

    // Get video submissions by status
    const { data: statusCounts, error: statusError } = await supabaseAdmin
      .from('video_submissions')
      .select('upload_status')

    if (statusError) {
      console.error('Error fetching status counts:', statusError)
      throw statusError
    }

    // Count submissions by status
    const statusBreakdown = statusCounts.reduce((acc, sub) => {
      acc[sub.upload_status] = (acc[sub.upload_status] || 0) + 1
      return acc
    }, {})

    // Get recent processing activity (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: recentActivity, error: activityError } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })

    if (activityError) {
      console.error('Error fetching recent activity:', activityError)
      throw activityError
    }

    // Get scenario extraction stats
    const { data: scenarioStats, error: scenarioError } = await supabaseAdmin
      .from('video_scenarios')
      .select('scenario_type, confidence_score, is_approved')

    if (scenarioError) {
      console.error('Error fetching scenario stats:', scenarioError)
      throw scenarioError
    }

    // Calculate scenario metrics
    const scenarioBreakdown = scenarioStats.reduce((acc, scenario) => {
      acc[scenario.scenario_type] = (acc[scenario.scenario_type] || 0) + 1
      return acc
    }, {})

    const avgConfidence = scenarioStats.length > 0 
      ? scenarioStats.reduce((sum, s) => sum + s.confidence_score, 0) / scenarioStats.length
      : 0

    const approvalRate = scenarioStats.length > 0
      ? scenarioStats.filter(s => s.is_approved).length / scenarioStats.length
      : 0

    // Get stuck videos (in processing state for > 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    const { data: stuckVideos, error: stuckError } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .in('upload_status', ['uploading', 'processing', 'anonymizing'])
      .lt('created_at', thirtyMinutesAgo)

    if (stuckError) {
      console.error('Error fetching stuck videos:', stuckError)
      throw stuckError
    }

    // Calculate processing times for completed videos
    const { data: completedVideos, error: completedError } = await supabaseAdmin
      .from('video_submissions')
      .select('created_at, updated_at')
      .eq('upload_status', 'completed')
      .not('updated_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)

    if (completedError) {
      console.error('Error fetching completed videos:', completedError)
      throw completedError
    }

    const processingTimes = completedVideos.map(video => {
      const start = new Date(video.created_at)
      const end = new Date(video.updated_at)
      return (end - start) / (1000 * 60) // minutes
    })

    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0

    const metrics = {
      overview: {
        totalVideos: statusCounts.length,
        recentActivity: recentActivity.length,
        stuckVideos: stuckVideos.length,
        avgProcessingTime: Math.round(avgProcessingTime)
      },
      statusBreakdown,
      scenarioMetrics: {
        totalScenarios: scenarioStats.length,
        scenarioBreakdown,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        approvalRate: Math.round(approvalRate * 100) / 100
      },
      recentActivity: recentActivity.slice(0, 10), // Last 10 submissions
      stuckVideos: stuckVideos.map(video => ({
        id: video.id,
        filename: video.original_filename,
        status: video.upload_status,
        createdAt: video.created_at,
        stuckDuration: Math.round((Date.now() - new Date(video.created_at)) / (1000 * 60))
      })),
      healthStatus: {
        webhooks: stuckVideos.length < 5 ? 'healthy' : 'degraded',
        processing: avgProcessingTime < 10 ? 'healthy' : 'slow',
        scenarios: approvalRate > 0.8 ? 'healthy' : 'needs_attention'
      }
    }

    console.log('✅ Pipeline metrics calculated:', {
      totalVideos: metrics.overview.totalVideos,
      stuckVideos: metrics.overview.stuckVideos,
      scenarios: metrics.scenarioMetrics.totalScenarios
    })

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('💥 Error fetching pipeline status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline status' },
      { status: 500 }
    )
  }
}