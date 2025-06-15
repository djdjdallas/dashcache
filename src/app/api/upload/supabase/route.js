import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const userId = formData.get('userId')
    const fileName = formData.get('fileName')
    
    if (!file || !userId || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Uploading file:', fileName, 'for user:', userId)

    // Upload using service role to bypass RLS
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('dashcam-videos')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      path: uploadData.path,
      fullPath: uploadData.fullPath
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}