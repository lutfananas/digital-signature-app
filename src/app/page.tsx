'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Download, Pen, Eraser, Save, FileText, QrCode, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureData, setSignatureData] = useState<string>('')
  const [processedFileUrl, setProcessedFileUrl] = useState<string>('')
  const [certificateUrl, setCertificateUrl] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [verificationId, setVerificationId] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setSelectedFile(file)
        setProcessedFileUrl('')
        setCertificateUrl('')
        setQrCodeUrl('')
        setVerificationId('')
        toast.success('File berhasil diunggah')
      } else {
        toast.error('Hanya file PDF dan gambar yang didukung')
      }
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png')
      setSignatureData(dataUrl)
      toast.success('Tanda tangan disimpan')
    }
  }

  const processDocument = async () => {
    if (!selectedFile || !signatureData) {
      toast.error('Silakan pilih file dan buat tanda tangan terlebih dahulu')
      return
    }

    setIsProcessing(true)
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('signature', signatureData)

    try {
      const response = await fetch('/api/sign-document', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setProcessedFileUrl(result.originalFileUrl)
        setCertificateUrl(result.certificateUrl)
        setQrCodeUrl(result.qrCodeUrl)
        setVerificationId(result.verificationId)
        toast.success('Dokumen berhasil ditandatangani dengan QR Code!')
      } else {
        toast.error('Gagal memproses dokumen')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memproses dokumen')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadDocument = () => {
    if (processedFileUrl) {
      const a = document.createElement('a')
      a.href = processedFileUrl
      a.download = selectedFile?.name || 'document'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const downloadCertificate = () => {
    if (certificateUrl) {
      const a = document.createElement('a')
      a.href = certificateUrl
      a.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '')}_certificate.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const a = document.createElement('a')
      a.href = qrCodeUrl
      a.download = `qrcode_${verificationId}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-green-600" />
            <h1 className="text-4xl font-bold text-slate-900">Aplikasi Tanda Tangan Digital</h1>
            <QrCode className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-slate-600">Tandatangani dokumen dengan QR Code verifikasi keaslian</p>
          <p className="text-sm text-slate-500 mt-2">Setiap dokumen mendapatkan QR Code unik yang bisa diverifikasi oleh siapa saja</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Unggah Dokumen
              </CardTitle>
              <CardDescription>
                Pilih file PDF atau gambar yang akan ditandatangani
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 mb-2">
                  {selectedFile ? selectedFile.name : 'Klik untuk memilih file'}
                </p>
                <p className="text-sm text-slate-500">
                  PDF, JPG, PNG (Maks. 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {selectedFile && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">File Terpilih:</p>
                  <p className="text-sm text-slate-600">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pen className="w-5 h-5" />
                Tanda Tangan Digital
              </CardTitle>
              <CardDescription>
                Buat tanda tangan digital Anda di bawah ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-slate-300 rounded-lg p-2 bg-white">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  className="w-full cursor-crosshair border border-slate-200 rounded"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearSignature}
                  className="flex items-center gap-2"
                >
                  <Eraser className="w-4 h-4" />
                  Hapus
                </Button>
                <Button
                  onClick={saveSignature}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Simpan Tanda Tangan
                </Button>
              </div>

              {signatureData && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Tanda tangan siap digunakan
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Process Section */}
        {selectedFile && signatureData && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Proses Dokumen dengan QR Code</CardTitle>
              <CardDescription>
                Tambahkan tanda tangan dan generate QR Code verifikasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Button
                  onClick={processDocument}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      Generate QR Code & Tandatangani
                    </>
                  )}
                </Button>

                {processedFileUrl && (
                  <>
                    <Button
                      variant="outline"
                      onClick={downloadDocument}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Unduh File Asli
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadCertificate}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Unduh Sertifikat
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadQRCode}
                      className="flex items-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      Unduh QR Code
                    </Button>
                  </>
                )}
              </div>

              {processedFileUrl && qrCodeUrl && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Proses Berhasil!
                    </h3>
                    <p className="text-sm text-green-700 mb-3">
                      Dokumen Anda telah diproses. Anda dapat mengunduh file asli dan sertifikat digital.
                    </p>
                    <div className="space-y-2 text-sm">
                      <p><strong>ID Verifikasi:</strong> {verificationId}</p>
                      <p><strong>Status:</strong> <span className="text-green-600">Terverifikasi</span></p>
                      <p className="text-xs text-green-600 mt-2">
                        💡 File asli tetap utuh, sertifikat berisi tanda tangan dan QR Code verifikasi
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      QR Code Verifikasi
                    </h3>
                    <div className="flex justify-center mb-3">
                      <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 border-2 border-blue-200 rounded-lg" />
                    </div>
                    <p className="text-sm text-blue-700 text-center">
                      Scan QR Code untuk verifikasi keaslian dokumen
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* How it Works Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Cara Kerja Verifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Tandatangani Dokumen</h3>
                <p className="text-sm text-slate-600">Unggah file dan buat tanda tangan digital</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">Generate QR Code</h3>
                <p className="text-sm text-slate-600">Sistem membuat QR Code unik untuk verifikasi</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">Verifikasi Keaslian</h3>
                <p className="text-sm text-slate-600">Siapa pun bisa scan QR Code untuk memverifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}