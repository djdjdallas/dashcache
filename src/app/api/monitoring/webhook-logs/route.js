import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const service = searchParams.get('service') // 'mux' or 'sightengine'
    const eventType = searchParams.get('eventType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeErrors = searchParams.get('errors') === 'true'

    let query = supabaseAdmin
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (service) {
      query = query.eq('service', service)
    }

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (includeErrors) {
      query = query.not('error_message', 'is', null)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('Error fetching webhook logs:', error)
      throw error
    }

    // Parse event data for easier viewing
    const parsedLogs = logs.map(log => ({
      ...log,
      event_data: log.event_data, // Already JSONB in database
      error_details: log.error_details // Already JSONB in database
    }))

    // Get event type statistics
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('webhook_logs')
      .select('service, event_type')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (statsError) {
      console.error('Error fetching stats:', statsError)
    }

    // Calculate event type breakdown
    const eventStats = stats?.reduce((acc, log) => {
      const key = `${log.service}_${log.event_type}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({
      logs: parsedLogs,
      total: logs.length,
      stats: {
        eventTypes: eventStats,
        totalEvents: stats?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in webhook logs API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook logs' },
      { status: 500 }
    )
  }
}

// POST endpoint to manually log webhook events (for testing)
export async function POST(request) {
  try {
    const { service, eventType, eventData, error: errorMessage } = await request.json()

    if (!service || !eventType) {
      return NextResponse.json(
        { error: 'Service and eventType required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('webhook_logs')
      .insert([{
        service,
        event_type: eventType,
        event_id: eventData?.id || `manual_${Date.now()}`,
        event_data: eventData || {},
        error_message: errorMessage,
        error_details: errorMessage ? { manual: true, error: errorMessage } : null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error logging webhook:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      log: data
    })

  } catch (error) {
    console.error('Error in webhook log POST:', error)
    return NextResponse.json(
      { error: 'Failed to log webhook event' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to clean up old logs
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const daysOld = parseInt(searchParams.get('daysOld') || '30')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { error } = await supabaseAdmin
      .from('webhook_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('Error cleaning up logs:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `Deleted logs older than ${daysOld} days`
    })

  } catch (error) {
    console.error('Error in webhook log DELETE:', error)
    return NextResponse.json(
      { error: 'Failed to clean up logs' },
      { status: 500 }
    )
  }
}