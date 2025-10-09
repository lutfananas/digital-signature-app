import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { decodeURIComponent } from 'url'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Decode the filename to handle spaces and special characters
    const filename = decodeURIComponent(params.filename)
    const uploadsDir = join('/tmp', 'uploads')
    const filePath = join(uploadsDir, filename)

    console.log('Attempting to download file:', filePath)
    console.log('File exists:', existsSync(filePath))

    if (!existsSync(filePath)) {
      console.error('File not found:', filePath)
      return NextResponse.json(
        { error: 'File tidak ditemukan', path: filePath },
        { status: 404 }
      )
    }

    const fileBuffer = await readFile(filePath)
    console.log('File read successfully, size:', fileBuffer.length)
    
    // Determine content type based on file extension
    const ext = filename.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case 'html':
        contentType = 'text/html; charset=utf-8'
        break
      case 'pdf':
        contentType = 'application/pdf'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })

  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengunduh file: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}