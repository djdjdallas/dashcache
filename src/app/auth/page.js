'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Camera, Eye, EyeOff, Mail, Lock, User, Phone, Building, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [userType, setUserType] = useState('driver')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    companyName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        
        if (error) throw error
        
        // Redirect based on user type
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', data.user.id)
          .single()
        
        if (profile?.user_type === 'driver') {
          router.push('/driver-dashboard')
        } else if (profile?.user_type === 'buyer') {
          router.push('/marketplace')
        } else if (profile?.user_type === 'admin') {
          router.push('/admin')
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })
        
        if (error) throw error
        
        // Create profile
        if (data.user) {
          const profileData = {
            id: data.user.id,
            user_type: userType,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
          }
          
          if (userType === 'buyer') {
            profileData.company_name = formData.companyName
          }
          
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([profileData])
          
          if (profileError) throw profileError
          
          // Redirect to appropriate dashboard
          if (userType === 'driver') {
            router.push('/driver-dashboard')
          } else {
            router.push('/marketplace')
          }
        }
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-purple-900/20 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/10 to-transparent"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="container mx-auto px-4 md:px-6 max-w-7xl py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5" />
              <Camera className="h-6 w-6 text-blue-500" />
              <span className="font-bold text-xl">DashCache</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-green-500">
                {isLogin ? 'Welcome Back' : 'Join DashCache'}
              </h2>
              <p className="mt-4 text-gray-400">
                {isLogin 
                  ? 'Sign in to your account to continue'
                  : 'Create your account and start contributing to the future of AI'
                }
              </p>
            </div>

            {/* Form */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8 shadow-2xl">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                {!isLogin && (
                  <>
                    {/* User Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        I want to:
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                          userType === 'driver' 
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                            : 'border-gray-700 hover:border-gray-600'
                        }`}>
                          <input
                            type="radio"
                            value="driver"
                            checked={userType === 'driver'}
                            onChange={(e) => setUserType(e.target.value)}
                            className="sr-only"
                          />
                          <div className="text-sm font-medium">Upload Footage</div>
                          <div className="text-xs text-gray-400 mt-1">Driver/Creator</div>
                        </label>
                        <label className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                          userType === 'buyer' 
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
                            : 'border-gray-700 hover:border-gray-600'
                        }`}>
                          <input
                            type="radio"
                            value="buyer"
                            checked={userType === 'buyer'}
                            onChange={(e) => setUserType(e.target.value)}
                            className="sr-only"
                          />
                          <div className="text-sm font-medium">Buy Data</div>
                          <div className="text-xs text-gray-400 mt-1">Company/Researcher</div>
                        </label>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          required
                          className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                
                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="block w-full pl-10 pr-10 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {!isLogin && (
                  <>
                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    {/* Company Name for Buyers */}
                    {userType === 'buyer' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Company Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Enter your company name"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>
              
              {/* Toggle Login/Signup */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}