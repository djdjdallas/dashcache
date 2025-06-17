'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { ShoppingCart, CreditCard, ArrowLeft, Check } from 'lucide-react'

export default function Checkout() {
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadUserAndCart()
  }, [])

  const loadUserAndCart = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData) {
        router.push('/auth')
        return
      }
      
      if (userData.profile?.user_type !== 'buyer') {
        router.push('/')
        return
      }

      setUser(userData)

      // Load cart from localStorage
      const cartData = localStorage.getItem('marketplace_cart')
      if (cartData) {
        setCart(JSON.parse(cartData))
      } else {
        router.push('/marketplace')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.total_price, 0)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const handleCheckout = async () => {
    if (cart.length === 0 || processing) return
    
    setProcessing(true)
    setError('')

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            packageId: item.id,
            title: item.title,
            price: item.total_price,
            hours: item.total_duration_hours
          })),
          buyerId: user.user.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      })

      if (error) {
        throw new Error(error.message)
      }

    } catch (error) {
      console.error('Checkout error:', error)
      setError(error.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading checkout...</div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add some datasets to your cart before checking out.</p>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/marketplace')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-start py-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          {item.total_duration_hours} hours
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.total_clips} clips
                        </span>
                        <span className="text-sm text-purple-600">
                          {formatPrice(item.price_per_hour)}/hour
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-gray-900">
                        {formatPrice(item.total_price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Details</h2>
              
              {/* Total */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({cart.length} items)</span>
                  <span className="text-gray-900">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processing fee</span>
                  <span className="text-gray-900">$0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">Secure payment via Stripe</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Your payment information is encrypted and secure.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Purchase Button */}
              <button
                onClick={handleCheckout}
                disabled={processing || cart.length === 0}
                className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Complete Purchase
                  </div>
                )}
              </button>

              {/* Terms */}
              <p className="text-xs text-gray-500 mt-4 text-center">
                By completing this purchase, you agree to our{' '}
                <a href="#" className="underline">Terms of Service</a> and{' '}
                <a href="#" className="underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}