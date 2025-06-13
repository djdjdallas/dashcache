import { EARNINGS_TIERS } from '@/lib/earningsCalculator'

export default function DriverEarnings({ profile, earnings }) {
  const getCurrentTier = () => {
    const videoCount = profile?.total_videos_submitted || 0
    if (videoCount >= EARNINGS_TIERS.PLATINUM.minVideos) return EARNINGS_TIERS.PLATINUM
    if (videoCount >= EARNINGS_TIERS.GOLD.minVideos) return EARNINGS_TIERS.GOLD
    if (videoCount >= EARNINGS_TIERS.SILVER.minVideos) return EARNINGS_TIERS.SILVER
    return EARNINGS_TIERS.BRONZE
  }
  
  const getNextTier = () => {
    const current = getCurrentTier()
    if (current.label === 'Bronze') return EARNINGS_TIERS.SILVER
    if (current.label === 'Silver') return EARNINGS_TIERS.GOLD
    if (current.label === 'Gold') return EARNINGS_TIERS.PLATINUM
    return null
  }
  
  const currentTier = getCurrentTier()
  const nextTier = getNextTier()
  const videosToNext = nextTier ? nextTier.minVideos - (profile?.total_videos_submitted || 0) : 0
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Status</h3>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Current Tier</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            currentTier.label === 'Bronze' ? 'bg-orange-100 text-orange-800' :
            currentTier.label === 'Silver' ? 'bg-gray-100 text-gray-800' :
            currentTier.label === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {currentTier.label} Driver
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Base rate: ${currentTier.baseRate.toFixed(2)}/minute
        </p>
        {nextTier && (
          <p className="text-sm text-blue-600 mt-1">
            {videosToNext} more videos to {nextTier.label} (${nextTier.baseRate.toFixed(2)}/min)
          </p>
        )}
      </div>
      
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Earning Potential</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Regular driving:</span>
            <span className="font-medium">${(currentTier.baseRate * 60).toFixed(2)}/hour</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">High-quality footage:</span>
            <span className="font-medium">${((currentTier.baseRate + 0.02) * 60).toFixed(2)}/hour</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">With all bonuses:</span>
            <span className="font-medium text-green-600">Up to $12/hour</span>
          </div>
        </div>
      </div>
      
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Edge Case Bounties</h4>
        <p className="text-sm text-gray-600 mb-2">
          Capture rare events for bonus payments:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Emergency vehicles:</span>
            <span className="font-medium text-green-600">+$25</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Extreme weather:</span>
            <span className="font-medium text-green-600">+$20</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Construction zones:</span>
            <span className="font-medium text-green-600">+$5-15</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Animal encounters:</span>
            <span className="font-medium text-green-600">+$15</span>
          </div>
        </div>
      </div>
    </div>
  )
}