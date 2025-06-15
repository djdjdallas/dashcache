import { NextResponse } from 'next/server'
import { RekognitionClient, StartLabelDetectionCommand, GetLabelDetectionCommand } from "@aws-sdk/client-rekognition"

export async function POST(request) {
  try {
    const { videoUrl } = await request.json()
    
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'videoUrl required' },
        { status: 400 }
      )
    }
    
    console.log('🔧 Testing real AWS Rekognition with production credentials...')
    console.log('🔑 AWS Access Key:', process.env.AWS_ACCESS_KEY_ID ? 'Present' : 'Missing')
    console.log('🔑 AWS Secret Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Present' : 'Missing')
    console.log('🌍 AWS Region:', process.env.AWS_REGION || 'us-east-1')
    
    const client = new RekognitionClient({ 
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })
    
    console.log('📥 Downloading video from:', videoUrl.substring(0, 100) + '...')
    
    // Download video
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`)
    }
    
    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBytes = new Uint8Array(videoBuffer)
    
    console.log('✅ Video downloaded successfully')
    console.log('📊 Video size:', (videoBytes.length / (1024 * 1024)).toFixed(2), 'MB')
    console.log('📊 Video bytes length:', videoBytes.length)
    
    // Prepare AWS request
    const startParams = {
      Video: {
        Bytes: videoBytes
      },
      MinConfidence: 70,
      Features: ['GENERAL_LABELS']
    }
    
    console.log('🚀 Starting AWS Rekognition job...')
    
    const startCommand = new StartLabelDetectionCommand(startParams)
    const startResponse = await client.send(startCommand)
    
    console.log('✅ AWS job started successfully!')
    console.log('🆔 Job ID:', startResponse.JobId)
    
    // Poll for results
    let attempts = 0
    let jobStatus = 'IN_PROGRESS'
    
    while (jobStatus === 'IN_PROGRESS' && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++
      
      console.log(`🔄 Checking job status... (attempt ${attempts}/30)`)
      
      const getCommand = new GetLabelDetectionCommand({ JobId: startResponse.JobId })
      const getResponse = await client.send(getCommand)
      
      jobStatus = getResponse.JobStatus
      console.log('📊 Job Status:', jobStatus)
      
      if (jobStatus === 'SUCCEEDED') {
        const labels = getResponse.Labels || []
        console.log('🎉 AWS analysis completed successfully!')
        console.log('📊 Total labels found:', labels.length)
        
        // Show sample labels
        const sampleLabels = labels.slice(0, 5).map(label => ({
          name: label.Label?.Name,
          confidence: label.Label?.Confidence,
          timestamp: label.Timestamp
        }))
        
        return NextResponse.json({
          success: true,
          jobId: startResponse.JobId,
          jobStatus: jobStatus,
          totalLabels: labels.length,
          videoSize: (videoBytes.length / (1024 * 1024)).toFixed(2) + ' MB',
          sampleLabels: sampleLabels,
          message: 'Real AWS Rekognition analysis successful!'
        })
      } else if (jobStatus === 'FAILED') {
        return NextResponse.json({
          success: false,
          jobId: startResponse.JobId,
          jobStatus: jobStatus,
          error: 'AWS Rekognition job failed',
          videoSize: (videoBytes.length / (1024 * 1024)).toFixed(2) + ' MB'
        })
      }
    }
    
    // Timeout
    return NextResponse.json({
      success: false,
      jobId: startResponse.JobId,
      jobStatus: jobStatus,
      error: 'AWS Rekognition job timed out after 30 attempts',
      videoSize: (videoBytes.length / (1024 * 1024)).toFixed(2) + ' MB'
    })
    
  } catch (error) {
    console.error('💥 Real AWS test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      errorName: error.name,
      stack: error.stack?.split('\n').slice(0, 3)
    }, { status: 500 })
  }
}