import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateEarnings } from '@/lib/sightengine'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')
    const status = searchParams.get('status') || 'all'
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('driver_earnings')
      .select(`
        *,
        video_submissions (
          original_filename,
          duration_seconds,
          mux_playback_id
        )
      `)
      .eq('driver_id', driverId)

    if (status !== 'all') {
      query = query.eq('payment_status', status)
    }

    const { data: earnings, error } = await query
      .order('earned_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (error) {
      console.error('Error fetching earnings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch earnings' },
        { status: 500 }
      )
    }

    // Calculate totals
    const totals = {
      pending: 0,
      paid: 0,
      total: 0
    }

    const allEarnings = await supabaseAdmin
      .from('driver_earnings')
      .select('amount, payment_status')
      .eq('driver_id', driverId)

    if (allEarnings.data) {
      allEarnings.data.forEach(earning => {
        const amount = parseFloat(earning.amount || 0)
        totals.total += amount
        if (earning.payment_status === 'paid') {
          totals.paid += amount
        } else {
          totals.pending += amount
        }
      })
    }

    return NextResponse.json({
      earnings: earnings || [],
      totals,
      pagination: {
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: earnings && earnings.length === parseInt(limit)
      }
    })

  } catch (error) {
    console.error('Error in driver payout API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Check if this is a manual earning creation or Stripe payout
    if (body.amount && !body.earningIds) {
      return await createManualEarning(body)
    } else {
      return await processStripePayout(body)
    }

  } catch (error) {
    console.error('Error in POST handler:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createManualEarning({ driverId, amount, earningType, videoSubmissionId, metadata }) {
  if (!driverId || !amount) {
    return NextResponse.json(
      { error: 'Driver ID and amount required' },
      { status: 400 }
    )
  }

  // Verify driver exists
  const { data: driver, error: driverError } = await supabaseAdmin
    .from('profiles')
    .select('id, user_type')
    .eq('id', driverId)
    .eq('user_type', 'driver')
    .single()

  if (driverError || !driver) {
    return NextResponse.json(
      { error: 'Driver not found' },
      { status: 404 }
    )
  }

  // Create earning record
  const { data: earning, error: earningError } = await supabaseAdmin
    .from('driver_earnings')
    .insert([{
      driver_id: driverId,
      video_submission_id: videoSubmissionId,
      amount: parseFloat(amount),
      earning_type: earningType || 'footage_contribution',
      payment_status: 'pending',
      metadata: metadata ? JSON.stringify(metadata) : null,
      earned_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (earningError) {
    console.error('Error creating earning:', earningError)
    return NextResponse.json(
      { error: 'Failed to create earning record' },
      { status: 500 }
    )
  }

  // Update driver's profile earnings
  await updateDriverEarnings(driverId)

  return NextResponse.json({
    success: true,
    earning
  })
}

async function processStripePayout({ driverId, amount, earningIds }) {
  if (!driverId || !amount || !earningIds || !Array.isArray(earningIds)) {
    return NextResponse.json(
      { error: 'Missing required fields for payout' },
      { status: 400 }
    )
  }

  // Get driver profile with Stripe account ID
  const { data: driver, error: driverError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', driverId)
    .eq('user_type', 'driver')
    .single()

  if (driverError || !driver) {
    return NextResponse.json(
      { error: 'Driver not found' },
      { status: 404 }
    )
  }

  if (!driver.stripe_account_id) {
    return NextResponse.json(
      { error: 'Driver has not completed Stripe Connect onboarding' },
      { status: 400 }
    )
  }

  // Create Stripe transfer
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    destination: driver.stripe_account_id,
    description: `DashCache driver payout for ${driver.full_name || driver.email}`
  })

  // Update earnings as paid
  const { error: updateError } = await supabaseAdmin
    .from('driver_earnings')
    .update({
      payment_status: 'paid',
      stripe_transfer_id: transfer.id,
      paid_at: new Date().toISOString()
    })
    .in('id', earningIds)

  if (updateError) {
    console.error('Error updating earnings:', updateError)
    return NextResponse.json(
      { error: 'Failed to update earnings status' },
      { status: 500 }
    )
  }

  // Update driver's profile earnings
  await updateDriverEarnings(driverId)

  return NextResponse.json({
    success: true,
    transferId: transfer.id,
    amount: amount
  })
}

export async function PATCH(request) {
  try {
    const { earningIds, status, payoutDetails } = await request.json()

    if (!earningIds || !Array.isArray(earningIds) || !status) {
      return NextResponse.json(
        { error: 'Earning IDs array and status required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'paid', 'failed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update earnings
    const { data: updatedEarnings, error } = await supabaseAdmin
      .from('driver_earnings')
      .update({
        payment_status: status,
        payout_details: payoutDetails ? JSON.stringify(payoutDetails) : null,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .in('id', earningIds)
      .select('driver_id')

    if (error) {
      console.error('Error updating earnings:', error)
      return NextResponse.json(
        { error: 'Failed to update earnings' },
        { status: 500 }
      )
    }

    // Update affected drivers' profile earnings
    const uniqueDriverIds = [...new Set(updatedEarnings.map(e => e.driver_id))]
    await Promise.all(uniqueDriverIds.map(driverId => updateDriverEarnings(driverId)))

    return NextResponse.json({
      success: true,
      updated: earningIds.length,
      message: `${earningIds.length} earnings updated to ${status}`
    })

  } catch (error) {
    console.error('Error updating earnings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Calculate earnings for a video submission
export async function PUT(request) {
  try {
    const { videoSubmissionId, forceRecalculate = false } = await request.json()

    if (!videoSubmissionId) {
      return NextResponse.json(
        { error: 'Video submission ID required' },
        { status: 400 }
      )
    }

    // Get video submission details
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('video_submissions')
      .select(`
        *,
        video_scenarios (*)
      `)
      .eq('id', videoSubmissionId)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Video submission not found' },
        { status: 404 }
      )
    }

    // Check if earnings already exist (unless force recalculate)
    if (!forceRecalculate) {
      const { data: existingEarnings } = await supabaseAdmin
        .from('driver_earnings')
        .select('id')
        .eq('video_submission_id', videoSubmissionId)
        .limit(1)

      if (existingEarnings && existingEarnings.length > 0) {
        return NextResponse.json(
          { error: 'Earnings already calculated for this video' },
          { status: 409 }
        )
      }
    }

    // Calculate earnings based on duration and scenarios
    const durationSeconds = submission.duration_seconds || 0
    const scenarios = submission.video_scenarios || []
    const calculatedAmount = calculateEarnings(durationSeconds, scenarios)

    // Create or update earning record
    const earningData = {
      driver_id: submission.driver_id,
      video_submission_id: videoSubmissionId,
      amount: calculatedAmount,
      earning_type: 'footage_contribution',
      payment_status: 'pending',
      metadata: JSON.stringify({
        duration_minutes: Math.round(durationSeconds / 60),
        scenario_count: scenarios.length,
        scenario_types: [...new Set(scenarios.map(s => s.scenario_type))],
        calculation_method: 'automated_v1'
      }),
      earned_at: new Date().toISOString()
    }

    let earning
    if (forceRecalculate) {
      // Update existing or create new
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('driver_earnings')
        .upsert(earningData, { onConflict: 'video_submission_id' })
        .select()
        .single()

      if (updateError) {
        throw updateError
      }
      earning = updated
    } else {
      // Create new
      const { data: created, error: createError } = await supabaseAdmin
        .from('driver_earnings')
        .insert([earningData])
        .select()
        .single()

      if (createError) {
        throw createError
      }
      earning = created
    }

    // Update driver's profile earnings
    await updateDriverEarnings(submission.driver_id)

    return NextResponse.json({
      success: true,
      earning,
      calculation: {
        baseAmount: calculatedAmount,
        durationMinutes: Math.round(durationSeconds / 60),
        scenarioCount: scenarios.length,
        scenarioTypes: [...new Set(scenarios.map(s => s.scenario_type))]
      }
    })

  } catch (error) {
    console.error('Error calculating earnings:', error)
    return NextResponse.json(
      { error: 'Failed to calculate earnings' },
      { status: 500 }
    )
  }
}

async function updateDriverEarnings(driverId) {
  try {
    // Get all earnings for this driver
    const { data: earnings, error } = await supabaseAdmin
      .from('driver_earnings')
      .select('amount, payment_status, earned_at')
      .eq('driver_id', driverId)

    if (error || !earnings) {
      console.error('Error fetching driver earnings:', error)
      return
    }

    // Calculate totals
    const totalEarnings = earnings.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
    const paidEarnings = earnings
      .filter(e => e.payment_status === 'paid')
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

    // Calculate this month's earnings
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyEarnings = earnings
      .filter(e => {
        const earnedDate = new Date(e.earned_at)
        return earnedDate.getMonth() === currentMonth && earnedDate.getFullYear() === currentYear
      })
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

    // Update profile
    await supabaseAdmin
      .from('profiles')
      .update({
        total_earnings: totalEarnings,
        monthly_earnings: monthlyEarnings,
        paid_earnings: paidEarnings,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId)

  } catch (error) {
    console.error('Error updating driver earnings summary:', error)
  }
}