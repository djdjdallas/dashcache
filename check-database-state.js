const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDatabaseState() {
  console.log('🔍 Checking database state...\n')
  
  // Check video submissions
  const { data: submissions, error: subError } = await supabase
    .from('video_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
    
  if (subError) {
    console.error('Error fetching submissions:', subError)
  } else {
    console.log(`📹 Found ${submissions.length} recent video submissions:`)
    submissions.forEach(sub => {
      console.log(`  - ${sub.original_filename} (${sub.upload_status})`)
      console.log(`    ID: ${sub.id}`)
      console.log(`    Upload ID: ${sub.mux_upload_id}`)
      console.log(`    Asset ID: ${sub.mux_asset_id}`)
      console.log(`    Playback ID: ${sub.mux_playback_id}`)
      console.log(`    Created: ${new Date(sub.created_at).toLocaleString()}`)
      console.log('')
    })
  }
  
  // Check webhook logs
  const { data: webhooks, error: webhookError } = await supabase
    .from('webhook_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
    
  if (webhookError) {
    console.error('Error fetching webhook logs:', webhookError)
  } else {
    console.log(`\n🔔 Found ${webhooks.length} recent webhook logs:`)
    webhooks.forEach(log => {
      console.log(`  - ${log.service} - ${log.event_type} at ${new Date(log.created_at).toLocaleString()}`)
      if (log.error_message) {
        console.log(`    ❌ Error: ${log.error_message}`)
      }
    })
  }
  
  // Check video scenarios
  const { data: scenarios, error: scenarioError } = await supabase
    .from('video_scenarios')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
    
  if (scenarioError) {
    console.error('Error fetching scenarios:', scenarioError)
  } else {
    console.log(`\n🎬 Found ${scenarios.length} recent video scenarios:`)
    scenarios.forEach(scenario => {
      console.log(`  - ${scenario.scenario_type} (${scenario.confidence_score})`)
      console.log(`    Video ID: ${scenario.video_submission_id}`)
      console.log(`    Time: ${scenario.start_time_seconds}s - ${scenario.end_time_seconds}s`)
    })
  }
  
  // Check for videos without scenarios
  const { data: videosWithScenarios } = await supabase
    .from('video_scenarios')
    .select('video_submission_id')
    .not('video_submission_id', 'is', null)
    
  const videoIdsWithScenarios = videosWithScenarios?.map(v => v.video_submission_id) || []
  
  let query = supabase
    .from('video_submissions')
    .select('id, original_filename, upload_status')
    
  if (videoIdsWithScenarios.length > 0) {
    query = query.not('id', 'in', `(${videoIdsWithScenarios.map(id => `'${id}'`).join(',')})`)
  }
  
  const { data: videosWithoutScenarios } = await query.limit(5)
  
  if (videosWithoutScenarios && videosWithoutScenarios.length > 0) {
    console.log(`\n⚠️  Found ${videosWithoutScenarios.length} videos without scenarios:`)
    videosWithoutScenarios.forEach(video => {
      console.log(`  - ${video.original_filename} (${video.upload_status})`)
      console.log(`    ID: ${video.id}`)
    })
  }
  
  // Check video submission status distribution
  const { data: statusCounts } = await supabase
    .from('video_submissions')
    .select('upload_status')
    
  if (statusCounts) {
    const statusMap = {}
    statusCounts.forEach(item => {
      statusMap[item.upload_status] = (statusMap[item.upload_status] || 0) + 1
    })
    
    console.log('\n📊 Video submission status distribution:')
    Object.entries(statusMap).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`)
    })
  }
  
  console.log('\n✅ Database check complete')
}

checkDatabaseState().catch(console.error)