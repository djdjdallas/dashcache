export const anonymizeVideo = async (videoUrl) => {
  const response = await fetch('https://api.sightengine.com/1.0/transform.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      media: videoUrl,
      concepts: 'face,license-plate',
      api_user: process.env.SIGHTENGINE_API_USER,
      api_secret: process.env.SIGHTENGINE_API_SECRET,
    }),
  })

  if (!response.ok) {
    throw new Error('SightEngine API error')
  }

  return response.json()
}

export const checkModerationStatus = async (jobId) => {
  const response = await fetch(
    `https://api.sightengine.com/1.0/status.json?api_user=${process.env.SIGHTENGINE_API_USER}&api_secret=${process.env.SIGHTENGINE_API_SECRET}&job_id=${jobId}`
  )

  if (!response.ok) {
    throw new Error('SightEngine status check error')
  }

  return response.json()
}