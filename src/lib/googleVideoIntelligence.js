const {VideoIntelligenceServiceClient} = require('@google-cloud/video-intelligence');

export async function analyzeWithGoogleVideo(gcsUri) {
  const client = new VideoIntelligenceServiceClient();
  
  const request = {
    inputUri: gcsUri,
    features: [
      'LABEL_DETECTION',
      'OBJECT_TRACKING', 
      'PERSON_DETECTION',
      'FACE_DETECTION',
      'LOGO_RECOGNITION',
      'TEXT_DETECTION'
    ],
    videoContext: {
      labelDetectionConfig: {
        labelDetectionMode: 'FRAME_MODE',
        model: 'latest',
      },
      objectTrackingConfig: {
        model: 'latest',
      }
    }
  };
  
  const [operation] = await client.annotateVideo(request);
  const [response] = await operation.promise();
  
  return processGoogleVideoResults(response);
}

function processGoogleVideoResults(response) {
  const annotations = []
  
  // Process label annotations
  if (response.annotationResults[0].segmentLabelAnnotations) {
    response.annotationResults[0].segmentLabelAnnotations.forEach(label => {
      annotations.push({
        type: 'label',
        name: label.entity.description,
        confidence: label.confidence,
        segments: label.segments
      })
    })
  }
  
  // Process object tracking
  if (response.annotationResults[0].objectAnnotations) {
    response.annotationResults[0].objectAnnotations.forEach(object => {
      annotations.push({
        type: 'object',
        name: object.entity.description,
        confidence: object.confidence,
        frames: object.frames
      })
    })
  }
  
  return { annotations }
}