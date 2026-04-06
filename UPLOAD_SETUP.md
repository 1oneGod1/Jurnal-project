# Panduan Setup Upload Dokumentasi

Aplikasi ini memerlukan backend API endpoint untuk generate presigned URL dari Cloudflare R2 agar dapat melakukan upload file dokumentasi (foto, video, PDF).

## Prasyarat

1. **Akun Cloudflare** dengan R2 (Object Storage) yang sudah dikonfigurasi
2. **Backend server** (Node.js, Python, atau bahasa lainnya) untuk generate presigned URL
3. **Environment variable** yang sudah dikonfigurasi di `.env`

## Step 1: Setup Cloudflare R2

### 1.1 Buat R2 Bucket

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigasi ke **R2** di sidebar
3. Klik **Create Bucket**
4. Isi nama bucket: `jurnal-proyek-dokumentasi` (atau nama lainnya)
5. Pilih region terdekat (misal: **Singapore** untuk Asia Tenggara)
6. Klik **Create bucket**

### 1.2 Dapatkan API Token

1. Di dashboard Cloudflare, navigasi ke **My Profile** > **API Tokens**
2. Klik **Create Token**
3. Gunakan template **Edit Cloudflare R2**
4. Konfigurasi permissions:
   - **Permissions**: Object.Storage - R2 (All Operations)
   - **Account Resources**: All Accounts
5. Klik **Continue to summary** → **Create Token**
6. **Copy dan simpan token** (jangan bagikan!)

### 1.3 Dapatkan Account ID

1. Di dashboard R2, klik nama bucket yang telah dibuat
2. Di tab **Settings**, cari **Account ID** - copy nilai tersebut

## Step 2: Buat Backend API untuk Generate Presigned URL

Berikut adalah contoh implementasi dengan **Node.js + Express**:

### 2.1 Install Dependencies

```bash
npm install express cors dotenv aws-sdk
```

### 2.2 Buat File Backend

Buat file `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const AWS = require('aws-sdk');

// Konfigurasi Cloudflare R2 (kompatibel dengan S3 API)
const s3 = new AWS.S3({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.CLOUDFLARE_API_TOKEN,
  secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY,
  region: 'auto',
  s3ForcePathStyle: false,
});

// Endpoint untuk generate upload URL
app.post('/generate-upload-url', async (req, res) => {
  const { filename, contentType, projectId } = req.body;

  if (!filename || !contentType) {
    return res.status(400).json({
      error: 'filename dan contentType wajib diisi',
    });
  }

  try {
    // Buat nama file unik dengan timestamp dan projectId
    const timestamp = Date.now();
    const uniqueFilename = `${projectId}/${timestamp}-${filename}`;

    // Generate presigned PUT URL
    const uploadUrl = s3.getSignedUrl('putObject', {
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: uniqueFilename,
      ContentType: contentType,
      Expires: 3600, // 1 jam
    });

    // Generate public URL untuk file yang sudah di-upload
    const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${uniqueFilename}`;

    res.json({
      uploadUrl,
      publicUrl,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({
      error: 'Failed to generate upload URL',
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Upload API running on port ${PORT}`);
});
```

### 2.3 Konfigurasi Environment Backend

Buat file `.env` di folder backend:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_SECRET_KEY=your_secret_key
CLOUDFLARE_BUCKET_NAME=jurnal-proyek-dokumentasi
CLOUDFLARE_PUBLIC_URL=https://your-custom-domain.com

# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:5173,https://jurnal-proyek.com
```

### 2.4 Jalankan Backend

```bash
node server.js
```

## Step 3: Konfigurasi Frontend Environment

### 3.1 Update `.env` di Frontend

Edit file `h:\Jurnal\jurnal-proyek-arduino\.env`:

```env
# ... Firebase config yang sudah ada ...

# Upload API Endpoint
VITE_UPLOAD_API_ENDPOINT=http://localhost:3001/generate-upload-url
# Untuk production:
# VITE_UPLOAD_API_ENDPOINT=https://api.jurnal-proyek.com/generate-upload-url
```

### 3.2 Restart Dev Server

```bash
npm run dev
```

## Step 4: Setup Custom Domain (Opsional)

Untuk membuat URL file yang lebih rapi, setup custom domain di Cloudflare:

1. Di R2 bucket, tab **Settings**
2. Klik **Connect Domain**
3. Pilih domain atau subdomain (misal: `docs.jurnal-proyek.com`)
4. Follow instruksi Cloudflare untuk konfigurasi DNS

Kemudian update `CLOUDFLARE_PUBLIC_URL` di `.env` backend dengan domain baru.

## Step 5: Test Upload

1. Akses aplikasi di `http://localhost:5173`
2. Buat proyek baru
3. Tambahkan log harian
4. Klik tombol **Upload Berkas**
5. Pilih file (gambar, video, atau PDF)
6. Tunggu proses upload selesai
7. File akan ditampilkan sebagai preview di aplikasi

## Troubleshooting

### Error: "Set VITE_UPLOAD_API_ENDPOINT terlebih dahulu"

- Pastikan environment variable sudah diisi di `.env`
- Restart dev server setelah mengubah `.env`

### Error CORS

- Pastikan backend sudah menggunakan `cors` middleware
- Update `CORS_ORIGIN` di backend untuk mengizinkan domain frontend

### Error Upload Gagal

- Cek apakah `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_SECRET_KEY` sudah benar
- Pastikan bucket name sesuai dengan konfigurasi
- Cek di console backend untuk error details

### Presigned URL Expired

- Sesuaikan nilai `Expires` di backend (default 3600 detik = 1 jam)
- Cukup untuk sebagian besar use case

## Struktur File Upload di R2

```
jurnal-proyek-dokumentasi/
├── project-id-1/
│   ├── 1704816000000-foto-sensor.jpg
│   ├── 1704816500000-video-demo.mp4
│   └── 1704817000000-laporan.pdf
├── project-id-2/
│   └── ...
```

## Best Practices

1. **Security**: Jangan expose `CLOUDFLARE_SECRET_KEY` di frontend
2. **Validation**: Validasi file size & type di backend
3. **Cleanup**: Setup lifecycle policy di R2 untuk hapus file lama
4. **Monitoring**: Monitor storage usage dan API calls
5. **Backup**: Backup dokumentasi penting secara berkala

## Dukungan

Untuk bantuan lebih lanjut:
- [Dokumentasi Cloudflare R2](https://developers.cloudflare.com/r2/)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
