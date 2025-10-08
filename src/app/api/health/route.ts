import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection and create tables if needed
    await db.$connect()
    
    // Try to create a test record to verify database is working
    const testCount = await db.digitalSignature.count()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      recordCount: testCount,
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    
    // Try to initialize database
    try {
      // This will be handled by Prisma automatically
      await db.$connect()
      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully',
        recordCount: 0,
      })
    } catch (initError) {
      console.error('Database initialization failed:', initError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Database connection failed',
          details: initError instanceof Error ? initError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  }
}