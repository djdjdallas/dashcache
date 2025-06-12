'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  Eye,
  Play,
  RefreshCw,
  TrendingUp,
  Video,
  Zap
} from 'lucide-react'

export default function MonitoringDashboard() {
  const [user, setUser] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadMetrics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkAuth = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData || userData.profile?.user_type !== 'admin') {
        router.push('/auth')
        return
      }
      setUser(userData)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/auth')
    }
  }

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/pipeline-status')
      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      const data = await response.json()
      setMetrics(data)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'slow': return 'text-orange-600 bg-orange-100'
      case 'needs_attention': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'degraded': 
      case 'slow':
      case 'needs_attention': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading monitoring dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">Pipeline Monitoring</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                onClick={loadMetrics}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Webhook Health</p>
                <div className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(metrics?.healthStatus?.webhooks)}`}>
                  {getStatusIcon(metrics?.healthStatus?.webhooks)}
                  <span className="ml-1">{metrics?.healthStatus?.webhooks}</span>
                </div>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing Speed</p>
                <div className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(metrics?.healthStatus?.processing)}`}>
                  {getStatusIcon(metrics?.healthStatus?.processing)}
                  <span className="ml-1">{metrics?.healthStatus?.processing}</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scenario Quality</p>
                <div className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(metrics?.healthStatus?.scenarios)}`}>
                  {getStatusIcon(metrics?.healthStatus?.scenarios)}
                  <span className="ml-1">{metrics?.healthStatus?.scenarios}</span>
                </div>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Videos</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.overview?.totalVideos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Activity (24h)</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.overview?.recentActivity}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stuck Videos</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.overview?.stuckVideos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.overview?.avgProcessingTime}m</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Breakdown */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Processing Status</h3>
            </div>
            <div className="p-6">
              {metrics?.statusBreakdown && Object.entries(metrics.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center py-2">
                  <span className="capitalize text-gray-700">{status.replace('_', ' ')}</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario Metrics */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Scenario Analysis</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Scenarios</p>
                  <p className="text-xl font-bold">{metrics?.scenarioMetrics?.totalScenarios}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Confidence</p>
                  <p className="text-xl font-bold">{(metrics?.scenarioMetrics?.avgConfidence * 100).toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {metrics?.scenarioMetrics?.scenarioBreakdown && Object.entries(metrics.scenarioMetrics.scenarioBreakdown).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Submissions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {metrics?.recentActivity?.map((submission) => (
                  <div key={submission.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {submission.original_filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(submission.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      submission.upload_status === 'completed' ? 'bg-green-100 text-green-800' :
                      submission.upload_status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submission.upload_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stuck Videos */}
          {metrics?.stuckVideos?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 text-red-600">⚠️ Stuck Videos</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {metrics.stuckVideos.map((video) => (
                    <div key={video.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {video.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          Stuck for {video.stuckDuration} minutes
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        {video.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}