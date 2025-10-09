import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, FileText, Calendar, Shield, QrCode } from 'lucide-react'

interface VerifyPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  return {
    title: 'Verifikasi Dokumen Digital',
    description: 'Halaman verifikasi keaslian dokumen digital',
  }
}

async function getDocumentData(verificationId: string) {
  try {
    const document = await db.digitalSignature.findUnique({
      where: { verificationId },
    })

    if (!document) {
      return null
    }

    return document
  } catch (error) {
    console.error('Error fetching document:', error)
    return null
  }
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const document = await getDocumentData(params.id)

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Dokumen Tidak Valid</CardTitle>
            <CardDescription>
              Dokumen dengan ID verifikasi ini tidak ditemukan dalam sistem kami.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                ID Verifikasi: <code className="bg-gray-100 px-2 py-1 rounded">{params.id}</code>
              </p>
              <p className="text-sm text-gray-500">
                Pastikan Anda memindai QR Code dari dokumen yang resmi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isValid = true // Dokumen ditemukan di database dianggap valid
  const createdDate = new Date(document.createdAt)
  const formattedDate = createdDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = createdDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-slate-900">Verifikasi Dokumen Digital</h1>
          </div>
          <p className="text-slate-600">Halaman verifikasi keaslian dokumen</p>
        </div>

        {/* Status Card */}
        <Card className={`mb-6 border-2 ${isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isValid ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
                <div>
                  <h2 className={`text-2xl font-bold ${isValid ? 'text-green-700' : 'text-red-700'}`}>
                    {isValid ? 'Dokumen Sah' : 'Dokumen Tidak Sah'}
                  </h2>
                  <p className={`text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isValid 
                      ? 'Dokumen ini terdaftar dalam sistem dan dianggap sah'
                      : 'Dokumen ini tidak valid atau telah dimanipulasi'
                    }
                  </p>
                </div>
              </div>
              <Badge variant={isValid ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                {isValid ? 'VALID' : 'INVALID'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informasi Dokumen
              </CardTitle>
              <CardDescription>
                Detail informasi mengenai dokumen yang ditandatangani
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nama File Asli</label>
                  <p className="text-sm font-semibold">{document.originalFileName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ukuran File</label>
                  <p className="text-sm font-semibold">{(document.fileSize / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipe File</label>
                  <p className="text-sm font-semibold">{document.fileType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ID Verifikasi</label>
                  <p className="text-sm font-semibold font-mono">{document.verificationId}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Hash Dokumen</label>
                <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                  {document.documentHash}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Signature Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Informasi Tanda Tangan
              </CardTitle>
              <CardDescription>
                Detail mengenai proses penandatanganan digital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tanggal Tanda Tangan</label>
                  <p className="text-sm font-semibold">{formattedDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Waktu Tanda Tangan</label>
                  <p className="text-sm font-semibold">{formattedTime}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">IP Address</label>
                  <p className="text-sm font-semibold">{document.ipAddress || 'Tidak tersedia'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status Verifikasi</label>
                  <div className="flex items-center gap-2">
                    {document.isVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">Terverifikasi</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-600">Belum Diverifikasi</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">User Agent</label>
                <p className="text-xs bg-gray-100 p-2 rounded break-all">
                  {document.userAgent || 'Tidak tersedia'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
                Keamanan & Verifikasi
              </CardTitle>
            <CardDescription>
              Informasi mengenai keamanan dan cara verifikasi dokumen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-green-700">✅ Fitur Keamanan</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Tanda tangan digital dengan enkripsi SHA-256</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>QR Code unik untuk setiap dokumen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Timestamp yang tercatat di database</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Verifikasi real-time online</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-blue-700">ℹ️ Cara Verifikasi</h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">1.</span>
                    <span>Scan QR Code pada dokumen asli</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">2.</span>
                    <span>Buka link yang muncul di browser</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">3.</span>
                    <span>Periksa status keaslian dokumen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">4.</span>
                    <span>Bandingkan informasi dengan dokumen fisik</span>
                  </li>
                </ol>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Penting:</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Pastikan URL yang Anda kunjungi adalah resmi dan terpercaya. 
                    Verifikasi hanya valid melalui situs web resmi Aplikasi Tanda Tangan Digital.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Halaman verifikasi ini dipersembahkan oleh Aplikasi Tanda Tangan Digital</p>
          <p>© 2024 - Sistem Tanda Tangan Digital dengan QR Code Verification</p>
        </div>
      </div>
    </div>
  )
}