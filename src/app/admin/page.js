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
      
      if (userData.profile?.user_type !== 'admin') {
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
      <div className=\"min-h-screen flex items-center justify-center\">\n        <div className=\"text-lg\">Loading admin panel...</div>\n      </div>\n    )\n  }

  return (
    <div className=\"min-h-screen bg-gray-50\">\n      {/* Header */}\n      <header className=\"bg-white shadow-sm border-b\">\n        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">\n          <div className=\"flex justify-between items-center py-4\">\n            <div className=\"flex items-center\">\n              <Shield className=\"h-8 w-8 text-red-600 mr-2\" />\n              <span className=\"text-xl font-bold text-gray-900\">Admin Panel</span>\n            </div>\n            <div className=\"flex items-center space-x-4\">\n              <div className=\"flex items-center text-sm text-gray-600\">\n                <User className=\"h-4 w-4 mr-1\" />\n                {profile?.full_name || user?.email}\n              </div>\n              <button\n                onClick={handleSignOut}\n                className=\"flex items-center text-sm text-gray-600 hover:text-gray-900\"\n              >\n                <LogOut className=\"h-4 w-4 mr-1\" />\n                Sign Out\n              </button>\n            </div>\n          </div>\n        </div>\n      </header>\n\n      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">\n        {/* Stats */}\n        <div className=\"grid grid-cols-1 md:grid-cols-5 gap-6 mb-8\">\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <div className=\"flex items-center\">\n              <Users className=\"h-8 w-8 text-blue-500\" />\n              <div className=\"ml-4\">\n                <p className=\"text-sm font-medium text-gray-600\">Total Users</p>\n                <p className=\"text-2xl font-bold text-gray-900\">{stats.totalUsers}</p>\n              </div>\n            </div>\n          </div>\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <div className=\"flex items-center\">\n              <Video className=\"h-8 w-8 text-purple-500\" />\n              <div className=\"ml-4\">\n                <p className=\"text-sm font-medium text-gray-600\">Videos</p>\n                <p className=\"text-2xl font-bold text-gray-900\">{stats.totalVideos}</p>\n              </div>\n            </div>\n          </div>\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <div className=\"flex items-center\">\n              <DollarSign className=\"h-8 w-8 text-green-500\" />\n              <div className=\"ml-4\">\n                <p className=\"text-sm font-medium text-gray-600\">Revenue</p>\n                <p className=\"text-2xl font-bold text-gray-900\">${stats.totalRevenue?.toFixed(2)}</p>\n              </div>\n            </div>\n          </div>\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <div className=\"flex items-center\">\n              <BarChart3 className=\"h-8 w-8 text-orange-500\" />\n              <div className=\"ml-4\">\n                <p className=\"text-sm font-medium text-gray-600\">Earnings</p>\n                <p className=\"text-2xl font-bold text-gray-900\">{stats.totalEarnings}</p>\n              </div>\n            </div>\n          </div>\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <div className=\"flex items-center\">\n              <Clock className=\"h-8 w-8 text-red-500\" />\n              <div className=\"ml-4\">\n                <p className=\"text-sm font-medium text-gray-600\">Pending Reviews</p>\n                <p className=\"text-2xl font-bold text-gray-900\">{stats.pendingReviews}</p>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        {/* Tabs */}\n        <div className=\"bg-white rounded-lg shadow\">\n          <div className=\"border-b border-gray-200\">\n            <nav className=\"-mb-px flex\">\n              {[\n                { id: 'overview', name: 'Overview', icon: BarChart3 },\n                { id: 'content', name: 'Content Moderation', icon: Video },\n                { id: 'users', name: 'User Management', icon: Users },\n                { id: 'earnings', name: 'Earnings', icon: DollarSign }\n              ].map((tab) => {\n                const Icon = tab.icon\n                return (\n                  <button\n                    key={tab.id}\n                    onClick={() => setActiveTab(tab.id)}\n                    className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${\n                      activeTab === tab.id\n                        ? 'border-red-500 text-red-600'\n                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'\n                    }`}\n                  >\n                    <Icon className=\"h-4 w-4 mr-2\" />\n                    {tab.name}\n                  </button>\n                )\n              })}\n            </nav>\n          </div>\n\n          <div className=\"p-6\">\n            {activeTab === 'overview' && (\n              <div>\n                <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Platform Overview</h3>\n                <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n                  <div>\n                    <h4 className=\"font-medium text-gray-900 mb-2\">Recent Activity</h4>\n                    <div className=\"text-sm text-gray-600 space-y-2\">\n                      <p>• {stats.pendingReviews} scenarios awaiting approval</p>\n                      <p>• {stats.totalUsers} total users registered</p>\n                      <p>• {stats.totalVideos} videos uploaded</p>\n                      <p>• ${stats.totalRevenue?.toFixed(2)} in total revenue</p>\n                    </div>\n                  </div>\n                  <div>\n                    <h4 className=\"font-medium text-gray-900 mb-2\">Quick Actions</h4>\n                    <div className=\"space-y-2\">\n                      <button className=\"block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded\">\n                        Review pending content\n                      </button>\n                      <button className=\"block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded\">\n                        Process driver payouts\n                      </button>\n                      <button className=\"block w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded\">\n                        Generate platform report\n                      </button>\n                    </div>\n                  </div>\n                </div>\n              </div>\n            )}\n\n            {activeTab === 'content' && (\n              <div>\n                <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Content Moderation</h3>\n                {pendingVideos.length === 0 ? (\n                  <p className=\"text-gray-500\">No pending content to review.</p>\n                ) : (\n                  <div className=\"space-y-4\">\n                    {pendingVideos.map((scenario) => (\n                      <div key={scenario.id} className=\"border border-gray-200 rounded-lg p-4\">\n                        <div className=\"flex justify-between items-start\">\n                          <div className=\"flex-1\">\n                            <h4 className=\"font-medium text-gray-900\">\n                              {scenario.video_submissions?.original_filename}\n                            </h4>\n                            <p className=\"text-sm text-gray-600 mt-1\">\n                              Scenario: {scenario.scenario_type} | \n                              Confidence: {(scenario.confidence_score * 100).toFixed(1)}%\n                            </p>\n                            <p className=\"text-sm text-gray-500\">\n                              Driver: {scenario.video_submissions?.profiles?.full_name || 'Unknown'}\n                            </p>\n                            <div className=\"flex flex-wrap gap-1 mt-2\">\n                              {scenario.tags && scenario.tags.map((tag, i) => (\n                                <span key={i} className=\"px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded\">\n                                  {tag}\n                                </span>\n                              ))}\n                            </div>\n                          </div>\n                          <div className=\"flex space-x-2 ml-4\">\n                            <button\n                              onClick={() => approveScenario(scenario.id)}\n                              className=\"flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700\"\n                            >\n                              <CheckCircle className=\"h-4 w-4 mr-1\" />\n                              Approve\n                            </button>\n                            <button\n                              onClick={() => rejectScenario(scenario.id)}\n                              className=\"flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700\"\n                            >\n                              <XCircle className=\"h-4 w-4 mr-1\" />\n                              Reject\n                            </button>\n                          </div>\n                        </div>\n                      </div>\n                    ))}\n                  </div>\n                )}\n              </div>\n            )}\n\n            {activeTab === 'users' && (\n              <div>\n                <h3 className=\"text-lg font-medium text-gray-900 mb-4\">User Management</h3>\n                <div className=\"overflow-x-auto\">\n                  <table className=\"min-w-full divide-y divide-gray-200\">\n                    <thead className=\"bg-gray-50\">\n                      <tr>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">\n                          User\n                        </th>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">\n                          Type\n                        </th>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">\n                          Status\n                        </th>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">\n                          Joined\n                        </th>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">\n                          Actions\n                        </th>\n                      </tr>\n                    </thead>\n                    <tbody className=\"bg-white divide-y divide-gray-200\">\n                      {users.map((user) => (\n                        <tr key={user.id}>\n                          <td className=\"px-6 py-4 whitespace-nowrap\">\n                            <div>\n                              <div className=\"text-sm font-medium text-gray-900\">\n                                {user.full_name || 'No name'}\n                              </div>\n                              <div className=\"text-sm text-gray-500\">{user.email}</div>\n                            </div>\n                          </td>\n                          <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">\n                            {user.user_type}\n                          </td>\n                          <td className=\"px-6 py-4 whitespace-nowrap\">\n                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${\n                              user.is_verified ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'\n                            }`}>\n                              {user.is_verified ? 'Verified' : 'Unverified'}\n                            </span>\n                          </td>\n                          <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">\n                            {new Date(user.created_at).toLocaleDateString()}\n                          </td>\n                          <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium\">\n                            <button\n                              onClick={() => toggleUserVerification(user.id)}\n                              className=\"text-blue-600 hover:text-blue-900\"\n                            >\n                              {user.is_verified ? 'Unverify' : 'Verify'}\n                            </button>\n                          </td>\n                        </tr>\n                      ))}\n                    </tbody>\n                  </table>\n                </div>\n              </div>\n            )}\n\n            {activeTab === 'earnings' && (\n              <div>\n                <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Driver Earnings</h3>\n                <div className=\"overflow-x-auto\">\n                  <table className=\"min-w-full divide-y divide-gray-200\">\n                    <thead className=\"bg-gray-50\">\n                      <tr>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">\n                          Driver\n                        </th>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">\n                          Amount\n                        </th>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">\n                          Type\n                        </th>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">\n                          Status\n                        </th>\n                        <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">\n                          Date\n                        </th>\n                      </tr>\n                    </thead>\n                    <tbody className=\"bg-white divide-y divide-gray-200\">\n                      {earnings.map((earning) => (\n                        <tr key={earning.id}>\n                          <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">\n                            {earning.profiles?.full_name || 'Unknown'}\n                          </td>\n                          <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">\n                            ${parseFloat(earning.amount).toFixed(2)}\n                          </td>\n                          <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">\n                            {earning.earning_type.replace('_', ' ')}\n                          </td>\n                          <td className=\"px-6 py-4 whitespace-nowrap\">\n                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${\n                              earning.payment_status === 'paid' ? 'text-green-600 bg-green-100' :\n                              earning.payment_status === 'pending' ? 'text-yellow-600 bg-yellow-100' :\n                              'text-red-600 bg-red-100'\n                            }`}>\n                              {earning.payment_status}\n                            </span>\n                          </td>\n                          <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">\n                            {new Date(earning.earned_at).toLocaleDateString()}\n                          </td>\n                        </tr>\n                      ))}\n                    </tbody>\n                  </table>\n                </div>\n              </div>\n            )}\n          </div>\n        </div>\n      </div>\n    </div>\n  )\n}