const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Konfigurasi CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(express.json());

// Import AWS SDK v3 (lebih modern)
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Konfigurasi S3Client untuk Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

/**
 * POST /generate-upload-url
 * Generate presigned URL untuk upload file ke Cloudflare R2
 *
 * Request body:
 * {
 *   filename: string (nama file asli)
 *   contentType: string (MIME type)
 *   projectId: string (ID proyek di Firebase)
 * }
 *
 * Response:
 * {
 *   uploadUrl: string (URL presigned untuk PUT)
 *   publicUrl: string (URL public untuk mengakses file setelah upload)
 * }
 */
app.post('/generate-upload-url', async (req, res) => {
  try {
    const { filename, contentType, projectId } = req.body;

    // Validasi input
    if (!filename || !contentType || !projectId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'filename, contentType, dan projectId wajib diisi',
      });
    }

    // Validasi MIME type yang diizinkan
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(contentType)) {
      return res.status(400).json({
        error: 'Unsupported File Type',
        message: `File type ${contentType} tidak diizinkan. Izinkan: ${allowedMimeTypes.join(', ')}`,
      });
    }

    // Buat key dengan struktur: projectId/timestamp-filename
    const timestamp = Date.now();
    const fileExtension = filename.split('.').pop();
    const objectKey = `${projectId}/${timestamp}.${fileExtension}`;

    // Generate presigned PUT URL (untuk upload)
    const putCommand = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 3600, // 1 jam
    });

    // Buat public URL (setelah file di-upload, bisa diakses dengan URL ini)
    const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${objectKey}`;

    return res.json({
      uploadUrl,
      publicUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Gagal generate presigned URL. Cek konfigurasi backend.',
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Upload API server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} tidak ditemukan`,
  });
});

// Error handler
app.use((err, req, res) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Upload API server started on port ${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/generate-upload-url`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);

  // Validasi environment variables
  const requiredEnvs = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_ACCESS_KEY_ID',
    'CLOUDFLARE_SECRET_ACCESS_KEY',
    'CLOUDFLARE_BUCKET_NAME',
    'CLOUDFLARE_PUBLIC_URL',
  ];

  const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);

  if (missingEnvs.length > 0) {
    console.warn('⚠️  Missing environment variables:', missingEnvs.join(', '));
    console.warn('   Silakan setup .env file terlebih dahulu');
  }
});

module.exports = app;
