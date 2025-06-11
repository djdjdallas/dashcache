import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items']
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 404 }
      )
    }

    // Get purchase records from database
    const { data: purchases, error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .select(`
        *,
        data_packages (
          title,
          description,
          total_duration_hours,
          total_clips
        )
      `)
      .eq('stripe_payment_intent_id', session.payment_intent)

    if (purchaseError) {
      console.error('Error fetching purchases:', purchaseError)
      return NextResponse.json(
        { error: 'Failed to fetch purchase details' },
        { status: 500 }
      )
    }

    // Format response data
    const responseData = {
      orderId: session.payment_intent,
      purchaseDate: new Date(session.created * 1000).toISOString(),
      totalAmount: session.amount_total,
      customerEmail: session.customer_email,
      items: session.line_items.data.map(item => ({
        name: item.description || item.price.product.name,
        description: `${item.quantity} dataset package`,
        amount: item.amount_total
      })),
      purchases: purchases || [],
      downloads: purchases?.map(purchase => ({
        name: purchase.data_packages?.title,
        url: purchase.download_link || '#',
        size: `${purchase.data_packages?.total_duration_hours || 0} hours`,
        format: 'MP4/Anonymized',
        expiresAt: purchase.download_expires_at
      })) || []
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error verifying purchase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}