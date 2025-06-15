import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { submissionId } = await request.json()
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId required' },
        { status: 400 }
      )
    }
    
    console.log('🗑️ Deleting existing scenarios for submission:', submissionId)
    
    // Delete existing scenarios
    const { error: deleteError } = await supabaseAdmin
      .from('video_scenarios')
      .delete()
      .eq('video_submission_id', submissionId)
    
    if (deleteError) {
      throw deleteError
    }
    
    console.log('✅ Scenarios deleted successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Scenarios deleted, ready for regeneration'
    })
    
  } catch (error) {
    console.error('Error resetting scenarios:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}