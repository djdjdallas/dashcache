import { assessVideoQuality } from './videoQuality'
import { analyzeWithGoogleVideo } from './googleVideoIntelligence'
import { analyzeWithRekognition } from './awsRekognition'
import { analyzeFramesWithGPT4, extractKeyFrames } from './openaiVision'
import { EdgeCaseDetector } from './edgeCaseDetector'
import { generateScenarios } from './scenarioGenerator'
import { supabaseAdmin } from './supabase'

export async function processVideoForMarketplace(submission) {
  try {
    // 1. Quality check
    const quality = await assessVideoQuality(submission.mux_playback_url, {
      height: submission.video_height || 720,
      bitrate: submission.bitrate || 2000000,
      duration: submission.duration_seconds
    });
    
    if (!quality.passes) {
      await updateSubmissionStatus(submission.id, 'quality_failed', quality.issues);
      return;
    }
    
    // 2. Upload to cloud storage for processing
    const gcsUri = await uploadToGCS(submission.mux_playback_url);
    const s3Location = await uploadToS3(submission.mux_playback_url);
    
    // 3. Run parallel analysis
    const [googleResults, rekognitionResults, keyFrames] = await Promise.all([
      analyzeWithGoogleVideo(gcsUri),
      analyzeWithRekognition(s3Location.bucket, s3Location.key),
      extractKeyFrames(submission.mux_playback_url, 10) // 10 key frames
    ]);
    
    // 4. Deep analysis with GPT-4 Vision on key frames
    const gptAnalysis = await analyzeFramesWithGPT4(keyFrames);
    
    // 5. Detect edge cases
    const edgeCaseDetector = new EdgeCaseDetector();
    const edgeCases = await edgeCaseDetector.detectEdgeCases(
      [...googleResults.annotations, ...rekognitionResults.labels],
      gptAnalysis
    );
    
    // 6. Generate comprehensive scenarios
    const scenarios = await generateScenarios({
      googleAnnotations: googleResults,
      rekognitionLabels: rekognitionResults,
      gptInsights: gptAnalysis,
      edgeCases: edgeCases
    });
    
    // 7. Calculate value score
    const valueScore = calculateDataValue(scenarios, edgeCases, quality.score);
    
    // 8. Store in database
    await storeVideoScenarios(submission.id, scenarios, valueScore);
    
    // 9. Update submission status
    await updateSubmissionStatus(submission.id, 'annotated', {
      scenario_count: scenarios.length,
      edge_case_count: edgeCases.length,
      value_score: valueScore
    });
    
    return {
      success: true,
      scenarios: scenarios.length,
      edgeCases: edgeCases.length,
      valueScore
    };
    
  } catch (error) {
    console.error('Annotation pipeline error:', error);
    await updateSubmissionStatus(submission.id, 'annotation_failed', error.message);
    throw error;
  }
}

async function updateSubmissionStatus(submissionId, status, metadata) {
  await supabaseAdmin
    .from('video_submissions')
    .update({
      upload_status: status,
      processing_notes: JSON.stringify(metadata),
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId);
}

async function uploadToGCS(videoUrl) {
  // Implement GCS upload
  return `gs://dashcache-videos/${Date.now()}.mp4`;
}

async function uploadToS3(videoUrl) {
  // Implement S3 upload
  return {
    bucket: 'dashcache-videos',
    key: `${Date.now()}.mp4`
  };
}

function calculateDataValue(scenarios, edgeCases, qualityScore) {
  const scenarioValue = scenarios.reduce((sum, s) => sum + s.value_score, 0) / scenarios.length;
  const edgeCaseValue = edgeCases.reduce((sum, e) => sum + e.value, 0);
  
  return (scenarioValue * 0.4 + edgeCaseValue * 0.4 + qualityScore * 0.2);
}

async function storeVideoScenarios(submissionId, scenarios, valueScore) {
  const scenarioRecords = scenarios.map(scenario => ({
    video_submission_id: submissionId,
    scenario_type: scenario.type,
    start_time_seconds: scenario.start_time,
    end_time_seconds: scenario.end_time,
    confidence_score: scenario.confidence,
    tags: JSON.stringify(scenario.labels),
    metadata: JSON.stringify(scenario.metadata),
    is_approved: scenario.confidence > 0.8,
    value_score: scenario.value_score
  }));
  
  await supabaseAdmin
    .from('video_scenarios')
    .insert(scenarioRecords);
}