# DashCache Pipeline Testing Guide

## 🧪 **Testing the Complete Video Processing Pipeline**

### **Prerequisites**
1. ✅ Admin user access (`user_type = 'admin'`)
2. ✅ ngrok running for webhook reception
3. ✅ Valid SightEngine API credentials
4. ✅ Valid Mux API credentials

## **1. Pipeline Health Check**

### Test Endpoints:
```bash
# Check pipeline monitoring
curl http://localhost:3000/api/monitoring/pipeline-status

# Check stuck videos
curl http://localhost:3000/api/recovery/retry-stuck-videos
```

### Expected Results:
- ✅ Returns metrics without errors
- ✅ Shows current video processing status
- ✅ Lists any stuck videos

## **2. End-to-End Upload Test**

### Step 1: Upload Test Video
1. **Go to:** `/driver-dashboard`
2. **Upload:** Small test video (< 50MB)
3. **Watch logs:** Terminal should show:
   ```
   🔔 Mux webhook received!
   📦 Webhook body length: [number]
   🔐 Signature present: true
   ⚠️ Webhook verification disabled in development
   ✅ Mux webhook event verified: video.upload.asset_created
   ```

### Step 2: Monitor Processing
1. **Go to:** `/monitoring` (admin only)
2. **Check:** Real-time pipeline status
3. **Verify:** Video progresses through statuses:
   - `uploading` → `processing` → `ready` → `anonymizing` → `completed`

### Step 3: Verify Scenarios
1. **Go to:** `/admin` → Content Moderation tab
2. **Check:** Scenarios were extracted
3. **Expected types:**
   - `intersection_turn`
   - `pedestrian_crossing`
   - `highway_merging`
   - `parking`
   - `weather_driving`

## **3. Database Verification**

### Check Video Submission:
```sql
SELECT id, original_filename, upload_status, mux_asset_id, 
       sightengine_job_id, duration_seconds, created_at, updated_at
FROM video_submissions 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Extracted Scenarios:
```sql
SELECT vs.scenario_type, vs.confidence_score, vs.is_approved,
       vss.original_filename
FROM video_scenarios vs
JOIN video_submissions vss ON vs.video_submission_id = vss.id
ORDER BY vs.created_at DESC 
LIMIT 10;
```

### Check Driver Earnings:
```sql
SELECT de.amount, de.earning_type, de.payment_status,
       p.full_name, p.email
FROM driver_earnings de
JOIN profiles p ON de.driver_id = p.id
ORDER BY de.earned_at DESC 
LIMIT 5;
```

## **4. Webhook Testing**

### Manual Webhook Test:
```bash
# Test Mux webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/mux \
  -H "Content-Type: application/json" \
  -H "mux-signature: test-signature" \
  -d '{
    "type": "video.upload.asset_created",
    "object": {"id": "test-upload-id"},
    "data": {"asset_id": "test-asset-id"}
  }'
```

### Expected Response:
```json
{"received": true}
```

## **5. Error Recovery Testing**

### Simulate Stuck Video:
1. **Create test upload** that gets stuck
2. **Use recovery API:**
   ```bash
   curl -X POST http://localhost:3000/api/recovery/retry-stuck-videos \
     -H "Content-Type: application/json" \
     -d '{
       "videoId": "your-video-id",
       "action": "check_mux_status"
     }'
   ```

### Test Recovery Actions:
- `check_mux_status` - Sync with Mux asset status
- `check_sightengine_status` - Check SightEngine job
- `force_complete` - Manually mark as completed
- `restart_processing` - Restart the pipeline

## **6. Performance Testing**

### Upload Multiple Videos:
1. **Upload 5 videos** simultaneously
2. **Monitor:** `/monitoring` dashboard
3. **Check:** All videos process successfully
4. **Verify:** No videos get stuck

### Load Test Endpoints:
```bash
# Test monitoring endpoint performance
for i in {1..10}; do
  curl -w "@curl-format.txt" http://localhost:3000/api/monitoring/pipeline-status
done
```

## **7. Integration Testing**

### Test Complete User Journey:

#### As Driver:
1. ✅ Upload video via `/driver-dashboard`
2. ✅ See processing progress
3. ✅ View earnings in dashboard
4. ✅ Check video shows as "completed"

#### As Admin:
1. ✅ Review scenarios in `/admin`
2. ✅ Approve/reject content
3. ✅ Monitor pipeline health in `/monitoring`
4. ✅ Use recovery tools for stuck videos

#### As Buyer:
1. ✅ Browse packages in `/marketplace`
2. ✅ Filter by scenario types
3. ✅ Add to cart and checkout
4. ✅ Download purchased data

## **8. Troubleshooting Guide**

### Common Issues:

#### **Videos Stuck in "uploading":**
- ✅ Check ngrok is running
- ✅ Verify Mux webhook URL
- ✅ Check webhook logs in terminal

#### **No scenarios extracted:**
- ✅ Check SightEngine API credentials
- ✅ Verify video has detectable objects
- ✅ Check scenario extraction logs

#### **Webhooks not received:**
- ✅ Verify ngrok URL in Mux dashboard
- ✅ Check webhook signature verification
- ✅ Ensure webhook endpoints are accessible

### Debug Commands:

```bash
# Check recent logs
tail -f ~/.pm2/logs/your-app-out.log

# Check webhook logs
curl http://localhost:3000/api/monitoring/webhook-logs

# Manual status sync
curl -X POST http://localhost:3000/api/dev/sync-mux \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "your-id",
    "assetId": "mux-asset-id",
    "playbackId": "mux-playback-id",
    "duration": 93
  }'
```

## **9. Success Criteria**

### ✅ **Pipeline is healthy when:**
- Videos process end-to-end in < 10 minutes
- < 5% of videos get stuck
- Webhooks are received within 30 seconds
- Scenarios are extracted for 80%+ of videos
- Admin can approve/reject scenarios
- Buyers can purchase and download data

### ⚠️ **Red flags:**
- Videos stuck for > 30 minutes
- No webhook activity
- Empty scenario extraction
- Failed database queries
- Monitoring dashboard shows errors

## **10. Automated Health Checks**

Set up these automated checks:

```bash
# Cron job to check pipeline health every 5 minutes
*/5 * * * * curl -s http://localhost:3000/api/monitoring/pipeline-status | jq '.healthStatus'

# Alert if stuck videos > threshold
*/15 * * * * curl -s http://localhost:3000/api/recovery/retry-stuck-videos | jq '.count' | awk '$1 > 5 { print "ALERT: " $1 " stuck videos" }'
```

This comprehensive testing guide ensures your DashCache pipeline is robust and reliable! 🚀