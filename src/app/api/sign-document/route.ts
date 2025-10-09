import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { createHash } from 'crypto'
import QRCode from 'qrcode'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Database connection with fallback
let db: any = null;

async function getDatabase() {
  if (!db) {
    try {
      const { db: dbClient } = await import('@/lib/db');
      db = dbClient;
      await db.$connect();
      return db;
    } catch (error) {
      console.error('Database connection failed:', error);
      return null;
    }
  }
  return db;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting document processing...')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const signatureData = formData.get('signature') as string

    if (!file || !signatureData) {
      console.error('Missing file or signature')
      return NextResponse.json(
        { error: 'File dan tanda tangan diperlukan' },
        { status: 400 }
      )
    }

    console.log('File received:', file.name, 'Size:', file.size)

    // Try database connection (optional)
    const database = await getDatabase();
    
    // Create uploads directory in /tmp for Vercel compatibility
    const uploadsDir = join('/tmp', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
      console.log('Created uploads directory:', uploadsDir)
    }

    // Generate unique verification ID
    const verificationId = createHash('sha256')
      .update(file.name + Date.now() + Math.random())
      .digest('hex')
      .substring(0, 16)

    console.log('Generated verification ID:', verificationId)

    // Create document hash for verification
    const documentHash = createHash('sha256')
      .update(file.name + signatureData + verificationId)
      .digest('hex')

    // Generate QR Code URL for direct download
    const baseUrl = 'https://digital-signature-app-six.vercel.app'
    const signedFileName = `${file.name.replace(/\.[^/.]+$/, '')}_signed_${verificationId}.pdf`
    const downloadUrl = `${baseUrl}/api/download/${signedFileName}`
    
    console.log('Generated download URL:', downloadUrl)
    
    // Generate QR Code image
    const qrCodeBuffer = await QRCode.toBuffer(downloadUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    console.log('QR Code generated successfully')

    // Create signed PDF with QR Code integration
    let signedPdfBuffer: Buffer
    
    if (file.type === 'application/pdf') {
      // If it's a PDF, integrate QR Code into it
      const existingPdfBytes = await readFile(join(uploadsDir, originalFileName))
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      const pages = pdfDoc.getPages()
      
      // Add QR Code to the last page
      const lastPage = pages[pages.length - 1]
      const { width, height } = lastPage.getSize()
      
      // Embed QR Code image
      const qrCodeImage = await pdfDoc.embedPng(qrCodeBuffer)
      const qrCodeDims = { width: 100, height: 100 }
      
      // Position QR Code at bottom right
      const qrCodeX = width - qrCodeDims.width - 30
      const qrCodeY = 30
      
      lastPage.drawImage(qrCodeImage, {
        x: qrCodeX,
        y: qrCodeY,
        width: qrCodeDims.width,
        height: qrCodeDims.height,
      })
      
      // Add signature text
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontSize = 10
      
      // Add verification text
      lastPage.drawText('Scan QR Code untuk verifikasi keaslian dokumen', {
        x: qrCodeX - 150,
        y: qrCodeY + 105,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      
      // Add signature image if provided
      if (signatureData) {
        try {
          // Extract base64 data from signature
          const base64Data = signatureData.replace(/^data:image\/png;base64,/, '')
          const signatureBuffer = Buffer.from(base64Data, 'base64')
          const signatureImage = await pdfDoc.embedPng(signatureBuffer)
          
          // Add signature at bottom right area
          const signatureWidth = 150
          const signatureHeight = 75
          const signatureX = width - signatureWidth - 30
          const signatureY = qrCodeY + 130
          
          lastPage.drawImage(signatureImage, {
            x: signatureX,
            y: signatureY,
            width: signatureWidth,
            height: signatureHeight,
          })
          
          // Add signature label
          lastPage.drawText('Tanda Tangan Digital:', {
            x: signatureX,
            y: signatureY + 80,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          })
        } catch (sigError) {
          console.error('Error adding signature to PDF:', sigError)
        }
      }
      
      // Add timestamp and verification info
      const timestampText = `Ditandatangani pada: ${new Date().toLocaleString('id-ID')}`
      lastPage.drawText(timestampText, {
        x: 30,
        y: 30,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      
      const verificationText = `ID Verifikasi: ${verificationId}`
      lastPage.drawText(verificationText, {
        x: 30,
        y: 50,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      
      signedPdfBuffer = Buffer.from(await pdfDoc.save())
      
    } else {
      // For non-PDF files, create a simple PDF with the image and QR Code
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([600, 800])
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      
      // Add title
      page.drawText('Dokumen Digital Ditandatangani', {
        x: 50,
        y: 750,
        size: 20,
        font,
        color: rgb(0, 0, 0),
      })
      
      // Add original image if it's an image file
      if (file.type.startsWith('image/')) {
        try {
          const imageBytes = await readFile(join(uploadsDir, originalFileName))
          let image
          
          if (file.type === 'image/jpeg') {
            image = await pdfDoc.embedJpg(imageBytes)
          } else if (file.type === 'image/png') {
            image = await pdfDoc.embedPng(imageBytes)
          }
          
          if (image) {
            const imageDims = image.scale(0.5)
            page.drawImage(image, {
              x: 50,
              y: 400,
              width: imageDims.width,
              height: imageDims.height,
            })
          }
        } catch (imgError) {
          console.error('Error adding image to PDF:', imgError)
        }
      }
      
      // Add QR Code
      const qrCodeImage = await pdfDoc.embedPng(qrCodeBuffer)
      page.drawImage(qrCodeImage, {
        x: 400,
        y: 50,
        width: 100,
        height: 100,
      })
      
      // Add signature
      if (signatureData) {
        try {
          const base64Data = signatureData.replace(/^data:image\/png;base64,/, '')
          const signatureBuffer = Buffer.from(base64Data, 'base64')
          const signatureImage = await pdfDoc.embedPng(signatureBuffer)
          
          page.drawImage(signatureImage, {
            x: 50,
            y: 150,
            width: 150,
            height: 75,
          })
        } catch (sigError) {
          console.error('Error adding signature:', sigError)
        }
      }
      
      // Add text information
      const fontSize = 12
      page.drawText(`File Asli: ${file.name}`, {
        x: 50,
        y: 100,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      
      page.drawText(`Tanggal: ${new Date().toLocaleString('id-ID')}`, {
        x: 50,
        y: 80,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      
      page.drawText(`ID Verifikasi: ${verificationId}`, {
        x: 50,
        y: 60,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      
      page.drawText('Scan QR Code untuk unduh dokumen', {
        x: 350,
        y: 160,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      
      signedPdfBuffer = Buffer.from(await pdfDoc.save())
    }

    // Save signed PDF to /tmp directory
    const signedFilePath = join(uploadsDir, signedFileName)
    await writeFile(signedFilePath, signedPdfBuffer)
    
    console.log('Signed PDF saved successfully:', signedFileName)

    // Save signature record to database (optional)
    if (database) {
      try {
        const signatureRecord = await database.digitalSignature.create({
          data: {
            originalFileName: file.name,
            signedFileName,
            fileSize: file.size,
            fileType: 'application/pdf',
            signatureData,
            documentHash,
            qrCodeUrl: downloadUrl,
            verificationId,
            ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        })
        
        console.log('Database record created:', signatureRecord.id)
      } catch (dbError) {
        console.error('Database save error:', dbError)
        // Continue even if database fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Dokumen PDF berhasil ditandatangani dengan QR Code',
      documentUrl: `/api/download/${signedFileName}`,
      qrCodeUrl: `data:image/png;base64,${qrCodeBuffer.toString('base64')}`,
      verificationId,
      downloadUrl,
      documentHash,
    })

  } catch (error) {
    console.error('Error processing document:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses dokumen: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}