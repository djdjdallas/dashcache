import { RekognitionClient, StartLabelDetectionCommand, GetLabelDetectionCommand } from "@aws-sdk/client-rekognition"

export async function analyzeWithRekognition(s3Bucket, s3Key) {
  const client = new RekognitionClient({ region: "us-east-1" });
  
  const params = {
    Video: {
      S3Object: {
        Bucket: s3Bucket,
        Name: s3Key
      }
    },
    MinConfidence: 70,
    Features: ['GENERAL_LABELS'],
    Settings: {
      GeneralLabels: {
        LabelInclusionFilters: [
          'Vehicle', 'Person', 'Traffic Light', 'Road Sign',
          'Pedestrian', 'Bicycle', 'Motorcycle', 'Bus', 'Truck'
        ]
      }
    }
  };
  
  const command = new StartLabelDetectionCommand(params);
  const response = await client.send(command);
  
  return pollRekognitionJob(response.JobId);
}

async function pollRekognitionJob(jobId) {
  const client = new RekognitionClient({ region: "us-east-1" });
  let jobStatus = 'IN_PROGRESS';
  let results = null;
  
  while (jobStatus === 'IN_PROGRESS') {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const command = new GetLabelDetectionCommand({ JobId: jobId });
    const response = await client.send(command);
    
    jobStatus = response.JobStatus;
    if (jobStatus === 'SUCCEEDED') {
      results = response.Labels;
    }
  }
  
  return { labels: results };
}

// New function for scenario analysis from video URL
export async function analyzeVideoScenarios(videoUrl, metadata) {
  try {
    console.log('🅰️ AWS Rekognition: Analyzing video URL:', videoUrl.substring(0, 100) + '...')
    
    // Check if AWS credentials are available
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured')
    }
    
    const client = new RekognitionClient({ 
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })
    
    console.log('🅰️ Starting real AWS Rekognition analysis...')
    
    // For URL-based analysis, we need to start label detection with video bytes
    // First, download the video from the URL
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`)
    }
    
    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBytes = new Uint8Array(videoBuffer)
    
    console.log('📥 Downloaded video:', videoBytes.length, 'bytes')
    
    const videoSizeMB = videoBytes.length / (1024 * 1024)
    console.log('📊 Video size:', videoSizeMB.toFixed(2), 'MB')
    
    // AWS Rekognition direct bytes limit is actually 5MB for videos
    // For larger videos, we need to upload to S3 first
    let startParams
    
    if (videoBytes.length > 5 * 1024 * 1024) { // 5MB limit for direct bytes
      console.log('❌ Video larger than 5MB (', (videoBytes.length / (1024 * 1024)).toFixed(2), 'MB), but S3 upload not available in this environment')
      throw new Error(`Video too large for AWS Rekognition direct analysis: ${(videoBytes.length / (1024 * 1024)).toFixed(2)}MB (limit: 5MB). S3 upload required but not configured.`)
    } else {
      console.log('✅ Video size acceptable for direct analysis')
      
      startParams = {
        Video: {
          Bytes: videoBytes
        },
        MinConfidence: 70,
        Features: ['GENERAL_LABELS']
      }
    }
    
    try {
      const startCommand = new StartLabelDetectionCommand(startParams)
      const startResponse = await client.send(startCommand)
      
      console.log('🎬 AWS job started:', startResponse.JobId)
      
      // Poll for results
      const results = await pollAWSJob(client, startResponse.JobId)
      console.log('✅ AWS analysis complete, found', results.labels?.length || 0, 'labels')
      
      // Convert AWS results to scenarios
      const scenarios = convertAWSLabelsToScenarios(results.labels, metadata)
      
      console.log('🅰️ AWS Rekognition generated', scenarios.length, 'scenarios from REAL analysis')
      return scenarios
      
    } catch (awsError) {
      console.error('❌ AWS Rekognition API error:', awsError.message)
      console.error('❌ AWS Error details:', awsError.code, awsError.name)
      
      // For production, we want to see the actual error, not fall back to simulation
      throw new Error(`AWS Rekognition failed: ${awsError.message} (${awsError.code})`)
    }
    
  } catch (error) {
    console.error('🅰️ AWS Rekognition analysis error:', error)
    throw error
  }
}

// Enhanced simulation with more realistic data based on actual video
async function analyzeVideoWithEnhancedSimulation(videoUrl, metadata) {
  console.log('🎭 Enhanced AWS simulation - analyzing video characteristics...')
  
  const duration = metadata.duration || 60
  const filename = metadata.filename || ''
  
  // Analyze filename and duration for better simulation
  const scenarios = []
  let detectedLabels = []
  
  // Generate labels based on video characteristics
  if (filename.toLowerCase().includes('traffic') || filename.toLowerCase().includes('intersection')) {
    detectedLabels.push(
      { name: 'Traffic Light', confidence: 92.1, timestamp: Math.random() * duration * 0.3 },
      { name: 'Vehicle', confidence: 88.7, timestamp: Math.random() * duration * 0.6 },
      { name: 'Road Sign', confidence: 85.3, timestamp: Math.random() * duration * 0.8 }
    )
  }
  
  if (filename.toLowerCase().includes('pedestrian') || filename.toLowerCase().includes('crosswalk')) {
    detectedLabels.push(
      { name: 'Person', confidence: 91.2, timestamp: Math.random() * duration * 0.4 },
      { name: 'Crosswalk', confidence: 87.8, timestamp: Math.random() * duration * 0.5 }
    )
  }
  
  // Default urban driving scenarios
  if (detectedLabels.length === 0) {
    detectedLabels = [
      { name: 'Vehicle', confidence: 95.2, timestamp: duration * 0.1 },
      { name: 'Traffic Light', confidence: 87.3, timestamp: duration * 0.3 },
      { name: 'Person', confidence: 82.1, timestamp: duration * 0.5 },
      { name: 'Building', confidence: 91.4, timestamp: duration * 0.7 },
      { name: 'Road', confidence: 98.9, timestamp: duration * 0.2 }
    ]
  }
  
  // Convert detected labels to scenarios
  detectedLabels.forEach((label, index) => {
    let scenarioType = 'general_driving'
    let tags = ['aws_rekognition_enhanced', label.name.toLowerCase().replace(' ', '_')]
    
    switch (label.name) {
      case 'Traffic Light':
      case 'Road Sign':
        scenarioType = 'intersection_turn'
        tags.push('traffic_control', 'intersection')
        break
      case 'Person':
      case 'Crosswalk':
        scenarioType = 'pedestrian_crossing'
        tags.push('pedestrian', 'safety')
        break
      case 'Building':
        scenarioType = 'urban_driving'
        tags.push('urban', 'navigation')
        break
      case 'Parking':
        scenarioType = 'parking'
        tags.push('parking', 'maneuvering')
        break
      case 'Vehicle':
        scenarioType = Math.random() > 0.5 ? 'highway_merging' : 'traffic_following'
        tags.push('vehicle_interaction', 'traffic')
        break
    }
    
    scenarios.push({
      video_submission_id: metadata.submissionId,
      scenario_type: scenarioType,
      start_time_seconds: Math.max(0, label.timestamp - 2),
      end_time_seconds: Math.min(duration, label.timestamp + 8),
      confidence_score: label.confidence / 100,
      tags: JSON.stringify(tags),
      is_approved: false
    })
  })
  
  return scenarios
}

// Poll AWS job for completion
async function pollAWSJob(client, jobId) {
  let jobStatus = 'IN_PROGRESS'
  let attempts = 0
  const maxAttempts = 30 // 5 minutes max
  
  while (jobStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
    attempts++
    
    console.log(`🔄 Checking AWS job status... (attempt ${attempts}/${maxAttempts})`)
    
    const command = new GetLabelDetectionCommand({ JobId: jobId })
    const response = await client.send(command)
    
    jobStatus = response.JobStatus
    
    if (jobStatus === 'SUCCEEDED') {
      return { labels: response.Labels || [] }
    } else if (jobStatus === 'FAILED') {
      throw new Error('AWS Rekognition job failed')
    }
  }
  
  throw new Error('AWS Rekognition job timed out')
}

// Convert AWS labels to driving scenarios
function convertAWSLabelsToScenarios(labels, metadata) {
  if (!labels || labels.length === 0) {
    return []
  }
  
  const scenarios = []
  const relevantLabels = labels.filter(label => {
    const name = label.Label?.Name?.toLowerCase() || ''
    return ['vehicle', 'car', 'truck', 'bus', 'person', 'pedestrian', 'traffic', 'road', 'building'].some(keyword => 
      name.includes(keyword)
    )
  })
  
  relevantLabels.forEach(label => {
    const labelName = label.Label?.Name || 'Unknown'
    const confidence = label.Label?.Confidence || 0
    const timestamp = label.Timestamp || 0
    
    let scenarioType = 'general_driving'
    let tags = ['aws_rekognition_real', labelName.toLowerCase()]
    
    if (labelName.toLowerCase().includes('vehicle') || labelName.toLowerCase().includes('car')) {
      scenarioType = 'vehicle_interaction'
      tags.push('traffic', 'vehicle_detection')
    } else if (labelName.toLowerCase().includes('person') || labelName.toLowerCase().includes('pedestrian')) {
      scenarioType = 'pedestrian_crossing'
      tags.push('safety', 'pedestrian_detection')
    } else if (labelName.toLowerCase().includes('traffic')) {
      scenarioType = 'intersection_turn'
      tags.push('traffic_control', 'intersection')
    }
    
    scenarios.push({
      video_submission_id: metadata.submissionId,
      scenario_type: scenarioType,
      start_time_seconds: Math.max(0, timestamp / 1000 - 2),
      end_time_seconds: Math.min(metadata.duration || 60, timestamp / 1000 + 8),
      confidence_score: confidence / 100,
      tags: JSON.stringify(tags),
      is_approved: false
    })
  })
  
  return scenarios
}
// Note: S3 upload functionality removed due to dependency issues
// For videos >5MB, would need @aws-sdk/client-s3 package installed