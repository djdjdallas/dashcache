# DashCache API Documentation

## Overview

The DashCache API provides endpoints for video upload, processing, scenario management, and driver earnings. All endpoints return JSON responses and use standard HTTP status codes.

## Base URL
```
http://localhost:3000/api (development)
https://your-domain.com/api (production)
```

## Authentication

Most endpoints require authentication via Supabase JWT tokens. Include the token in the Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "error": {
    "type": "ERROR_TYPE",
    "message": "Human-readable error message",
    "details": {
      "field": "additional_context"
    },
    "requestId": "req_123456789"
  }
}
```

Common error types:
- `VALIDATION_ERROR`: Invalid input data
- `UPLOAD_FILE_TOO_LARGE`: File exceeds size limit
- `UPLOAD_UNSUPPORTED_FORMAT`: Invalid file format
- `AUTH_INSUFFICIENT_PERMISSIONS`: Access denied
- `INTERNAL_SERVER_ERROR`: Server error

## Endpoints

### Video Upload

#### Initialize Video Upload
```http
POST /api/upload/video
```

Initialize a video upload and get a secure upload URL.

**Request Body:**
```json
{
  "userId": "uuid",
  "filename": "dashcam_video.mp4",
  "fileSize": 52428800,
  "contentType": "video/mp4"
}
```

**Response:**
```json
{
  "success": true,
  "submissionId": "uuid",
  "uploadUrl": "https://upload.mux.com/signed-url",
  "uploadId": "mux-upload-id"
}
```

**Validation:**
- `userId`: Valid UUID, must be a driver
- `filename`: Non-empty string with valid extension (.mp4, .mov, .avi, .mkv)
- `fileSize`: Number, max 524,288,000 bytes (500MB)
- `contentType`: Must start with "video/"

#### Check Upload Status
```http
GET /api/upload/video?submissionId=uuid
```

**Response:**
```json
{
  "submissionId": "uuid",
  "status": "completed",
  "muxAssetId": "asset-id",
  "playbackId": "playback-id",
  "isAnonymized": true,
  "processingNotes": "Video successfully processed",
  "duration": 300
}
```

**Status Values:**
- `pending`: Upload not started
- `uploading`: File being uploaded
- `processing`: Video being processed by Mux
- `ready`: Video ready, starting anonymization
- `anonymizing`: Faces and plates being blurred
- `completed`: All processing complete
- `failed`: Processing failed

### Video Scenarios

#### List Scenarios
```http
GET /api/scenarios?approved=false&type=vehicle_detection&limit=50&offset=0&search=highway
```

**Query Parameters:**
- `approved`: Filter by approval status (true/false)
- `type`: Filter by scenario type
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)
- `search`: Search in scenario type and tags

**Response:**
```json
{
  "scenarios": [
    {
      "id": "uuid",
      "video_submission_id": "uuid",
      "scenario_type": "vehicle_detection",
      "start_time_seconds": 10,
      "end_time_seconds": 15,
      "confidence_score": 0.85,
      "tags": "{\"vehicle_count\": 3, \"vehicle_types\": [\"car\", \"truck\"]}",
      "is_approved": false,
      "created_at": "2024-01-01T00:00:00Z",
      "video_submissions": {
        "original_filename": "dashcam_video.mp4",
        "mux_playback_id": "playback-id",
        "profiles": {
          "full_name": "John Doe",
          "email": "john@example.com"
        }
      }
    }
  ],
  "count": 1,
  "total": 100,
  "pagination": {
    "offset": 0,
    "limit": 50,
    "hasMore": true
  }
}
```

#### Create Scenarios
```http
POST /api/scenarios
```

**Request Body:**
```json
{
  "videoSubmissionId": "uuid",
  "scenarios": [
    {
      "type": "vehicle_detection",
      "startTime": 10,
      "endTime": 15,
      "confidence": 0.85,
      "tags": ["urban", "daytime"],
      "metadata": {
        "vehicle_count": 3,
        "weather": "clear"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "scenarios": [...],
  "count": 1
}
```

#### Update Scenario
```http
PATCH /api/scenarios
```

**Request Body:**
```json
{
  "scenarioId": "uuid",
  "updates": {
    "is_approved": true,
    "approval_notes": "Approved for training dataset"
  }
}
```

#### Delete Scenario
```http
DELETE /api/scenarios?id=uuid
```

#### Get Scenario Statistics
```http
OPTIONS /api/scenarios
```

**Response:**
```json
{
  "total": 1500,
  "approved": 800,
  "pending": 700,
  "averageConfidence": 0.78,
  "typeDistribution": {
    "vehicle_detection": 500,
    "pedestrian_detection": 300,
    "traffic_sign": 200
  }
}
```

### Driver Earnings

#### Get Driver Earnings
```http
GET /api/payments/driver-payout?driverId=uuid&status=pending&limit=50&offset=0
```

**Query Parameters:**
- `driverId`: Required UUID of the driver
- `status`: Filter by payment status (pending/paid/failed/cancelled/all)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "earnings": [
    {
      "id": "uuid",
      "driver_id": "uuid",
      "video_submission_id": "uuid",
      "amount": "15.75",
      "earning_type": "footage_contribution",
      "payment_status": "pending",
      "metadata": "{\"duration_minutes\": 10, \"scenario_count\": 5}",
      "earned_at": "2024-01-01T00:00:00Z",
      "video_submissions": {
        "original_filename": "dashcam_video.mp4",
        "duration_seconds": 600
      }
    }
  ],
  "totals": {
    "pending": 150.25,
    "paid": 500.00,
    "total": 650.25
  },
  "pagination": {
    "offset": 0,
    "limit": 50,
    "hasMore": false
  }
}
```

#### Create Manual Earning
```http
POST /api/payments/driver-payout
```

**Request Body:**
```json
{
  "driverId": "uuid",
  "amount": 25.50,
  "earningType": "bonus",
  "videoSubmissionId": "uuid",
  "metadata": {
    "reason": "high_quality_footage",
    "bonus_multiplier": 1.5
  }
}
```

#### Process Stripe Payout
```http
POST /api/payments/driver-payout
```

**Request Body:**
```json
{
  "driverId": "uuid",
  "amount": 100.00,
  "earningIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "transferId": "tr_stripe_transfer_id",
  "amount": 100.00
}
```

#### Update Earning Status
```http
PATCH /api/payments/driver-payout
```

**Request Body:**
```json
{
  "earningIds": ["uuid1", "uuid2"],
  "status": "paid",
  "payoutDetails": {
    "method": "stripe_transfer",
    "transferId": "tr_123456789",
    "processedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Calculate Video Earnings
```http
PUT /api/payments/driver-payout
```

**Request Body:**
```json
{
  "videoSubmissionId": "uuid",
  "forceRecalculate": false
}
```

**Response:**
```json
{
  "success": true,
  "earning": {
    "id": "uuid",
    "amount": "12.50"
  },
  "calculation": {
    "baseAmount": 12.50,
    "durationMinutes": 8,
    "scenarioCount": 3,
    "scenarioTypes": ["vehicle_detection", "pedestrian_detection"]
  }
}
```

### Webhooks

#### Mux Webhook
```http
POST /api/webhooks/mux
```

Receives webhook events from Mux video processing service.

**Headers:**
- `mux-signature`: Webhook signature for verification

**Event Types:**
- `video.upload.asset_created`: Video upload completed
- `video.asset.ready`: Video processing completed
- `video.asset.errored`: Video processing failed
- `video.upload.cancelled`: Upload cancelled
- `video.upload.errored`: Upload failed

#### SightEngine Webhook
```http
POST /api/webhooks/sightengine
```

Receives webhook events from SightEngine anonymization service.

**Request Body:**
```json
{
  "job_id": "sightengine-job-id",
  "status": "completed",
  "output_url": "https://sightengine.com/output/anonymized.mp4",
  "error": null
}
```

**Status Values:**
- `processing`: Anonymization in progress
- `completed`: Anonymization completed successfully
- `failed`: Anonymization failed

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Upload endpoints: 10 requests per minute per IP
- General API endpoints: 100 requests per minute per user
- Webhook endpoints: 1000 requests per minute per service

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support cursor-based pagination:

**Request:**
```http
GET /api/scenarios?limit=50&offset=100
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "offset": 100,
    "limit": 50,
    "hasMore": true
  }
}
```

## File Upload Process

The video upload process follows these steps:

1. **Initialize Upload**
   ```bash
   POST /api/upload/video
   # Returns secure upload URL
   ```

2. **Upload File**
   ```bash
   PUT {uploadUrl}
   # Upload file directly to Mux
   ```

3. **Monitor Progress**
   ```bash
   GET /api/upload/video?submissionId=uuid
   # Poll for status updates
   ```

4. **Processing Pipeline**
   - Mux processes video
   - SightEngine anonymizes content
   - Scenarios are extracted
   - Earnings are calculated

## Error Handling Examples

### File Too Large
```json
{
  "error": {
    "type": "UPLOAD_FILE_TOO_LARGE",
    "message": "File size is too large. Maximum allowed size is 500MB.",
    "details": {
      "actualSize": 600000000,
      "maxSize": 524288000,
      "filename": "large_video.mp4"
    },
    "requestId": "req_123456789"
  }
}
```

### Unsupported Format
```json
{
  "error": {
    "type": "UPLOAD_UNSUPPORTED_FORMAT",
    "message": "Unsupported file format. Please upload MP4, MOV, AVI, or MKV files.",
    "details": {
      "actualType": "video/webm",
      "supportedTypes": ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska"]
    },
    "requestId": "req_123456789"
  }
}
```

### Authentication Error
```json
{
  "error": {
    "type": "AUTH_INSUFFICIENT_PERMISSIONS",
    "message": "You do not have permission to perform this action.",
    "details": {
      "requiredRole": "driver",
      "userRole": "buyer"
    },
    "requestId": "req_123456789"
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```javascript
class DashCacheAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async uploadVideo(file, userId) {
    // Initialize upload
    const initResponse = await fetch(`${this.baseUrl}/upload/video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        userId,
        filename: file.name,
        fileSize: file.size,
        contentType: file.type
      })
    });

    const { uploadUrl, submissionId } = await initResponse.json();

    // Upload file
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    return submissionId;
  }

  async checkUploadStatus(submissionId) {
    const response = await fetch(
      `${this.baseUrl}/upload/video?submissionId=${submissionId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    return response.json();
  }
}
```

### cURL Examples
```bash
# Initialize upload
curl -X POST http://localhost:3000/api/upload/video \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "driver-uuid",
    "filename": "dashcam.mp4",
    "fileSize": 50000000,
    "contentType": "video/mp4"
  }'

# Upload file (use returned uploadUrl)
curl -X PUT "https://upload.mux.com/signed-url" \
  -H "Content-Type: video/mp4" \
  --data-binary @dashcam.mp4

# Check status
curl "http://localhost:3000/api/upload/video?submissionId=uuid" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get earnings
curl "http://localhost:3000/api/payments/driver-payout?driverId=uuid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

Use the provided test files and follow the testing guide in `TESTING_GUIDE.md` for comprehensive API testing procedures.