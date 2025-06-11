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
      <div className=\"min-h-screen flex items-center justify-center\">\n        <div className=\"text-lg\">Loading checkout...</div>\n      </div>\n    )\n  }

  if (cart.length === 0) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">\n        <div className=\"text-center\">\n          <ShoppingCart className=\"h-16 w-16 text-gray-400 mx-auto mb-4\" />\n          <h2 className=\"text-xl font-semibold text-gray-900 mb-2\">Your cart is empty</h2>\n          <p className=\"text-gray-600 mb-4\">Add some datasets to your cart before checking out.</p>\n          <button\n            onClick={() => router.push('/marketplace')}\n            className=\"px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700\"\n          >\n            Browse Marketplace\n          </button>\n        </div>\n      </div>\n    )\n  }

  return (
    <div className=\"min-h-screen bg-gray-50 py-8\">\n      <div className=\"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8\">\n        {/* Header */}\n        <div className=\"mb-8\">\n          <button\n            onClick={() => router.push('/marketplace')}\n            className=\"flex items-center text-gray-600 hover:text-gray-900 mb-4\"\n          >\n            <ArrowLeft className=\"h-4 w-4 mr-2\" />\n            Back to Marketplace\n          </button>\n          <h1 className=\"text-3xl font-bold text-gray-900\">Checkout</h1>\n        </div>\n\n        <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-8\">\n          {/* Order Summary */}\n          <div className=\"lg:col-span-2\">\n            <div className=\"bg-white rounded-lg shadow p-6\">\n              <h2 className=\"text-xl font-semibold text-gray-900 mb-6\">Order Summary</h2>\n              \n              <div className=\"space-y-4\">\n                {cart.map((item, index) => (\n                  <div key={index} className=\"flex justify-between items-start py-4 border-b border-gray-200 last:border-b-0\">\n                    <div className=\"flex-1\">\n                      <h3 className=\"font-medium text-gray-900\">{item.title}</h3>\n                      <p className=\"text-sm text-gray-600 mt-1\">{item.description}</p>\n                      <div className=\"flex items-center space-x-4 mt-2\">\n                        <span className=\"text-sm text-gray-500\">\n                          {item.total_duration_hours} hours\n                        </span>\n                        <span className=\"text-sm text-gray-500\">\n                          {item.total_clips} clips\n                        </span>\n                        <span className=\"text-sm text-purple-600\">\n                          {formatPrice(item.price_per_hour)}/hour\n                        </span>\n                      </div>\n                    </div>\n                    <div className=\"text-right ml-4\">\n                      <div className=\"font-semibold text-gray-900\">\n                        {formatPrice(item.total_price)}\n                      </div>\n                    </div>\n                  </div>\n                ))}\n              </div>\n            </div>\n          </div>\n\n          {/* Payment Details */}\n          <div className=\"lg:col-span-1\">\n            <div className=\"bg-white rounded-lg shadow p-6 sticky top-8\">\n              <h2 className=\"text-xl font-semibold text-gray-900 mb-6\">Payment Details</h2>\n              \n              {/* Total */}\n              <div className=\"space-y-2 mb-6\">\n                <div className=\"flex justify-between text-sm\">\n                  <span className=\"text-gray-600\">Subtotal ({cart.length} items)</span>\n                  <span className=\"text-gray-900\">{formatPrice(getTotalPrice())}</span>\n                </div>\n                <div className=\"flex justify-between text-sm\">\n                  <span className=\"text-gray-600\">Processing fee</span>\n                  <span className=\"text-gray-900\">$0.00</span>\n                </div>\n                <div className=\"border-t border-gray-200 pt-2\">\n                  <div className=\"flex justify-between text-lg font-semibold\">\n                    <span className=\"text-gray-900\">Total</span>\n                    <span className=\"text-gray-900\">{formatPrice(getTotalPrice())}</span>\n                  </div>\n                </div>\n              </div>\n\n              {/* Payment Method */}\n              <div className=\"mb-6\">\n                <h3 className=\"text-lg font-medium text-gray-900 mb-3\">Payment Method</h3>\n                <div className=\"border border-gray-300 rounded-lg p-4\">\n                  <div className=\"flex items-center\">\n                    <CreditCard className=\"h-5 w-5 text-gray-400 mr-3\" />\n                    <span className=\"text-gray-900\">Secure payment via Stripe</span>\n                  </div>\n                  <p className=\"text-sm text-gray-600 mt-2\">\n                    Your payment information is encrypted and secure.\n                  </p>\n                </div>\n              </div>\n\n              {/* Error Message */}\n              {error && (\n                <div className=\"mb-4 p-4 bg-red-50 border border-red-200 rounded-lg\">\n                  <p className=\"text-sm text-red-600\">{error}</p>\n                </div>\n              )}\n\n              {/* Purchase Button */}\n              <button\n                onClick={handleCheckout}\n                disabled={processing || cart.length === 0}\n                className=\"w-full flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed\"\n              >\n                {processing ? (\n                  <div className=\"flex items-center\">\n                    <div className=\"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2\" />\n                    Processing...\n                  </div>\n                ) : (\n                  <div className=\"flex items-center\">\n                    <Check className=\"h-4 w-4 mr-2\" />\n                    Complete Purchase\n                  </div>\n                )}\n              </button>\n\n              {/* Terms */}\n              <p className=\"text-xs text-gray-500 mt-4 text-center\">\n                By completing this purchase, you agree to our{' '}\n                <a href=\"#\" className=\"underline\">Terms of Service</a> and{' '}\n                <a href=\"#\" className=\"underline\">Privacy Policy</a>.\n              </p>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  )\n}