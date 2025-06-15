import { NextResponse } from 'next/server'
import { RekognitionClient, DescribeCollectionCommand } from "@aws-sdk/client-rekognition"

export async function GET(request) {
  try {
    console.log('🔧 Testing AWS credentials...')
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
    
    // Simple test call that doesn't require a video
    const command = new DescribeCollectionCommand({ CollectionId: 'test-collection' })
    
    try {
      await client.send(command)
      // We expect this to fail with "ResourceNotFoundException" which means credentials work
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        return NextResponse.json({
          success: true,
          message: 'AWS credentials are valid',
          region: process.env.AWS_REGION || 'us-east-1'
        })
      } else if (error.name === 'InvalidSignatureException' || error.name === 'UnauthorizedOperation') {
        return NextResponse.json({
          success: false,
          error: 'AWS credentials are invalid',
          errorName: error.name,
          errorMessage: error.message
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'AWS credentials appear valid (unexpected error)',
          errorName: error.name,
          errorMessage: error.message
        })
      }
    }
    
  } catch (error) {
    console.error('💥 AWS credentials test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      errorName: error.name
    }, { status: 500 })
  }
}