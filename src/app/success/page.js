'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Download, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

export default function SuccessPage() {
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
      <div className=\"min-h-screen flex items-center justify-center\">\n        <div className=\"text-lg\">Verifying your purchase...</div>\n      </div>\n    )\n  }

  if (error) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">\n        <div className=\"text-center\">\n          <div className=\"text-red-600 text-xl mb-4\">Purchase Verification Failed</div>\n          <p className=\"text-gray-600 mb-4\">{error}</p>\n          <Link\n            href=\"/marketplace\"\n            className=\"px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700\"\n          >\n            Return to Marketplace\n          </Link>\n        </div>\n      </div>\n    )\n  }

  return (
    <div className=\"min-h-screen bg-gray-50 py-8\">\n      <div className=\"max-w-3xl mx-auto px-4 sm:px-6 lg:px-8\">\n        {/* Success Header */}\n        <div className=\"text-center mb-8\">\n          <div className=\"mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4\">\n            <CheckCircle className=\"h-8 w-8 text-green-600\" />\n          </div>\n          <h1 className=\"text-3xl font-bold text-gray-900 mb-2\">\n            Purchase Successful!\n          </h1>\n          <p className=\"text-lg text-gray-600\">\n            Thank you for your purchase. Your datasets are ready for download.\n          </p>\n        </div>\n\n        {/* Purchase Details */}\n        <div className=\"bg-white rounded-lg shadow p-6 mb-8\">\n          <h2 className=\"text-xl font-semibold text-gray-900 mb-4\">Purchase Details</h2>\n          \n          {purchaseData?.items?.map((item, index) => (\n            <div key={index} className=\"flex justify-between items-start py-4 border-b border-gray-200 last:border-b-0\">\n              <div className=\"flex-1\">\n                <h3 className=\"font-medium text-gray-900\">{item.name}</h3>\n                <p className=\"text-sm text-gray-600 mt-1\">\n                  {item.description}\n                </p>\n                <div className=\"flex items-center space-x-4 mt-2\">\n                  <span className=\"text-sm text-gray-500\">\n                    Order ID: {purchaseData.orderId}\n                  </span>\n                  <span className=\"text-sm text-gray-500\">\n                    Date: {new Date(purchaseData.purchaseDate).toLocaleDateString()}\n                  </span>\n                </div>\n              </div>\n              <div className=\"text-right ml-4\">\n                <div className=\"font-semibold text-gray-900\">\n                  ${(item.amount / 100).toFixed(2)}\n                </div>\n              </div>\n            </div>\n          ))}\n          \n          <div className=\"pt-4 mt-4 border-t border-gray-200\">\n            <div className=\"flex justify-between text-lg font-semibold\">\n              <span>Total Paid:</span>\n              <span>${(purchaseData.totalAmount / 100).toFixed(2)}</span>\n            </div>\n          </div>\n        </div>\n\n        {/* Download Section */}\n        <div className=\"bg-white rounded-lg shadow p-6 mb-8\">\n          <h2 className=\"text-xl font-semibold text-gray-900 mb-4\">Download Your Datasets</h2>\n          \n          <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4\">\n            <div className=\"flex items-start\">\n              <Mail className=\"h-5 w-5 text-blue-500 mt-0.5 mr-3\" />\n              <div>\n                <h3 className=\"font-medium text-blue-900\">Download Links Sent</h3>\n                <p className=\"text-sm text-blue-700 mt-1\">\n                  We've sent secure download links to your email address. \n                  Links are valid for 30 days.\n                </p>\n              </div>\n            </div>\n          </div>\n          \n          <div className=\"space-y-3\">\n            {purchaseData?.downloads?.map((download, index) => (\n              <div key={index} className=\"flex items-center justify-between p-4 border border-gray-200 rounded-lg\">\n                <div>\n                  <h4 className=\"font-medium text-gray-900\">{download.name}</h4>\n                  <p className=\"text-sm text-gray-600\">\n                    Size: {download.size} | Format: {download.format}\n                  </p>\n                </div>\n                <a\n                  href={download.url}\n                  className=\"flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700\"\n                >\n                  <Download className=\"h-4 w-4 mr-2\" />\n                  Download\n                </a>\n              </div>\n            )) || (\n              <div className=\"text-center py-8\">\n                <Download className=\"h-8 w-8 text-gray-400 mx-auto mb-2\" />\n                <p className=\"text-gray-500\">Download links are being prepared...</p>\n                <p className=\"text-sm text-gray-400 mt-1\">\n                  You'll receive an email shortly with your download links.\n                </p>\n              </div>\n            )}\n          </div>\n        </div>\n\n        {/* Next Steps */}\n        <div className=\"bg-white rounded-lg shadow p-6 mb-8\">\n          <h2 className=\"text-xl font-semibold text-gray-900 mb-4\">What's Next?</h2>\n          \n          <div className=\"space-y-4\">\n            <div className=\"flex items-start\">\n              <div className=\"flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5\">\n                <span className=\"text-sm font-medium text-purple-600\">1</span>\n              </div>\n              <div>\n                <h3 className=\"font-medium text-gray-900\">Access Your Data</h3>\n                <p className=\"text-sm text-gray-600\">\n                  Use the download links to access your AI training datasets. All data is anonymized and ready for use.\n                </p>\n              </div>\n            </div>\n            \n            <div className=\"flex items-start\">\n              <div className=\"flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5\">\n                <span className=\"text-sm font-medium text-purple-600\">2</span>\n              </div>\n              <div>\n                <h3 className=\"font-medium text-gray-900\">Review Documentation</h3>\n                <p className=\"text-sm text-gray-600\">\n                  Each dataset includes documentation with metadata, tagging information, and usage guidelines.\n                </p>\n              </div>\n            </div>\n            \n            <div className=\"flex items-start\">\n              <div className=\"flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5\">\n                <span className=\"text-sm font-medium text-purple-600\">3</span>\n              </div>\n              <div>\n                <h3 className=\"font-medium text-gray-900\">Need More Data?</h3>\n                <p className=\"text-sm text-gray-600\">\n                  Browse our marketplace for additional datasets or contact us for custom data collection.\n                </p>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        {/* Actions */}\n        <div className=\"flex justify-center space-x-4\">\n          <Link\n            href=\"/marketplace\"\n            className=\"flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50\"\n          >\n            <ArrowLeft className=\"h-4 w-4 mr-2\" />\n            Browse More Datasets\n          </Link>\n          \n          <a\n            href=\"mailto:support@dashcache.com\"\n            className=\"px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700\"\n          >\n            Contact Support\n          </a>\n        </div>\n      </div>\n    </div>\n  )\n}