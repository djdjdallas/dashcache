import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
  const body = await request.text()
  const sig = headers().get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
        
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session) {
  const buyerId = session.metadata.buyer_id
  const paymentIntentId = session.payment_intent

  // Update purchases to completed status
  const { error: updateError } = await supabaseAdmin
    .from('purchases')
    .update({
      payment_status: 'completed',
      stripe_payment_intent_id: paymentIntentId
    })
    .eq('buyer_id', buyerId)
    .eq('payment_status', 'pending')

  if (updateError) {
    console.error('Error updating purchases:', updateError)
    return
  }

  // Get completed purchases to process driver payouts
  const { data: purchases, error: fetchError } = await supabaseAdmin
    .from('purchases')
    .select(`
      *,
      data_packages (
        package_scenarios (
          video_scenarios (
            video_submissions (
              driver_id
            )
          )
        )
      )
    `)
    .eq('stripe_payment_intent_id', paymentIntentId)

  if (fetchError || !purchases) {
    console.error('Error fetching purchases:', fetchError)
    return
  }

  // Process driver payouts (30% of sale)
  for (const purchase of purchases) {
    await processDriverPayouts(purchase)
  }

  // Generate download links
  await generateDownloadLinks(purchases)
}

async function handlePaymentSucceeded(paymentIntent) {
  // Update payment status to completed
  const { error } = await supabaseAdmin
    .from('purchases')
    .update({ payment_status: 'completed' })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (error) {
    console.error('Error updating payment status:', error)
  }
}

async function handlePaymentFailed(paymentIntent) {
  // Update payment status to failed
  const { error } = await supabaseAdmin
    .from('purchases')
    .update({ payment_status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (error) {
    console.error('Error updating payment status:', error)
  }
}

async function processDriverPayouts(purchase) {
  // Calculate driver share (30% of purchase amount)
  const driverShare = purchase.amount_paid * 0.30
  
  // Get unique drivers from the package scenarios
  const driverIds = new Set()
  
  purchase.data_packages?.package_scenarios?.forEach(ps => {
    ps.video_scenarios?.video_submissions?.forEach(vs => {
      if (vs.driver_id) {
        driverIds.add(vs.driver_id)
      }
    })
  })
  
  if (driverIds.size === 0) return
  
  // Split the driver share among all contributing drivers
  const payoutPerDriver = driverShare / driverIds.size
  
  // Create driver earnings records
  const earnings = Array.from(driverIds).map(driverId => ({
    driver_id: driverId,
    amount: payoutPerDriver,
    earning_type: 'footage_contribution',
    payment_status: 'pending'
  }))
  
  const { error } = await supabaseAdmin
    .from('driver_earnings')
    .insert(earnings)
    
  if (error) {
    console.error('Error creating driver earnings:', error)
  }
}

async function generateDownloadLinks(purchases) {
  // In production, generate secure download URLs for the datasets
  // For now, we'll just mark them as available
  
  const downloadExpiry = new Date()
  downloadExpiry.setDate(downloadExpiry.getDate() + 30) // 30 day access
  
  const { error } = await supabaseAdmin
    .from('purchases')
    .update({
      download_link: 'https://downloads.dashcache.com/dataset', // Placeholder
      download_expires_at: downloadExpiry.toISOString()
    })
    .in('id', purchases.map(p => p.id))
    
  if (error) {
    console.error('Error generating download links:', error)
  }
}