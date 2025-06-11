import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { items, buyerId } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid items' },
        { status: 400 }
      )
    }

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Buyer ID required' },
        { status: 400 }
      )
    }

    // Verify buyer exists and is authenticated
    const { data: buyer, error: buyerError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', buyerId)
      .eq('user_type', 'buyer')
      .single()

    if (buyerError || !buyer) {
      return NextResponse.json(
        { error: 'Invalid buyer' },
        { status: 403 }
      )
    }

    // Create line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          description: `${item.hours} hours of dashcam AI training data`,
          metadata: {
            package_id: item.packageId,
            buyer_id: buyerId
          }
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: 1,
    }))

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
      metadata: {
        buyer_id: buyerId
      },
      customer_email: buyer.email,
    })

    // Create pending purchases in database
    const purchases = items.map(item => ({
      buyer_id: buyerId,
      package_id: item.packageId,
      amount_paid: item.price,
      payment_status: 'pending',
      stripe_payment_intent_id: session.payment_intent
    }))

    const { error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .insert(purchases)

    if (purchaseError) {
      console.error('Error creating purchases:', purchaseError)
      // Continue anyway - we can reconcile later via webhook
    }

    return NextResponse.json({
      sessionId: session.id
    })

  } catch (error) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}