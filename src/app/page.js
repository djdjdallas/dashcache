import Link from 'next/link'
import { Car, Camera, DollarSign, Shield, BarChart3, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">DashCache</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/auth"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/auth"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            Turn Your Dashcam Into <span className="text-blue-600">Passive Income</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect rideshare drivers with autonomous vehicle companies. Upload your dashcam footage, 
            we anonymize and package it for AI training datasets. Earn $30-100/month automatically.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/auth"
              className="px-8 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Start Earning as Driver
            </Link>
            <Link
              href="/auth"
              className="px-8 py-3 text-lg font-medium text-blue-600 bg-white hover:bg-gray-50 border-2 border-blue-600 rounded-lg"
            >
              Buy AI Training Data
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How DashCache Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Upload Footage</h3>
              <p className="text-gray-600">
                Drivers upload dashcam videos from daily routes. 
                Automatic BlackVue integration coming soon.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. AI Processing</h3>
              <p className="text-gray-600">
                We automatically anonymize faces and license plates, 
                then tag scenarios for AI training datasets.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Get Paid</h3>
              <p className="text-gray-600">
                AV companies buy datasets for $100-500/hour. 
                Drivers get 30%, platform takes 70%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">2,500+</div>
              <div className="text-gray-600">Active Drivers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">$89</div>
              <div className="text-gray-600">Avg Monthly Earnings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">45,000</div>
              <div className="text-gray-600">Hours of Footage</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">25</div>
              <div className="text-gray-600">AV Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* For Drivers */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                For Rideshare Drivers
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <DollarSign className="h-6 w-6 text-green-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold">Passive Income</h3>
                    <p className="text-gray-600">Earn $30-100/month automatically from footage you're already recording</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Shield className="h-6 w-6 text-blue-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold">Complete Privacy</h3>
                    <p className="text-gray-600">All faces and license plates automatically anonymized before sale</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <BarChart3 className="h-6 w-6 text-purple-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold">Real-time Tracking</h3>
                    <p className="text-gray-600">Monitor your earnings and footage contributions in your dashboard</p>
                  </div>
                </div>
              </div>
              <Link
                href="/auth"
                className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Start Earning Today
              </Link>
            </div>
            <div className="bg-gray-100 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Monthly Earning Potential</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Part-time (10 hrs/week)</span>
                  <span className="font-semibold">$30-45/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Full-time (40 hrs/week)</span>
                  <span className="font-semibold">$65-85/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Heavy usage (60+ hrs/week)</span>
                  <span className="font-semibold">$85-120/month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Buyers */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Dataset Examples</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="font-medium">Urban Intersections</div>
                  <div className="text-sm text-gray-600">500 hours • $200/hour</div>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="font-medium">Highway Merging</div>
                  <div className="text-sm text-gray-600">300 hours • $150/hour</div>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="font-medium">Parking Scenarios</div>
                  <div className="text-sm text-gray-600">200 hours • $300/hour</div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                For AV Companies
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Users className="h-6 w-6 text-blue-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold">Diverse Real-world Data</h3>
                    <p className="text-gray-600">Access footage from thousands of drivers across different cities and conditions</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Shield className="h-6 w-6 text-green-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold">Pre-processed & Anonymized</h3>
                    <p className="text-gray-600">All data is automatically tagged and privacy-compliant for immediate use</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <BarChart3 className="h-6 w-6 text-purple-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold">Scenario-specific Datasets</h3>
                    <p className="text-gray-600">Filter by location, weather, time of day, and specific driving scenarios</p>
                  </div>
                </div>
              </div>
              <Link
                href="/auth"
                className="inline-block mt-6 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
              >
                Browse Datasets
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-blue-400 mr-2" />
              <span className="text-xl font-bold">DashCache</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 DashCache. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
