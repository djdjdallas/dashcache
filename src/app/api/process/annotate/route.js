import { NextResponse } from 'next/server'
import { processVideoForMarketplace } from '@/lib/videoAnnotationPipeline'
import { calculateEnhancedEarnings } from '@/lib/earningsCalculator'
import { handleApiError } from '@/lib/errors'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { submissionId } = await request.json()
    
    const submission = await getSubmission(submissionId)
    
    if (!submission.is_anonymized) {
      return NextResponse.json(
        { error: 'Video must be anonymized first' },
        { status: 400 }
      )
    }
    
    const result = await processVideoForMarketplace(submission)
    
    const earnings = await calculateEnhancedEarnings(
      submission.duration_seconds,
      result.scenarios,
      result.edgeCases,
      result.valueScore,
      submission.driver_id
    )
    
    await updateDriverEarnings(submission.driver_id, earnings)
    
    return NextResponse.json({
      success: true,
      ...result,
      estimatedEarnings: earnings
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}

async function getSubmission(submissionId) {
  const { data } = await supabaseAdmin
    .from('video_submissions')
    .select('*')
    .eq('id', submissionId)
    .single()
  
  return data
}

async function updateDriverEarnings(driverId, earningsResult) {
  await supabaseAdmin
    .from('driver_earnings')
    .insert([{
      driver_id: driverId,
      amount: earningsResult.total,
      earning_type: 'footage_contribution',
      payment_status: 'pending',
      metadata: JSON.stringify(earningsResult.breakdown)
    }])
}