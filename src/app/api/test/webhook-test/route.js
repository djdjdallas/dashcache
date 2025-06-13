import { NextResponse } from 'next/server'

// Test endpoint to simulate Mux webhook events
export async function POST(request) {
  try {
    const { eventType, submissionId, assetId, uploadId } = await request.json()
    
    // Build test webhook payload based on event type
    let webhookPayload
    
    switch (eventType) {
      case 'video.upload.asset_created':
        webhookPayload = {
          type: 'video.upload.asset_created',
          id: `evt_test_${Date.now()}`,
          created_at: new Date().toISOString(),
          object: {
            type: 'upload',
            id: uploadId || 'test_upload_id'
          },
          data: {
            asset_id: assetId || 'test_asset_id',
            id: uploadId || 'test_upload_id'
          }
        }
        break
        
      case 'video.asset.ready':
        webhookPayload = {
          type: 'video.asset.ready',
          id: `evt_test_${Date.now()}`,
          created_at: new Date().toISOString(),
          object: {
            type: 'asset',
            id: assetId || 'test_asset_id',
            status: 'ready',
            duration: 120, // 2 minutes
            playback_ids: [{
              id: 'test_playback_id',
              policy: 'public'
            }],
            upload_id: uploadId
          },
          data: {
            tracks: [],
            status: 'ready'
          }
        }
        break
        
      case 'video.asset.created':
        webhookPayload = {
          type: 'video.asset.created',
          id: `evt_test_${Date.now()}`,
          created_at: new Date().toISOString(),
          object: {
            type: 'asset',
            id: assetId || 'test_asset_id',
            status: 'preparing',
            upload_id: uploadId || 'test_upload_id'
          },
          data: {
            upload_id: uploadId || 'test_upload_id'
          }
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid event type. Use: video.upload.asset_created, video.asset.ready, or video.asset.created' },
          { status: 400 }
        )
    }
    
    // Call the Mux webhook endpoint
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/mux`
    
    console.log('🚀 Sending test webhook to:', webhookUrl)
    console.log('📦 Payload:', JSON.stringify(webhookPayload, null, 2))
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mux-signature': 'test_signature' // This will fail signature verification
      },
      body: JSON.stringify(webhookPayload)
    })
    
    const result = await response.text()
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: result,
      sentPayload: webhookPayload
    })
    
  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to provide test instructions
export async function GET() {
  return NextResponse.json({
    message: 'Mux webhook test endpoint',
    usage: {
      method: 'POST',
      body: {
        eventType: 'video.asset.ready | video.upload.asset_created | video.asset.created',
        submissionId: 'optional - ID of video submission to update',
        assetId: 'optional - Mux asset ID',
        uploadId: 'optional - Mux upload ID'
      }
    },
    examples: [
      {
        description: 'Test asset ready event',
        body: {
          eventType: 'video.asset.ready',
          assetId: 'abc123',
          uploadId: 'upload123'
        }
      },
      {
        description: 'Test upload completed',
        body: {
          eventType: 'video.upload.asset_created',
          uploadId: 'upload123',
          assetId: 'asset123'
        }
      }
    ]
  })
}