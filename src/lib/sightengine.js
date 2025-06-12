if (!process.env.SIGHTENGINE_API_USER || !process.env.SIGHTENGINE_API_SECRET) {
  throw new Error('Missing required SightEngine environment variables')
}

export const anonymizeVideo = async (videoUrl, options = {}) => {
  try {
    const formData = new FormData()
    formData.append('media', videoUrl)
    formData.append('models', 'face-attributes,object-detection')
    formData.append('api_user', process.env.SIGHTENGINE_API_USER)
    formData.append('api_secret', process.env.SIGHTENGINE_API_SECRET)
    
    // Add anonymization options
    formData.append('blur_faces', 'true')
    formData.append('blur_license_plates', 'true')
    formData.append('blur_strength', options.blurStrength || '5')
    
    // Add callback URL if provided
    if (options.callbackUrl) {
      formData.append('callback_url', options.callbackUrl)
    }

    const response = await fetch('https://api.sightengine.com/1.0/video/check.json', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`SightEngine API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    
    if (result.status === 'failure') {
      throw new Error(`SightEngine processing failed: ${result.error?.message || 'Unknown error'}`)
    }

    return result
  } catch (error) {
    console.error('Error in SightEngine anonymization:', error)
    throw new Error(`Video anonymization failed: ${error.message}`)
  }
}

export const checkProcessingStatus = async (jobId) => {
  try {
    const params = new URLSearchParams({
      api_user: process.env.SIGHTENGINE_API_USER,
      api_secret: process.env.SIGHTENGINE_API_SECRET,
      job_id: jobId
    })

    const response = await fetch(`https://api.sightengine.com/1.0/video/check-status.json?${params}`)

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`SightEngine status check error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error checking SightEngine status:', error)
    throw new Error(`Status check failed: ${error.message}`)
  }
}

export const analyzeVideoContent = async (videoUrl) => {
  try {
    const formData = new FormData()
    formData.append('media', videoUrl)
    formData.append('models', 'object-detection,face-attributes,gore,nudity-2.0')
    formData.append('api_user', process.env.SIGHTENGINE_API_USER)
    formData.append('api_secret', process.env.SIGHTENGINE_API_SECRET)

    const response = await fetch('https://api.sightengine.com/1.0/video/check.json', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`SightEngine analysis error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in video content analysis:', error)
    throw new Error(`Video analysis failed: ${error.message}`)
  }
}

export const extractScenarios = (analysisResults) => {
  const scenarios = []
  
  try {
    if (analysisResults.data && analysisResults.data.frames) {
      const frames = analysisResults.data.frames
      
      frames.forEach((frame, index) => {
        // Detect vehicles
        if (frame.objects && frame.objects.length > 0) {
          const vehicles = frame.objects.filter(obj => 
            ['car', 'truck', 'bus', 'motorcycle', 'bicycle'].includes(obj.class)
          )
          
          if (vehicles.length > 0) {
            scenarios.push({
              type: 'vehicle_detection',
              timestamp: frame.time_offset || index,
              confidence: Math.max(...vehicles.map(v => v.confidence)),
              details: {
                vehicle_count: vehicles.length,
                vehicle_types: vehicles.map(v => v.class)
              }
            })
          }
        }
        
        // Detect pedestrians
        if (frame.objects && frame.objects.some(obj => obj.class === 'person')) {
          const people = frame.objects.filter(obj => obj.class === 'person')
          scenarios.push({
            type: 'pedestrian_detection',
            timestamp: frame.time_offset || index,
            confidence: Math.max(...people.map(p => p.confidence)),
            details: {
              person_count: people.length
            }
          })
        }
        
        // Detect faces (potential privacy concerns)
        if (frame.faces && frame.faces.length > 0) {
          scenarios.push({
            type: 'face_detection',
            timestamp: frame.time_offset || index,
            confidence: Math.max(...frame.faces.map(f => f.confidence)),
            details: {
              face_count: frame.faces.length,
              anonymized: true
            }
          })
        }
      })
    }
    
    // Remove duplicate scenarios and sort by timestamp
    const uniqueScenarios = scenarios.filter((scenario, index, self) => 
      index === self.findIndex(s => 
        s.type === scenario.type && 
        Math.abs(s.timestamp - scenario.timestamp) < 1
      )
    ).sort((a, b) => a.timestamp - b.timestamp)
    
    return uniqueScenarios
  } catch (error) {
    console.error('Error extracting scenarios:', error)
    return []
  }
}

export const calculateEarnings = (videoDurationSeconds, scenarios) => {
  const minutes = videoDurationSeconds / 60
  const baseRate = parseFloat(process.env.EARNINGS_PER_MINUTE_MIN) || 0.5
  const maxRate = parseFloat(process.env.EARNINGS_PER_MINUTE_MAX) || 2.0
  
  // Base earnings
  let earnings = minutes * baseRate
  
  // Bonus for scenario-rich content
  const scenarioTypes = new Set(scenarios.map(s => s.type))
  const scenarioBonus = scenarioTypes.size * 0.1 // $0.10 per unique scenario type
  
  // High confidence scenarios get additional bonus
  const highConfidenceScenarios = scenarios.filter(s => s.confidence > 0.8)
  const confidenceBonus = highConfidenceScenarios.length * 0.05 // $0.05 per high-confidence scenario
  
  earnings += scenarioBonus + confidenceBonus
  
  // Cap at maximum rate
  const maxEarnings = minutes * maxRate
  return Math.min(earnings, maxEarnings)
}