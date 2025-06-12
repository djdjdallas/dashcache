# DashCache Video Upload & Processing Pipeline - Testing Guide

## Overview

This guide provides comprehensive testing procedures for the DashCache video upload and processing pipeline. Follow these steps to ensure all components work correctly.

## Prerequisites

### 1. Environment Setup

Ensure your `.env.local` file contains all required variables:

```bash
# Required for testing
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_webhook_secret

SIGHTENGINE_API_USER=your_sightengine_user
SIGHTENGINE_API_SECRET=your_sightengine_secret

STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Required Accounts

1. **Supabase**: Project with database schema
2. **Mux**: Video processing account with API tokens
3. **SightEngine**: Content moderation account
4. **Stripe**: Payment processing account

### 3. Test Video Files

Prepare test videos in different formats:
- Small file (< 10MB): `test_small.mp4`
- Medium file (50-100MB): `test_medium.mov`
- Large file (400-500MB): `test_large.avi`
- Invalid format: `test_invalid.txt`
- Corrupted file: `test_corrupted.mp4`

## Testing Checklist

### Phase 1: Basic Setup Verification

#### ✅ 1.1 Environment Variables
```bash
# Run the development server
npm run dev

# Check console for any missing environment variable errors
# Should start without errors on http://localhost:3000
```

#### ✅ 1.2 Database Connection
```bash
# Test database connectivity
curl http://localhost:3000/api/scenarios
# Should return JSON response, not error
```

#### ✅ 1.3 Authentication Flow
1. Navigate to `/auth`
2. Create a new driver account
3. Verify email/password authentication
4. Check that driver dashboard loads at `/driver-dashboard`

### Phase 2: Video Upload Testing

#### ✅ 2.1 Upload Validation
1. **File Size Validation**
   - Try uploading file > 500MB
   - Expected: Error message about file size limit
   
2. **File Format Validation**
   - Try uploading `.txt`, `.jpg`, `.pdf` files
   - Expected: Error message about unsupported format
   
3. **Valid Upload Initialization**
   - Upload a small MP4 file
   - Expected: Upload should initialize and return upload URL

#### ✅ 2.2 Upload Progress Tracking
1. Upload a medium-sized video (50MB+)
2. Verify progress bar shows:
   - Initializing (5%)
   - Uploading (10-70%)
   - Processing (70-85%)
   - Anonymizing (85-95%)
   - Completed (100%)

#### ✅ 2.3 Upload Status Monitoring
```bash
# Test status endpoint
curl "http://localhost:3000/api/upload/video?submissionId=YOUR_SUBMISSION_ID"
# Should return current status
```

### Phase 3: Video Processing Pipeline

#### ✅ 3.1 Mux Integration
1. Upload a valid video file
2. Check Mux dashboard for new asset
3. Verify webhook receives `video.upload.asset_created` event
4. Verify webhook receives `video.asset.ready` event

#### ✅ 3.2 SightEngine Integration
1. After video is ready in Mux
2. Check SightEngine dashboard for new job
3. Verify anonymization starts automatically
4. Check for SightEngine webhook callbacks

#### ✅ 3.3 Scenario Extraction
```bash
# Check scenarios were created
curl "http://localhost:3000/api/scenarios?approved=false"
# Should show extracted scenarios
```

#### ✅ 3.4 Earnings Calculation
```bash
# Check earnings were calculated
curl "http://localhost:3000/api/payments/driver-payout?driverId=YOUR_DRIVER_ID"
# Should show pending earnings
```

### Phase 4: Error Handling

#### ✅ 4.1 Network Errors
1. Disconnect internet during upload
2. Expected: Network error message displayed

#### ✅ 4.2 Service Unavailability
1. Temporarily disable Mux/SightEngine API keys
2. Upload a video
3. Expected: Appropriate error messages

#### ✅ 4.3 Invalid Data
```bash
# Test with invalid driver ID
curl -X POST http://localhost:3000/api/upload/video \
  -H "Content-Type: application/json" \
  -d '{"userId": "invalid", "filename": "test.mp4", "fileSize": 1000, "contentType": "video/mp4"}'
# Expected: Validation error
```

### Phase 5: Webhook Testing

#### ✅ 5.1 Mux Webhooks
```bash
# Test webhook endpoint (use ngrok for local testing)
curl -X POST http://localhost:3000/api/webhooks/mux \
  -H "Content-Type: application/json" \
  -H "mux-signature: YOUR_SIGNATURE" \
  -d '{"type": "video.asset.ready", "object": {"id": "test-asset"}}'
```

#### ✅ 5.2 SightEngine Webhooks
```bash
# Test SightEngine webhook
curl -X POST http://localhost:3000/api/webhooks/sightengine \
  -H "Content-Type: application/json" \
  -d '{"job_id": "test-job", "status": "completed", "output_url": "https://example.com/output.mp4"}'
```

### Phase 6: End-to-End Testing

#### ✅ 6.1 Complete Upload Flow
1. Sign up as a new driver
2. Upload a test video
3. Monitor progress to completion
4. Check that:
   - Video appears in "My Videos" tab
   - Earnings appear in "Earnings" tab
   - Video status shows "Completed"
   - Scenarios were extracted

#### ✅ 6.2 Multiple File Upload
1. Select multiple video files
2. Click "Upload All"
3. Verify all files process correctly
4. Check for any race conditions or conflicts

## Performance Testing

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create artillery.yml
engine: http
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Upload test"
    requests:
      - post:
          url: "/api/upload/video"
          json:
            userId: "test-driver-id"
            filename: "test.mp4"
            fileSize: 10000000
            contentType: "video/mp4"

# Run load test
artillery run artillery.yml
```

## Debugging Common Issues

### Issue: Upload fails immediately
**Check:**
- File size and format
- Network connectivity
- Environment variables
- Supabase connection

### Issue: Processing stalls
**Check:**
- Mux webhook configuration
- SightEngine API quota
- Database connection
- Server logs

### Issue: Earnings not calculated
**Check:**
- Video processing completion
- Scenario extraction
- Database triggers
- Calculation logic

### Issue: Webhooks not received
**Check:**
- Webhook URLs in service dashboards
- Webhook signatures
- Network accessibility (use ngrok for local testing)

## Monitoring and Logging

### 1. Check Application Logs
```bash
# View application logs
npm run dev
# Watch for error messages and warnings
```

### 2. Database Monitoring
```sql
-- Check video submissions
SELECT * FROM video_submissions ORDER BY created_at DESC LIMIT 10;

-- Check processing status
SELECT upload_status, COUNT(*) FROM video_submissions GROUP BY upload_status;

-- Check earnings
SELECT SUM(amount) as total_pending FROM driver_earnings WHERE payment_status = 'pending';
```

### 3. External Service Monitoring
- **Mux Dashboard**: Check asset processing status
- **SightEngine Dashboard**: Monitor API usage and job status
- **Stripe Dashboard**: Verify payment processing

## Success Criteria

✅ **Upload System**
- Files upload without errors
- Progress tracking works accurately
- Status updates in real-time
- Error handling provides clear messages

✅ **Processing Pipeline**
- Videos process through Mux successfully
- Anonymization completes without errors
- Scenarios are extracted automatically
- Earnings are calculated correctly

✅ **Error Handling**
- Invalid inputs are rejected with clear messages
- Network errors are handled gracefully
- Service outages don't crash the application
- Users receive appropriate feedback

✅ **Performance**
- Large file uploads complete successfully
- Multiple concurrent uploads work correctly
- Response times are acceptable (< 5s for API calls)
- Memory usage remains stable

## Production Deployment Checklist

Before deploying to production:

1. ✅ Update webhook URLs to production domain
2. ✅ Set up proper SSL certificates
3. ✅ Configure production environment variables
4. ✅ Set up monitoring and alerting
5. ✅ Test with production data
6. ✅ Verify backup and recovery procedures
7. ✅ Set up rate limiting
8. ✅ Configure CORS policies
9. ✅ Enable security headers
10. ✅ Set up log aggregation

## Getting Help

If you encounter issues during testing:

1. Check the application logs first
2. Verify environment variables are correct
3. Test individual API endpoints with curl
4. Check external service dashboards
5. Review the error handling documentation in `/src/lib/errors.js`

For additional support, refer to:
- Mux Documentation: https://docs.mux.com/
- SightEngine Documentation: https://sightengine.com/docs/
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs