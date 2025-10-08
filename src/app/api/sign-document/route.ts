import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { db } from '@/lib/db'
import { createHash } from 'crypto'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const signatureData = formData.get('signature') as string

    if (!file || !signatureData) {
      return NextResponse.json(
        { error: 'File dan tanda tangan diperlukan' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique verification ID
    const verificationId = createHash('sha256')
      .update(file.name + Date.now() + Math.random())
      .digest('hex')
      .substring(0, 16)

    // Save uploaded file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const originalFileName = file.name
    const fileExtension = originalFileName.split('.').pop()
    const baseFileName = originalFileName.replace(`.${fileExtension}`, '')
    const signedFileName = `${baseFileName}_signed_${verificationId}.${fileExtension}`
    const filePath = join(uploadsDir, signedFileName)
    
    await writeFile(filePath, buffer)

    // Create document hash for verification
    const documentHash = createHash('sha256')
      .update(originalFileName + signatureData + verificationId)
      .digest('hex')

    // Generate QR Code URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/verify/${verificationId}`
    
    // Generate QR Code image
    const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    const qrCodeFileName = `qrcode_${verificationId}.png`
    const qrCodePath = join(uploadsDir, qrCodeFileName)
    await writeFile(qrCodePath, qrCodeBuffer)

    // Create signed document with QR Code
    const qrCodeBase64 = `data:image/png;base64,${qrCodeBuffer.toString('base64')}`
    
    const signatureHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dokumen Ditandatangani - ${originalFileName}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                line-height: 1.6;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .content {
                margin: 20px 0;
            }
            .signature-section {
                margin-top: 50px;
                text-align: right;
                border-top: 1px solid #ccc;
                padding-top: 20px;
            }
            .signature-label {
                font-size: 14px;
                color: #666;
                margin-bottom: 10px;
            }
            .signature-image {
                max-width: 200px;
                height: auto;
            }
            .qr-section {
                margin-top: 30px;
                text-align: center;
                border: 2px dashed #007bff;
                padding: 20px;
                border-radius: 10px;
                background-color: #f8f9fa;
            }
            .qr-title {
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .qr-code {
                margin: 10px 0;
            }
            .qr-instruction {
                font-size: 12px;
                color: #666;
                margin-top: 10px;
            }
            .verification-info {
                background-color: #e7f3ff;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #888;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>DOKUMEN DITANDATANGANI SECARA DIGITAL</h1>
            <p>Berlaku sejak: ${new Date().toLocaleDateString('id-ID')}</p>
        </div>
        
        <div class="content">
            <h2>Informasi Dokumen</h2>
            <p><strong>Nama File Asli:</strong> ${originalFileName}</p>
            <p><strong>Ukuran File:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
            <p><strong>Tipe File:</strong> ${file.type}</p>
            <p><strong>Waktu Tanda Tangan:</strong> ${new Date().toLocaleString('id-ID')}</p>
            
            <div class="verification-info">
                <h3>Informasi Verifikasi</h3>
                <p><strong>ID Verifikasi:</strong> ${verificationId}</p>
                <p><strong>Hash Dokumen:</strong> ${documentHash}</p>
                <p><strong>URL Verifikasi:</strong> <a href="${verificationUrl}">${verificationUrl}</a></p>
            </div>
            
            <h3>Keterangan</h3>
            <p>Dokumen ini telah ditandatangani secara digital menggunakan Aplikasi Tanda Tangan Digital dengan QR Code verification.</p>
            <p>Tanda tangan digital ini valid dan sah sebagai bukti persetujuan.</p>
        </div>
        
        <div class="signature-section">
            <div class="signature-label">Tanda Tangan Digital:</div>
            <img src="${signatureData}" alt="Tanda Tangan Digital" class="signature-image" />
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
                Ditandatangani pada: ${new Date().toLocaleString('id-ID')}
            </p>
        </div>
        
        <div class="qr-section">
            <div class="qr-title">QR CODE VERIFIKASI KEASLIAN DOKUMEN</div>
            <p>Scan QR Code ini untuk memverifikasi keaslian dokumen</p>
            <div class="qr-code">
                <img src="${qrCodeBase64}" alt="QR Code Verifikasi" style="max-width: 150px; height: auto;" />
            </div>
            <div class="qr-instruction">
                <p>1. Buka kamera smartphone atau QR scanner</p>
                <p>2. Arahkan ke QR Code ini</p>
                <p>3. Buka link yang muncul untuk verifikasi</p>
                <p>4. Atau kunjungi: ${verificationUrl}</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Dokumen ini diproses melalui Aplikasi Tanda Tangan Digital dengan QR Code Verification</p>
            <p>Dokumen ini sah dan dapat diverifikasi keasliannya secara online</p>
        </div>
    </body>
    </html>
    `

    // Save the signed document
    const signedFilePath = join(uploadsDir, signedFileName)
    await writeFile(signedFilePath, signatureHtml)

    // Save signature record to database
    const signatureRecord = await db.digitalSignature.create({
      data: {
        originalFileName,
        signedFileName,
        fileSize: file.size,
        fileType: file.type,
        signatureData,
        documentHash,
        qrCodeUrl: verificationUrl,
        verificationId,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil ditandatangani dengan QR Code',
      documentUrl: `/api/download/${signedFileName}`,
      qrCodeUrl: `data:image/png;base64,${qrCodeBuffer.toString('base64')}`,
      verificationId,
      verificationUrl,
      documentHash,
      signatureId: signatureRecord.id,
    })

  } catch (error) {
    console.error('Error processing document:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses dokumen' },
      { status: 500 }
    )
  }
}