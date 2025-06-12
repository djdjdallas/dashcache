// Quick test script to verify webhook endpoint is working
const testWebhook = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/mux', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mux-signature': 'test-signature'
      },
      body: JSON.stringify({
        type: 'video.upload.asset_created',
        object: {
          id: 'test-upload-id'
        },
        data: {
          asset_id: 'test-asset-id'
        }
      })
    })

    console.log('Webhook test response:', response.status)
    const result = await response.text()
    console.log('Response body:', result)
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testWebhook()