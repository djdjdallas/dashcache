'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Download, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

function SuccessPageContent() {
  const [loading, setLoading] = useState(true)
  const [purchaseData, setPurchaseData] = useState(null)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      verifyPurchase()
    } else {
      setError('Invalid session')
      setLoading(false)
    }
  }, [sessionId])

  const verifyPurchase = async () => {
    try {
      const response = await fetch(`/api/verify-purchase?session_id=${sessionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to verify purchase')
      }

      const data = await response.json()
      setPurchaseData(data)
      
      // Clear cart
      localStorage.removeItem('marketplace_cart')
      
    } catch (error) {
      console.error('Error verifying purchase:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Verifying your purchase...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Purchase Verification Failed</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/marketplace"
            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Purchase Successful!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. Your datasets are ready for download.
          </p>
        </div>

        {/* Purchase Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase Details</h2>
          
          {purchaseData?.items?.map((item, index) => (
            <div key={index} className="flex justify-between items-start py-4 border-b border-gray-200 last:border-b-0">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {item.description}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">
                    Order ID: {purchaseData.orderId}
                  </span>
                  <span className="text-sm text-gray-500">
                    Date: {new Date(purchaseData.purchaseDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="font-semibold text-gray-900">
                  ${(item.amount / 100).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Paid:</span>
              <span>${(purchaseData.totalAmount / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Download Your Datasets</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-blue-900">Download Links Sent</h3>
                <p className="text-sm text-blue-700 mt-1">
                  We've sent secure download links to your email address. 
                  Links are valid for 30 days.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {purchaseData?.downloads?.map((download, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{download.name}</h4>
                  <p className="text-sm text-gray-600">
                    Size: {download.size} | Format: {download.format}
                  </p>
                </div>
                <a
                  href={download.url}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </div>
            )) || (
              <div className="text-center py-8">
                <Download className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Download links are being prepared...</p>
                <p className="text-sm text-gray-400 mt-1">
                  You'll receive an email shortly with your download links.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-sm font-medium text-purple-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Access Your Data</h3>
                <p className="text-sm text-gray-600">
                  Use the download links to access your AI training datasets. All data is anonymized and ready for use.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-sm font-medium text-purple-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Review Documentation</h3>
                <p className="text-sm text-gray-600">
                  Each dataset includes documentation with metadata, tagging information, and usage guidelines.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-sm font-medium text-purple-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Need More Data?</h3>
                <p className="text-sm text-gray-600">
                  Browse our marketplace for additional datasets or contact us for custom data collection.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <Link
            href="/marketplace"
            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Browse More Datasets
          </Link>
          
          <a
            href="mailto:support@dashcache.com"
            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}