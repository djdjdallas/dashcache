import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const scenario = searchParams.get('scenario')
    const location = searchParams.get('location')
    const weather = searchParams.get('weather')
    const minHours = searchParams.get('minHours')
    const maxPrice = searchParams.get('maxPrice')

    let query = supabaseAdmin
      .from('data_packages')
      .select(`
        *,
        package_scenarios (
          video_scenarios (
            scenario_type,
            tags,
            location_data
          )
        )
      `)
      .eq('is_active', true)

    // Apply filters
    if (scenario) {
      query = query.contains('scenario_types', [scenario])
    }

    if (minHours) {
      query = query.gte('total_duration_hours', parseFloat(minHours))
    }

    if (maxPrice) {
      query = query.lte('total_price', parseFloat(maxPrice))
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching packages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      )
    }

    // Additional filtering that can't be done in the query
    let filteredData = data || []

    if (location) {
      filteredData = filteredData.filter(pkg => {
        const coverage = pkg.geographic_coverage
        if (Array.isArray(coverage)) {
          return coverage.some(loc => 
            loc.toLowerCase().includes(location.toLowerCase())
          )
        }
        return coverage && coverage.toLowerCase().includes(location.toLowerCase())
      })
    }

    if (weather) {
      filteredData = filteredData.filter(pkg => {
        const conditions = pkg.weather_conditions
        if (Array.isArray(conditions)) {
          return conditions.includes(weather)
        }
        return conditions === weather
      })
    }

    return NextResponse.json({
      packages: filteredData,
      count: filteredData.length
    })

  } catch (error) {
    console.error('Error in data packages API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const packageData = await request.json()

    const {
      title,
      description,
      scenario_types,
      total_clips,
      total_duration_hours,
      geographic_coverage,
      weather_conditions,
      price_per_hour,
      created_by,
      scenario_ids
    } = packageData

    if (!title || !scenario_types || !total_duration_hours || !price_per_hour || !created_by) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const total_price = total_duration_hours * price_per_hour

    // Create the package
    const { data: newPackage, error: packageError } = await supabaseAdmin
      .from('data_packages')
      .insert([{
        title,
        description,
        scenario_types,
        total_clips,
        total_duration_hours,
        geographic_coverage,
        weather_conditions,
        price_per_hour,
        total_price,
        created_by
      }])
      .select()
      .single()

    if (packageError) {
      console.error('Error creating package:', packageError)
      return NextResponse.json(
        { error: 'Failed to create package' },
        { status: 500 }
      )
    }

    // Link scenarios to package
    if (scenario_ids && scenario_ids.length > 0) {
      const packageScenarios = scenario_ids.map(scenarioId => ({
        package_id: newPackage.id,
        scenario_id: scenarioId
      }))

      const { error: linkError } = await supabaseAdmin
        .from('package_scenarios')
        .insert(packageScenarios)

      if (linkError) {
        console.error('Error linking scenarios:', linkError)
        // Don't fail the whole operation, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      package: newPackage
    })

  } catch (error) {
    console.error('Error creating package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}