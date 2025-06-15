import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Test 1: Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      return NextResponse.json({ 
        error: 'Failed to list buckets', 
        details: bucketsError 
      }, { status: 500 })
    }

    const dashcamBucket = buckets.find(bucket => bucket.name === 'dashcam-videos')
    
    // Test 2: Try to list files in bucket (if it exists)
    let bucketFiles = null
    if (dashcamBucket) {
      const { data: files, error: filesError } = await supabaseAdmin.storage
        .from('dashcam-videos')
        .list('', { limit: 10 })
      
      if (!filesError) {
        bucketFiles = files
      }
    }

    // Test 3: Check database schema
    const { data: columns, error: schemaError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'video_submissions')
      .eq('table_schema', 'public')

    return NextResponse.json({
      success: true,
      tests: {
        buckets: {
          total: buckets.length,
          dashcamBucketExists: !!dashcamBucket,
          bucketDetails: dashcamBucket,
          allBuckets: buckets.map(b => ({ name: b.name, id: b.id, public: b.public }))
        },
        storage: {
          canListFiles: !!bucketFiles,
          fileCount: bucketFiles?.length || 0,
          sampleFiles: bucketFiles?.slice(0, 3) || []
        },
        database: {
          schemaCheckWorked: !schemaError,
          videoSubmissionsColumns: columns?.map(c => c.column_name) || [],
          hasNewColumns: columns?.some(c => c.column_name === 'raw_video_path') || false
        }
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}