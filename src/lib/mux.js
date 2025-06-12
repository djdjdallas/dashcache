import Mux from '@mux/mux-node'

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  throw new Error('Missing required Mux environment variables')
}

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

export const createUploadUrl = async (corsOrigin = 'http://localhost:3000') => {
  try {
    const upload = await mux.video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline', // For cost optimization
        input_info: [
          {
            settings: {
              normalize_audio: true,
            }
          }
        ]
      }
    })
    
    return {
      uploadUrl: upload.url,
      uploadId: upload.id
    }
  } catch (error) {
    console.error('Error creating Mux upload URL:', error)
    throw new Error(`Failed to create upload URL: ${error.message}`)
  }
}

export const getAssetInfo = async (assetId) => {
  try {
    const asset = await mux.video.assets.retrieve(assetId)
    return asset
  } catch (error) {
    console.error('Error retrieving asset info:', error)
    throw new Error(`Failed to get asset info: ${error.message}`)
  }
}

export const deleteAsset = async (assetId) => {
  try {
    await mux.video.assets.delete(assetId)
    return true
  } catch (error) {
    console.error('Error deleting asset:', error)
    throw new Error(`Failed to delete asset: ${error.message}`)
  }
}

export const createPlaybackId = async (assetId, policy = 'public') => {
  try {
    const playbackId = await mux.video.assets.createPlaybackId(assetId, {
      policy
    })
    return playbackId
  } catch (error) {
    console.error('Error creating playback ID:', error)
    throw new Error(`Failed to create playback ID: ${error.message}`)
  }
}

export const verifyWebhookSignature = (rawBody, signature, secret) => {
  try {
    // For development, we'll temporarily disable verification
    // In production, you should implement proper HMAC verification
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Webhook verification disabled in development')
      return true
    }
    
    // Proper HMAC verification would go here
    // For now, just check if signature exists
    return !!signature
  } catch (error) {
    console.error('Webhook verification failed:', error)
    return false
  }
}

export default mux