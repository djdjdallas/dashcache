import { NextResponse } from 'next/server'
import { createUploadUrl } from '@/lib/mux'
import { supabaseAdmin } from '@/lib/supabase'
import { handleApiError, validateDriverId, validateEarningsAmount, DashCacheError, ERROR_TYPES } from '@/lib/errors'

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 524288000 // 500MB
const SUPPORTED_FORMATS = (process.env.SUPPORTED_VIDEO_FORMATS || 'mp4,mov,avi,mkv').split(',')

export async function POST(request) {
  try {
    const { userId, filename, fileSize, contentType, supabasePath } = await request.json()

    // Validate required fields
    if (!userId || !filename || !fileSize || !contentType) {
      throw new DashCacheError(
        ERROR_TYPES.VALIDATION_ERROR,
        'Missing required fields: userId, filename, fileSize, contentType',
        { missingFields: { userId: !userId, filename: !filename, fileSize: !fileSize, contentType: !contentType } },
        400
      )
    }

    // Validate driver ID format
    validateDriverId(userId)

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      throw new DashCacheError(
        ERROR_TYPES.UPLOAD_FILE_TOO_LARGE,
        `File size too large. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        { actualSize: fileSize, maxSize: MAX_FILE_SIZE, filename },
        413
      )
    }

    // Validate file type
    if (!contentType.startsWith('video/')) {
      throw new DashCacheError(
        ERROR_TYPES.UPLOAD_UNSUPPORTED_FORMAT,
        'File must be a video',
        { actualType: contentType, filename },
        415
      )
    }

    // Check file extension
    const extension = filename.split('.').pop().toLowerCase()
    if (!SUPPORTED_FORMATS.includes(extension)) {
      throw new DashCacheError(
        ERROR_TYPES.UPLOAD_UNSUPPORTED_FORMAT,
        `Unsupported format. Supported: ${SUPPORTED_FORMATS.join(', ')}`,
        { actualExtension: extension, supportedFormats: SUPPORTED_FORMATS, filename },
        415
      )
    }

    // Verify user exists and is a driver
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_type')
      .eq('id', userId)
      .single()

    if (userError || !user || user.user_type !== 'driver') {
      return NextResponse.json(
        { error: 'Invalid user or insufficient permissions' },
        { status: 403 }
      )
    }

    // Create video submission record
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('video_submissions')
      .insert([{
        driver_id: userId,
        original_filename: filename,
        upload_status: 'pending',
        file_size_mb: Math.round(fileSize / (1024 * 1024) * 100) / 100,
        raw_video_path: supabasePath,
        raw_video_size_bytes: fileSize,
        supabase_bucket: 'dashcam-videos'
      }])
      .select()
      .single()

    if (submissionError) {
      console.error('Error creating submission:', submissionError)
      return NextResponse.json(
        { error: 'Failed to create submission record' },
        { status: 500 }
      )
    }

    try {
      // Create Mux upload URL
      const { uploadUrl, uploadId } = await createUploadUrl(process.env.NEXT_PUBLIC_SITE_URL)
      
      // Update submission with upload ID - Mux webhooks will handle status progression
      const { error: updateError } = await supabaseAdmin
        .from('video_submissions')
        .update({
          mux_upload_id: uploadId,
          upload_status: 'uploading' // Mux webhook will update to 'processing' -> 'ready' -> 'anonymizing' -> 'completed'
        })
        .eq('id', submission.id)

      if (updateError) {
        console.error('Error updating submission:', updateError)
        return NextResponse.json(
          { error: 'Failed to update submission' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        submissionId: submission.id,
        uploadUrl: uploadUrl,
        uploadId: uploadId
      })

    } catch (muxError) {
      console.error('Mux upload URL creation failed:', muxError)
      
      // Update submission status to failed
      await supabaseAdmin
        .from('video_submissions')
        .update({
          upload_status: 'failed',
          processing_notes: muxError.message
        })
        .eq('id', submission.id)

      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      )
    }

  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/upload/video',
      method: 'POST',
      userId: request.userId
    })
    
    return NextResponse.json(errorResponse, { status })
  }
}

// GET endpoint to check upload status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId parameter' },
        { status: 400 }
      )
    }

    const { data: submission, error } = await supabaseAdmin
      .from('video_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (error || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check if video has been stuck in 'uploading' status for too long
    // But don't timeout if we've received webhooks (have mux_asset_id)
    if (submission.upload_status === 'uploading' && !submission.mux_asset_id) {
      const createdAt = new Date(submission.created_at)
      const now = new Date()
      const minutesElapsed = (now - createdAt) / (1000 * 60)
      
      // If stuck for more than 5 minutes without any Mux asset, mark as failed
      if (minutesElapsed > 5) {
        await supabaseAdmin
          .from('video_submissions')
          .update({
            upload_status: 'failed',
            processing_notes: 'Upload timed out - no webhook received from Mux'
          })
          .eq('id', submission.id)
        
        return NextResponse.json({
          submissionId: submission.id,
          status: 'failed',
          muxAssetId: submission.mux_asset_id,
          playbackId: submission.mux_playback_id,
          isAnonymized: submission.is_anonymized,
          processingNotes: 'Upload timed out - no webhook received from Mux',
          duration: submission.duration_seconds
        })
      }
    }

    return NextResponse.json({
      submissionId: submission.id,
      status: submission.upload_status,
      muxAssetId: submission.mux_asset_id,
      playbackId: submission.mux_playback_id,
      isAnonymized: submission.is_anonymized,
      processingNotes: submission.processing_notes,
      duration: submission.duration_seconds
    })

  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/upload/video',
      method: 'GET',
      submissionId: request.searchParams?.get('submissionId')
    })
    
    return NextResponse.json(errorResponse, { status })
  }
}