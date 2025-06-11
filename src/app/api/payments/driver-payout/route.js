import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { driverId, amount, earningIds } = await request.json()

    if (!driverId || !amount || !earningIds || !Array.isArray(earningIds)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      amount: amount
    })

  } catch (error) {
    console.error('Driver payout error:', error)
    return NextResponse.json(
      { error: 'Payout failed' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID required' },
        { status: 400 }
      )
    }

    // Get pending earnings for driver
    const { data: earnings, error } = await supabaseAdmin
      .from('driver_earnings')
      .select('*')
      .eq('driver_id', driverId)
      .eq('payment_status', 'pending')

    if (error) {
      console.error('Error fetching earnings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch earnings' },
        { status: 500 }
      )
    }

    const totalPending = earnings.reduce((sum, earning) => sum + parseFloat(earning.amount || 0), 0)

    return NextResponse.json({
      earnings: earnings || [],
      totalPending,
      count: earnings?.length || 0
    })

  } catch (error) {
    console.error('Error getting driver earnings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}