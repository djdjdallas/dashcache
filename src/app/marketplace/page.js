'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
      if (!userData) {
        router.push('/auth')
        return
      }
      
      setUser(userData.user)
      setProfile(userData.profile)
    } catch (error) {
      console.error('Error loading user data:', error)
      router.push('/auth')
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
      <div className=\"min-h-screen flex items-center justify-center\">\n        <div className=\"text-lg\">Loading marketplace...</div>\n      </div>\n    )\n  }

  return (
    <div className=\"min-h-screen bg-gray-50\">\n      {/* Header */}\n      <header className=\"bg-white shadow-sm border-b\">\n        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">\n          <div className=\"flex justify-between items-center py-4\">\n            <div className=\"flex items-center\">\n              <ShoppingCart className=\"h-8 w-8 text-purple-600 mr-2\" />\n              <span className=\"text-xl font-bold text-gray-900\">AI Training Data Marketplace</span>\n            </div>\n            <div className=\"flex items-center space-x-4\">\n              {cart.length > 0 && (\n                <div className=\"flex items-center space-x-2\">\n                  <span className=\"text-sm text-gray-600\">\n                    Cart: {cart.length} items ({formatPrice(getTotalPrice())})\n                  </span>\n                  <button\n                    onClick={handleCheckout}\n                    className=\"px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700\"\n                  >\n                    Checkout\n                  </button>\n                </div>\n              )}\n              <div className=\"flex items-center text-sm text-gray-600\">\n                <User className=\"h-4 w-4 mr-1\" />\n                {profile?.company_name || profile?.full_name || user?.email}\n              </div>\n              <button\n                onClick={handleSignOut}\n                className=\"flex items-center text-sm text-gray-600 hover:text-gray-900\"\n              >\n                <LogOut className=\"h-4 w-4 mr-1\" />\n                Sign Out\n              </button>\n            </div>\n          </div>\n        </div>\n      </header>\n\n      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">\n        {/* Filters */}\n        <div className=\"bg-white rounded-lg shadow mb-8\">\n          <div className=\"px-6 py-4 border-b border-gray-200\">\n            <button\n              onClick={() => setShowFilters(!showFilters)}\n              className=\"flex items-center text-lg font-medium text-gray-900\"\n            >\n              <Filter className=\"h-5 w-5 mr-2\" />\n              Filters\n            </button>\n          </div>\n          \n          {showFilters && (\n            <div className=\"px-6 py-4\">\n              <div className=\"grid grid-cols-1 md:grid-cols-5 gap-4\">\n                <div>\n                  <label className=\"block text-sm font-medium text-gray-700 mb-1\">\n                    Scenario Type\n                  </label>\n                  <select\n                    value={filters.scenario}\n                    onChange={(e) => setFilters({ ...filters, scenario: e.target.value })}\n                    className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500\"\n                  >\n                    <option value=\"\">All Scenarios</option>\n                    <option value=\"intersection_turn\">Intersection Turns</option>\n                    <option value=\"pedestrian_crossing\">Pedestrian Crossings</option>\n                    <option value=\"parking\">Parking Maneuvers</option>\n                    <option value=\"highway_merging\">Highway Merging</option>\n                    <option value=\"weather_driving\">Weather Conditions</option>\n                  </select>\n                </div>\n                \n                <div>\n                  <label className=\"block text-sm font-medium text-gray-700 mb-1\">\n                    Location\n                  </label>\n                  <input\n                    type=\"text\"\n                    placeholder=\"City, State\"\n                    value={filters.location}\n                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}\n                    className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500\"\n                  />\n                </div>\n                \n                <div>\n                  <label className=\"block text-sm font-medium text-gray-700 mb-1\">\n                    Weather\n                  </label>\n                  <select\n                    value={filters.weather}\n                    onChange={(e) => setFilters({ ...filters, weather: e.target.value })}\n                    className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500\"\n                  >\n                    <option value=\"\">All Weather</option>\n                    <option value=\"clear\">Clear</option>\n                    <option value=\"rainy\">Rainy</option>\n                    <option value=\"snowy\">Snowy</option>\n                    <option value=\"foggy\">Foggy</option>\n                  </select>\n                </div>\n                \n                <div>\n                  <label className=\"block text-sm font-medium text-gray-700 mb-1\">\n                    Min Hours\n                  </label>\n                  <input\n                    type=\"number\"\n                    placeholder=\"0\"\n                    value={filters.minHours}\n                    onChange={(e) => setFilters({ ...filters, minHours: e.target.value })}\n                    className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500\"\n                  />\n                </div>\n                \n                <div>\n                  <label className=\"block text-sm font-medium text-gray-700 mb-1\">\n                    Max Price\n                  </label>\n                  <input\n                    type=\"number\"\n                    placeholder=\"1000\"\n                    value={filters.maxPrice}\n                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}\n                    className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500\"\n                  />\n                </div>\n              </div>\n            </div>\n          )}\n        </div>\n\n        {/* Packages Grid */}\n        {filteredPackages.length === 0 ? (\n          <div className=\"text-center py-12\">\n            <ShoppingCart className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />\n            <p className=\"text-gray-500\">No datasets match your filters. Try adjusting your criteria.</p>\n          </div>\n        ) : (\n          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">\n            {filteredPackages.map((pkg) => (\n              <div key={pkg.id} className=\"bg-white rounded-lg shadow hover:shadow-lg transition-shadow\">\n                <div className=\"p-6\">\n                  <div className=\"flex items-start justify-between mb-4\">\n                    <h3 className=\"text-lg font-semibold text-gray-900\">{pkg.title}</h3>\n                    <div className=\"text-right\">\n                      <div className=\"text-sm text-gray-500\">{formatPrice(pkg.price_per_hour)}/hour</div>\n                      <div className=\"text-xl font-bold text-purple-600\">{formatPrice(pkg.total_price)}</div>\n                    </div>\n                  </div>\n                  \n                  <p className=\"text-gray-600 text-sm mb-4\">{pkg.description}</p>\n                  \n                  <div className=\"space-y-2 mb-4\">\n                    <div className=\"flex items-center text-sm text-gray-600\">\n                      <Clock className=\"h-4 w-4 mr-2\" />\n                      {pkg.total_duration_hours} hours ({pkg.total_clips} clips)\n                    </div>\n                    \n                    {pkg.geographic_coverage && (\n                      <div className=\"flex items-center text-sm text-gray-600\">\n                        <MapPin className=\"h-4 w-4 mr-2\" />\n                        {Array.isArray(pkg.geographic_coverage) \n                          ? pkg.geographic_coverage.join(', ') \n                          : pkg.geographic_coverage}\n                      </div>\n                    )}\n                    \n                    {pkg.weather_conditions && (\n                      <div className=\"flex items-center text-sm text-gray-600\">\n                        <Cloud className=\"h-4 w-4 mr-2\" />\n                        {Array.isArray(pkg.weather_conditions)\n                          ? pkg.weather_conditions.join(', ')\n                          : pkg.weather_conditions}\n                      </div>\n                    )}\n                  </div>\n                  \n                  {/* Scenario Types */}\n                  <div className=\"mb-4\">\n                    <div className=\"flex flex-wrap gap-2\">\n                      {pkg.scenario_types?.map((scenario, index) => (\n                        <span\n                          key={index}\n                          className=\"inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full\"\n                        >\n                          <span className=\"mr-1\">{getScenarioIcon(scenario)}</span>\n                          {scenario.replace('_', ' ')}\n                        </span>\n                      ))}\n                    </div>\n                  </div>\n                  \n                  <div className=\"flex space-x-2\">\n                    <button\n                      className=\"flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg\"\n                    >\n                      <Play className=\"h-4 w-4 mr-2\" />\n                      Preview\n                    </button>\n                    \n                    {cart.find(item => item.id === pkg.id) ? (\n                      <button\n                        onClick={() => removeFromCart(pkg.id)}\n                        className=\"flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg\"\n                      >\n                        Remove\n                      </button>\n                    ) : (\n                      <button\n                        onClick={() => addToCart(pkg)}\n                        className=\"flex-1 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg\"\n                      >\n                        Add to Cart\n                      </button>\n                    )}\n                  </div>\n                </div>\n              </div>\n            ))}\n          </div>\n        )}\n      </div>\n    </div>\n  )\n}