import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

const app = express();

// Konfigurasi CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:5173',
      'https://jurnal-project-665c6.web.app',
    ],
    credentials: true,
  }),
);

app.use(express.json());

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
 * POST /api/generate-upload-url
 * Generate presigned URL untuk upload file ke Cloudflare R2
 */
async function handler(req, res) {
  // Health check
  if (req.method === 'GET') {
    return res.json({
      status: 'OK',
      message: 'Upload API is running on Vercel',
    });
  }

  // Handle POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        message: `File type ${contentType} tidak diizinkan.`,
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
      message: 'Gagal generate presigned URL.',
    });
  }
}

export default handler;
