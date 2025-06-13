if (!process.env.SIGHTENGINE_API_USER || !process.env.SIGHTENGINE_API_SECRET) {
  throw new Error('Missing required SightEngine environment variables')
}

export const anonymizeVideo = async (videoUrl, options = {}) => {
  try {
    console.log('🔄 Starting SightEngine anonymization for:', videoUrl)
    
    const formData = new FormData()
    formData.append('media', videoUrl)
    // Anonymize faces, license plates, and other PII
    formData.append('concepts', 'face,license-plate,phone,email,text-embedded')
    formData.append('api_user', process.env.SIGHTENGINE_API_USER)
    formData.append('api_secret', process.env.SIGHTENGINE_API_SECRET)
    
    // Add callback URL if provided
    if (options.callbackUrl) {
      formData.append('callback_url', options.callbackUrl)
      console.log('📞 Callback URL set:', options.callbackUrl)
    }

    const response = await fetch('https://api.sightengine.com/1.0/video/transform.json', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ SightEngine API error:', response.status, errorData)
      throw new Error(`SightEngine API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    console.log('✅ SightEngine anonymization response:', result)
    
    if (result.status === 'failure') {
      throw new Error(`SightEngine processing failed: ${result.error?.message || 'Unknown error'}`)
    }

    // For video/transform.json, the response format may include a job_id
    return {
      job_id: result.job_id || result.id || 'unknown',
      status: result.status || 'pending',
      message: result.message || 'Anonymization started'
    }
  } catch (error) {
    console.error('💥 Error in SightEngine anonymization:', error)
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
    console.log('🎯 Extracting scenarios from analysis results')
    
    if (analysisResults.data && analysisResults.data.frames) {
      const frames = analysisResults.data.frames
      console.log(`📊 Processing ${frames.length} frames`)
      
      frames.forEach((frame, index) => {
        const timestamp = frame.time_offset || index
        
        // Detect intersection scenarios
        if (frame.objects && frame.objects.length > 0) {
          const vehicles = frame.objects.filter(obj => 
            ['car', 'truck', 'bus', 'motorcycle'].includes(obj.class)
          )
          const trafficSigns = frame.objects.filter(obj => 
            ['traffic light', 'stop sign'].includes(obj.class)
          )
          
          // Intersection turn detection
          if (vehicles.length >= 2 && trafficSigns.length > 0) {
            scenarios.push({
              type: 'intersection_turn',
              timestamp,
              confidence: Math.min(0.9, Math.max(...vehicles.map(v => v.confidence))),
              details: {
                vehicle_count: vehicles.length,
                traffic_control: trafficSigns.map(s => s.class),
                complexity: vehicles.length > 3 ? 'high' : 'medium'
              }
            })
          }
          
          // Highway merging detection
          if (vehicles.length >= 3) {
            scenarios.push({
              type: 'highway_merging',
              timestamp,
              confidence: Math.min(0.85, Math.max(...vehicles.map(v => v.confidence))),
              details: {
                vehicle_count: vehicles.length,
                traffic_density: vehicles.length > 5 ? 'heavy' : 'moderate'
              }
            })
          }
        }
        
        // Pedestrian crossing detection
        if (frame.objects && frame.objects.some(obj => obj.class === 'person')) {
          const people = frame.objects.filter(obj => obj.class === 'person')
          const vehicles = frame.objects.filter(obj => 
            ['car', 'truck', 'bus', 'motorcycle'].includes(obj.class)
          )
          
          if (people.length > 0 && vehicles.length > 0) {
            scenarios.push({
              type: 'pedestrian_crossing',
              timestamp,
              confidence: Math.min(0.9, Math.max(...people.map(p => p.confidence))),
              details: {
                pedestrian_count: people.length,
                vehicle_count: vehicles.length,
                interaction_type: 'crossing'
              }
            })
          }
        }
        
        // Parking scenario detection
        if (frame.objects && frame.objects.length > 0) {
          const parkedVehicles = frame.objects.filter(obj => 
            ['car', 'truck'].includes(obj.class) && obj.confidence > 0.8
          )
          
          if (parkedVehicles.length >= 3) {
            scenarios.push({
              type: 'parking',
              timestamp,
              confidence: 0.75,
              details: {
                parked_vehicle_count: parkedVehicles.length,
                scenario_subtype: 'parallel_parking'
              }
            })
          }
        }
        
        // Weather driving detection (placeholder - would need weather API)
        if (Math.random() < 0.1) { // 10% chance to simulate weather detection
          scenarios.push({
            type: 'weather_driving',
            timestamp,
            confidence: 0.7,
            details: {
              weather_condition: 'rain',
              visibility: 'reduced'
            }
          })
        }
      })
    }
    
    // Remove duplicate scenarios and sort by timestamp
    const uniqueScenarios = scenarios.filter((scenario, index, self) => 
      index === self.findIndex(s => 
        s.type === scenario.type && 
        Math.abs(s.timestamp - scenario.timestamp) < 5 // 5 second window
      )
    ).sort((a, b) => a.timestamp - b.timestamp)
    
    console.log(`✅ Extracted ${uniqueScenarios.length} unique scenarios:`, 
      uniqueScenarios.map(s => s.type))
    
    return uniqueScenarios
  } catch (error) {
    console.error('💥 Error extracting scenarios:', error)
    return []
  }
}

// Note: calculateEarnings has been moved to @/lib/earningsCalculator 
// for enhanced tiered earning system with edge case detection