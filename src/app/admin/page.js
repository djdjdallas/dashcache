'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, signOut } from '@/lib/auth'
import { 
  Users, 
  Video, 
  DollarSign, 
  BarChart3, 
  Settings, 
  CheckCircle, 
  XCircle,
  Clock,
  LogOut,
  User,
  Shield
} from 'lucide-react'

export default function AdminPanel() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({})
  const [pendingVideos, setPendingVideos] = useState([])
  const [users, setUsers] = useState([])
  const [earnings, setEarnings] = useState([])
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      loadAdminData()
    }
  }, [profile])

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData) {
        router.push('/auth')
        return
      }
      
      console.log('User data:', userData.user?.email, 'Profile:', userData.profile?.user_type)
      
      if (userData.profile?.user_type !== 'admin') {
        console.log('Not admin, redirecting to home')
        router.push('/')
        return
      }

      setUser(userData.user)
      setProfile(userData.profile)
    } catch (error) {
      console.error('Error loading user data:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const loadAdminData = async () => {
    await Promise.all([
      loadStats(),
      loadPendingVideos(),
      loadUsers(),
      loadEarnings()
    ])
  }

  const loadStats = async () => {
    try {
      const [
        { count: totalUsers },
        { count: totalVideos },
        { count: totalEarnings },
        { count: pendingReviews }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('video_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('driver_earnings').select('*', { count: 'exact', head: true }),
        supabase.from('video_scenarios').select('*', { count: 'exact', head: true }).eq('is_approved', false)
      ])

      const { data: revenueData } = await supabase
        .from('purchases')
        .select('amount_paid')
        .eq('payment_status', 'completed')

      const totalRevenue = revenueData?.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0) || 0

      setStats({
        totalUsers: totalUsers || 0,
        totalVideos: totalVideos || 0,
        totalEarnings: totalEarnings || 0,
        pendingReviews: pendingReviews || 0,
        totalRevenue
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadPendingVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('video_scenarios')
        .select(`
          *,
          video_submissions (
            original_filename,
            mux_playback_id,
            profiles (
              full_name,
              email
            )
          )
        `)
        .eq('is_approved', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading pending videos:', error)
      } else {
        setPendingVideos(data || [])
      }
    } catch (error) {
      console.error('Error loading pending videos:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading users:', error)
      } else {
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_earnings')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('earned_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading earnings:', error)
      } else {
        setEarnings(data || [])
      }
    } catch (error) {
      console.error('Error loading earnings:', error)
    }
  }

  const approveScenario = async (scenarioId) => {
    try {
      const { error } = await supabase
        .from('video_scenarios')
        .update({ is_approved: true })
        .eq('id', scenarioId)

      if (error) {
        console.error('Error approving scenario:', error)
      } else {
        await loadPendingVideos()
        await loadStats()
      }
    } catch (error) {
      console.error('Error approving scenario:', error)
    }
  }

  const rejectScenario = async (scenarioId) => {
    try {
      const { error } = await supabase
        .from('video_scenarios')
        .delete()
        .eq('id', scenarioId)

      if (error) {
        console.error('Error rejecting scenario:', error)
      } else {
        await loadPendingVideos()
        await loadStats()
      }
    } catch (error) {
      console.error('Error rejecting scenario:', error)
    }
  }

  const toggleUserVerification = async (userId) => {
    try {
      const user = users.find(u => u.id === userId)
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !user.is_verified })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user verification:', error)
      } else {
        await loadUsers()
      }
    } catch (error) {
      console.error('Error updating user verification:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading admin panel...</div>
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
              <Shield className="h-8 w-8 text-red-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-1" />
                {profile?.full_name || user?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Videos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue?.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEarnings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'content', name: 'Content Moderation', icon: Video },
                { id: 'users', name: 'User Management', icon: Users },
                { id: 'earnings', name: 'Earnings', icon: DollarSign }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>• {stats.pendingReviews} scenarios awaiting approval</p>
                      <p>• {stats.totalUsers} total users registered</p>
                      <p>• {stats.totalVideos} videos uploaded</p>
                      <p>• ${stats.totalRevenue?.toFixed(2)} in total revenue</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                      <button 
                        onClick={() => setActiveTab('content')}
                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Review pending content
                      </button>
                      <button 
                        onClick={() => setActiveTab('earnings')}
                        className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded"
                      >
                        Process driver payouts
                      </button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded">
                        Generate platform report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Content Moderation</h3>
                {pendingVideos.length === 0 ? (
                  <p className="text-gray-500">No pending content to review.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingVideos.map((scenario) => (
                      <div key={scenario.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {scenario.video_submissions?.original_filename}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Scenario: {scenario.scenario_type} | 
                              Confidence: {(scenario.confidence_score * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-500">
                              Driver: {scenario.video_submissions?.profiles?.full_name || 'Unknown'}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {scenario.tags && JSON.parse(scenario.tags || '[]').map((tag, i) => (
                                <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => approveScenario(scenario.id)}
                              className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => rejectScenario(scenario.id)}
                              className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name || 'No name'}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.user_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.is_verified ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                            }`}>
                              {user.is_verified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleUserVerification(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {user.is_verified ? 'Unverify' : 'Verify'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'earnings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Earnings</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Driver
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {earnings.map((earning) => (
                        <tr key={earning.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {earning.profiles?.full_name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${parseFloat(earning.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {earning.earning_type.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              earning.payment_status === 'paid' ? 'text-green-600 bg-green-100' :
                              earning.payment_status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                              'text-red-600 bg-red-100'
                            }`}>
                              {earning.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(earning.earned_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}