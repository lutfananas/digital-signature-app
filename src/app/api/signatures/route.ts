import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const signatures = await db.digitalSignature.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        originalFileName: true,
        signedFileName: true,
        fileSize: true,
        fileType: true,
        documentHash: true,
        createdAt: true,
        ipAddress: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: signatures.map(sig => ({
        ...sig,
        fileSize: `${(sig.fileSize / 1024).toFixed(2)} KB`,
        createdAt: sig.createdAt.toISOString(),
      }))
    })
  } catch (error) {
    console.error('Error fetching signatures:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil riwayat tanda tangan' },
      { status: 500 }
    )
  }
}