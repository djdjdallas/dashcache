'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, signOut } from '@/lib/auth'
import { Filter, Play, ShoppingCart, Download, MapPin, Cloud, Clock, LogOut, User } from 'lucide-react'

export default function Marketplace() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [packages, setPackages] = useState([])
  const [filteredPackages, setFilteredPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [filters, setFilters] = useState({
    scenario: '',
    location: '',
    weather: '',
    minHours: '',
    maxPrice: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
    loadPackages()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [packages, filters])

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser()
      if (userData) {
        setUser(userData.user)
        setProfile(userData.profile)
      }
      // Don't redirect if no user - allow public browsing
    } catch (error) {
      console.error('Error loading user data:', error)
      // Don't redirect on error - allow public browsing
    }
  }

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('data_packages')
        .select(`
          *,
          package_scenarios (
            video_scenarios (
              scenario_type,
              tags,
              location_data
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading packages:', error)
      } else {
        setPackages(data || [])
      }
    } catch (error) {
      console.error('Error loading packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = packages

    if (filters.scenario) {
      filtered = filtered.filter(pkg => 
        pkg.scenario_types?.includes(filters.scenario)
      )
    }

    if (filters.minHours) {
      filtered = filtered.filter(pkg => 
        pkg.total_duration_hours >= parseFloat(filters.minHours)
      )
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(pkg => 
        pkg.total_price <= parseFloat(filters.maxPrice)
      )
    }

    setFilteredPackages(filtered)
  }

  const addToCart = (packageData) => {
    if (!user) {
      router.push('/auth')
      return
    }
    if (!cart.find(item => item.id === packageData.id)) {
      setCart([...cart, packageData])
    }
  }

  const removeFromCart = (packageId) => {
    setCart(cart.filter(item => item.id !== packageId))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.total_price, 0)
  }

  const handleCheckout = () => {
    if (!user) {
      router.push('/auth')
      return
    }
    if (cart.length === 0) return
    
    // Store cart in localStorage for checkout page
    localStorage.setItem('marketplace_cart', JSON.stringify(cart))
    router.push('/checkout')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getScenarioIcon = (scenario) => {
    switch (scenario) {
      case 'intersection_turn': return '🚦'
      case 'pedestrian_crossing': return '🚶'
      case 'parking': return '🅿️'
      case 'highway_merging': return '🛣️'
      case 'weather_driving': return '🌧️'
      default: return '🚗'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading marketplace...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-purple-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">AI Training Data Marketplace</span>
            </div>
            <div className="flex items-center space-x-4">
              {user && cart.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Cart: {cart.length} items ({formatPrice(getTotalPrice())})
                  </span>
                  <button
                    onClick={handleCheckout}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                  >
                    Checkout
                  </button>
                </div>
              )}
              
              {user ? (
                <>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-1" />
                    {profile?.company_name || profile?.full_name || user?.email}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth">
                    <button className="px-4 py-2 text-purple-600 text-sm font-medium hover:text-purple-700">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth">
                    <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">
                      Get Started
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-lg font-medium text-gray-900"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
          
          {showFilters && (
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scenario Type
                  </label>
                  <select
                    value={filters.scenario}
                    onChange={(e) => setFilters({ ...filters, scenario: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Scenarios</option>
                    <option value="intersection_turn">Intersection Turns</option>
                    <option value="pedestrian_crossing">Pedestrian Crossings</option>
                    <option value="parking">Parking Maneuvers</option>
                    <option value="highway_merging">Highway Merging</option>
                    <option value="weather_driving">Weather Conditions</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, State"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weather
                  </label>
                  <select
                    value={filters.weather}
                    onChange={(e) => setFilters({ ...filters, weather: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Weather</option>
                    <option value="clear">Clear</option>
                    <option value="rainy">Rainy</option>
                    <option value="snowy">Snowy</option>
                    <option value="foggy">Foggy</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Hours
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minHours}
                    onChange={(e) => setFilters({ ...filters, minHours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Packages Grid */}
        {filteredPackages.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No datasets match your filters. Try adjusting your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{pkg.title}</h3>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{formatPrice(pkg.price_per_hour)}/hour</div>
                      <div className="text-xl font-bold text-purple-600">{formatPrice(pkg.total_price)}</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {pkg.total_duration_hours} hours ({pkg.total_clips} clips)
                    </div>
                    
                    {pkg.geographic_coverage && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {Array.isArray(pkg.geographic_coverage) 
                          ? pkg.geographic_coverage.join(', ') 
                          : pkg.geographic_coverage}
                      </div>
                    )}
                    
                    {pkg.weather_conditions && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Cloud className="h-4 w-4 mr-2" />
                        {Array.isArray(pkg.weather_conditions)
                          ? pkg.weather_conditions.join(', ')
                          : pkg.weather_conditions}
                      </div>
                    )}
                  </div>
                  
                  {/* Scenario Types */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {pkg.scenario_types?.map((scenario, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                        >
                          <span className="mr-1">{getScenarioIcon(scenario)}</span>
                          {scenario.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Preview
                    </button>
                    
                    {user && cart.find(item => item.id === pkg.id) ? (
                      <button
                        onClick={() => removeFromCart(pkg.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCart(pkg)}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg"
                      >
                        {user ? 'Add to Cart' : 'Sign In to Purchase'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}