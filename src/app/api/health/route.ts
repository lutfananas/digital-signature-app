import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test basic functionality without database
    return NextResponse.json({
      success: true,
      message: 'API is working correctly',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'Not set',
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}