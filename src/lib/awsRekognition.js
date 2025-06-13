import { RekognitionClient, StartLabelDetectionCommand, GetLabelDetectionCommand } from "@aws-sdk/client-rekognition";

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