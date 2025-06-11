'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, signOut } from '@/lib/auth'
import { Upload, DollarSign, Video, Calendar, LogOut, User } from 'lucide-react'
import VideoUpload from '@/components/VideoUpload'
import EarningsChart from '@/components/EarningsChart'

export default function DriverDashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upload')
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData) {
        router.push('/auth')
        return
      }
      
      if (userData.profile?.user_type !== 'driver') {
        router.push('/')
        return
      }

      setUser(userData.user)
      setProfile(userData.profile)
      
      await Promise.all([
        loadSubmissions(userData.user.id),
        loadEarnings(userData.user.id)
      ])
    } catch (error) {
      console.error('Error loading user data:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async (userId) => {
    const { data, error } = await supabase
      .from('video_submissions')
      .select('*')
      .eq('driver_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading submissions:', error)
    } else {
      setSubmissions(data || [])
    }
  }

  const loadEarnings = async (userId) => {
    const { data, error } = await supabase
      .from('driver_earnings')
      .select('*')
      .eq('driver_id', userId)
      .order('earned_at', { ascending: false })
    
    if (error) {
      console.error('Error loading earnings:', error)
    } else {
      setEarnings(data || [])
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-yellow-600 bg-yellow-100' 
      case 'uploading': return 'text-blue-600 bg-blue-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">\n        <div className=\"text-lg\">Loading...</div>\n      </div>\n    )\n  }

  const totalEarnings = earnings.reduce((sum, earning) => sum + parseFloat(earning.amount || 0), 0)
  const thisMonthEarnings = earnings\n    .filter(e => new Date(e.earned_at).getMonth() === new Date().getMonth())\n    .reduce((sum, earning) => sum + parseFloat(earning.amount || 0), 0)

  return (
    <div className=\"min-h-screen bg-gray-50\">\n      {/* Header */}\n      <header className=\"bg-white shadow-sm border-b\">\n        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">\n          <div className=\"flex justify-between items-center py-4\">\n            <div className=\"flex items-center\">\n              <Video className=\"h-8 w-8 text-blue-600 mr-2\" />\n              <span className=\"text-xl font-bold text-gray-900\">Driver Dashboard</span>\n            </div>\n            <div className=\"flex items-center space-x-4\">\n              <div className=\"flex items-center text-sm text-gray-600\">\n                <User className=\"h-4 w-4 mr-1\" />\n                {profile?.full_name || user?.email}\n              </div>\n              <button\n                onClick={handleSignOut}\n                className=\"flex items-center text-sm text-gray-600 hover:text-gray-900\"\n              >\n                <LogOut className=\"h-4 w-4 mr-1\" />\n                Sign Out\n              </button>\n            </div>\n          </div>\n        </div>\n      </header>\n\n      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">\n        {/* Stats */}\n        <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6 mb-8\">\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <div className=\"flex items-center\">\n              <DollarSign className=\"h-8 w-8 text-green-500\" />\n              <div className=\"ml-4\">\n                <p className=\"text-sm font-medium text-gray-600\">This Month</p>\n                <p className=\"text-2xl font-bold text-gray-900\">${thisMonthEarnings.toFixed(2)}</p>\n              </div>\n            </div>\n          </div>\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <div className=\"flex items-center\">\n              <DollarSign className=\"h-8 w-8 text-blue-500\" />\n              <div className=\"ml-4\">\n                <p className=\"text-sm font-medium text-gray-600\">Total Earnings</p>\n                <p className=\"text-2xl font-bold text-gray-900\">${totalEarnings.toFixed(2)}</p>\n              </div>\n            </div>\n          </div>\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <div className=\"flex items-center\">\n              <Video className=\"h-8 w-8 text-purple-500\" />\n              <div className=\"ml-4\">\n                <p className=\"text-sm font-medium text-gray-600\">Videos Uploaded</p>\n                <p className=\"text-2xl font-bold text-gray-900\">{submissions.length}</p>\n              </div>\n            </div>\n          </div>\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <div className=\"flex items-center\">\n              <Calendar className=\"h-8 w-8 text-orange-500\" />\n              <div className=\"ml-4\">\n                <p className=\"text-sm font-medium text-gray-600\">Hours Contributed</p>\n                <p className=\"text-2xl font-bold text-gray-900\">{profile?.total_footage_contributed || 0}</p>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        {/* Tabs */}\n        <div className=\"bg-white rounded-lg shadow\">\n          <div className=\"border-b border-gray-200\">\n            <nav className=\"-mb-px flex\">\n              {[\n                { id: 'upload', name: 'Upload Videos', icon: Upload },\n                { id: 'submissions', name: 'My Videos', icon: Video },\n                { id: 'earnings', name: 'Earnings', icon: DollarSign }\n              ].map((tab) => {\n                const Icon = tab.icon\n                return (\n                  <button\n                    key={tab.id}\n                    onClick={() => setActiveTab(tab.id)}\n                    className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${\n                      activeTab === tab.id\n                        ? 'border-blue-500 text-blue-600'\n                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'\n                    }`}\n                  >\n                    <Icon className=\"h-4 w-4 mr-2\" />\n                    {tab.name}\n                  </button>\n                )\n              })}\n            </nav>\n          </div>\n\n          <div className=\"p-6\">\n            {activeTab === 'upload' && (\n              <VideoUpload userId={user.id} onUploadComplete={() => loadSubmissions(user.id)} />\n            )}\n\n            {activeTab === 'submissions' && (\n              <div>\n                <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Your Video Submissions</h3>\n                {submissions.length === 0 ? (\n                  <div className=\"text-center py-12\">\n                    <Video className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />\n                    <p className=\"text-gray-500\">No videos uploaded yet. Start by uploading your first video!</p>\n                  </div>\n                ) : (\n                  <div className=\"overflow-x-auto\">\n                    <table className=\"min-w-full divide-y divide-gray-200\">\n                      <thead className=\"bg-gray-50\">\n                        <tr>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Filename\n                          </th>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Status\n                          </th>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Duration\n                          </th>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Uploaded\n                          </th>\n                        </tr>\n                      </thead>\n                      <tbody className=\"bg-white divide-y divide-gray-200\">\n                        {submissions.map((submission) => (\n                          <tr key={submission.id}>\n                            <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900\">\n                              {submission.original_filename}\n                            </td>\n                            <td className=\"px-6 py-4 whitespace-nowrap\">\n                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${\n                                getStatusColor(submission.upload_status)\n                              }`}>\n                                {submission.upload_status}\n                              </span>\n                            </td>\n                            <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">\n                              {submission.duration_seconds ? `${Math.round(submission.duration_seconds / 60)} min` : '-'}\n                            </td>\n                            <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">\n                              {new Date(submission.created_at).toLocaleDateString()}\n                            </td>\n                          </tr>\n                        ))}\n                      </tbody>\n                    </table>\n                  </div>\n                )}\n              </div>\n            )}\n\n            {activeTab === 'earnings' && (\n              <div>\n                <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Earnings History</h3>\n                <div className=\"mb-6\">\n                  <EarningsChart earnings={earnings} />\n                </div>\n                {earnings.length === 0 ? (\n                  <div className=\"text-center py-12\">\n                    <DollarSign className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />\n                    <p className=\"text-gray-500\">No earnings yet. Upload videos to start earning!</p>\n                  </div>\n                ) : (\n                  <div className=\"overflow-x-auto\">\n                    <table className=\"min-w-full divide-y divide-gray-200\">\n                      <thead className=\"bg-gray-50\">\n                        <tr>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Amount\n                          </th>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Type\n                          </th>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Status\n                          </th>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Date\n                          </th>\n                        </tr>\n                      </thead>\n                      <tbody className=\"bg-white divide-y divide-gray-200\">\n                        {earnings.map((earning) => (\n                          <tr key={earning.id}>\n                            <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900\">\n                              ${parseFloat(earning.amount).toFixed(2)}\n                            </td>\n                            <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">\n                              {earning.earning_type.replace('_', ' ')}\n                            </td>\n                            <td className=\"px-6 py-4 whitespace-nowrap\">\n                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${\n                                earning.payment_status === 'paid' ? 'text-green-600 bg-green-100' :\n                                earning.payment_status === 'pending' ? 'text-yellow-600 bg-yellow-100' :\n                                'text-red-600 bg-red-100'\n                              }`}>\n                                {earning.payment_status}\n                              </span>\n                            </td>\n                            <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">\n                              {new Date(earning.earned_at).toLocaleDateString()}\n                            </td>\n                          </tr>\n                        ))}\n                      </tbody>\n                    </table>\n                  </div>\n                )}\n              </div>\n            )}\n          </div>\n        </div>\n      </div>\n    </div>\n  )\n}