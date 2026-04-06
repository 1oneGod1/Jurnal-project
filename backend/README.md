# Backend Upload API - Jurnal Proyek Arduino

Backend server untuk generate presigned URL Cloudflare R2 agar aplikasi frontend dapat upload dokumentasi (foto, video, PDF) dengan aman.

## 📋 Prasyarat

- **Node.js** versi 16+ 
- **npm** atau **yarn**
- **Akun Cloudflare** dengan R2 bucket
- **Cloudflare API Token** (Access Key ID & Secret)

## 🚀 Quick Start

### Step 1: Setup Environment

```bash
# Copy template .env
cp .env.example .env

# Edit .env dengan kredensial Cloudflare Anda
# Gunakan text editor favorit (VS Code, nano, etc)
nano .env
```

**Isi nilai di .env:**

| Variable | Diperoleh dari |
|----------|----------------|
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard R2 → Settings → Account ID |
| `CLOUDFLARE_ACCESS_KEY_ID` | API Tokens → R2 API Token → Access Key ID |
| `CLOUDFLARE_SECRET_ACCESS_KEY` | API Tokens → R2 API Token → Secret Access Key |
| `CLOUDFLARE_BUCKET_NAME` | Nama bucket R2 (contoh: `jurnal-proyek-dokumentasi`) |
| `CLOUDFLARE_PUBLIC_URL` | Base URL publik files (contoh: `https://docs.jurnal.com`) |

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Jalankan Server

**Development mode** (dengan auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

Server akan berjalan di `http://localhost:3001`

### Step 4: Test API

```bash
# Cek health
curl http://localhost:3001/health

# Generate upload URL (test)
curl -X POST http://localhost:3001/generate-upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test-foto.jpg",
    "contentType": "image/jpeg",
    "projectId": "proj-123"
  }'
```

## 📡 API Endpoints

### POST `/generate-upload-url`

Generate presigned URL untuk upload file ke R2.

**Request:**

```json
{
  "filename": "dokumentasi.jpg",
  "contentType": "image/jpeg",
  "projectId": "project-id-123"
}
```

**Response Success (200):**

```json
{
  "uploadUrl": "https://..r2.cloudflarestorage.com/...",
  "publicUrl": "https://docs.jurnal.com/project-id-123/1704816000000.jpg",
  "expiresIn": 3600
}
```

**Response Error (400/500):**

```json
{
  "error": "Bad Request",
  "message": "Deskripsi error"
}
```

### GET `/health`

Health check endpoint.

**Response:**

```json
{
  "status": "OK",
  "message": "Upload API server is running"
}
```

## 📁 Struktur Folder Backend

```
backend/
├── server.js           # Main server file
├── package.json        # Dependencies & scripts
├── .env.example        # Template environment variables
└── .env               # (Jangan di-commit!) Kredensial aktif
```

## 🔧 Konfigurasi Lanjutan

### Ubah Port

Buka `.env`, ubah `PORT`:

```env
PORT=5000
```

### Tambah Domain Custom

1. Di Cloudflare R2 → Bucket Settings → Connect Domain
2. Follow instruksi untuk setup custom domain (misal: `docs.jurnal.com`)
3. Update di `.env`:

```env
CLOUDFLARE_PUBLIC_URL=https://docs.jurnal.com
```

### Update CORS Origin

Di `.env`, ubah `CORS_ORIGIN` untuk mengizinkan domain frontend:

```env
CORS_ORIGIN=http://localhost:5173,https://jurnal.com,https://www.jurnal.com
```

## 🐛 Troubleshooting

### Error: ENOENT: no such file or directory, open '.env'

**Solusi:** Copy `.env.example` ke `.env` dan isi kredensial:

```bash
cp .env.example .env
```

### Error: Akses ditolak (AWS credentials invalid)

- Cek `CLOUDFLARE_ACCESS_KEY_ID` dan `CLOUDFLARE_SECRET_ACCESS_KEY`
- Pastikan API Token memiliki permissions untuk R2
- Regenerate token jika perlu

### Error CORS

Frontend tidak bisa akses API. Update `CORS_ORIGIN` di `.env`:

```env
CORS_ORIGIN=http://localhost:5173,https://domain-frontend.com
```

### Error: Bucket not found

- Cek nama bucket di `CLOUDFLARE_BUCKET_NAME` (case-sensitive!)
- Pastikan bucket sudah dibuat di Cloudflare R2

### Error: File type not allowed

API hanya menerima: `image/*`, `video/mp4|webm`, `application/pdf`

Update di `server.js` jika perlu menambah tipe file:

```javascript
const allowedMimeTypes = [
  // ... existing types ...
  'application/zip', // tambahan baru
];
```

## 🔒 Security Best Practices

1. **Jangan Commit .env** → sudah ada di `.gitignore`
2. **Periodically Rotate Keys** → regenerate Cloudflare API tokens
3. **Monitor Usage** → check R2 dashboard untuk anomali storage/bandwidth
4. **Validate Input** → server sudah validate file type & MIME
5. **Rate Limiting** (Optional) → tambahkan library `express-rate-limit` jika perlu

## 📦 Deployment

### Deploy ke Vercel (Free)

```bash
npm i -g vercel
vercel --prod
```

### Deploy ke Heroku

```bash
heroku create jurnal-upload-api
heroku config:set CLOUDFLARE_ACCOUNT_ID=xxx
# ... set semua env variables
git push heroku main
```

### Deploy ke Personal Server

```bash
# Copy file ke server
scp -r backend/ user@server.com:/app/upload-api

# SSH ke server & jalankan
ssh user@server.com
cd /app/upload-api
npm install
npm start
```

Gunakan **PM2** untuk keep alive:

```bash
npm install -g pm2
pm2 start server.js --name "upload-api"
pm2 startup
pm2 save
```

## 📝 Environment Variables Reference

| Variable | Type | Required | Default | Keterangan |
|----------|------|----------|---------|------------|
| `CLOUDFLARE_ACCOUNT_ID` | string | ✅ | - | Account ID dari Cloudflare |
| `CLOUDFLARE_ACCESS_KEY_ID` | string | ✅ | - | Access Key untuk R2 API |
| `CLOUDFLARE_SECRET_ACCESS_KEY` | string | ✅ | - | Secret Key untuk R2 API |
| `CLOUDFLARE_BUCKET_NAME` | string | ✅ | - | Nama bucket R2 |
| `CLOUDFLARE_PUBLIC_URL` | string | ✅ | - | Base URL publik untuk file |
| `PORT` | number | ❌ | 3001 | Port server |
| `NODE_ENV` | string | ❌ | development | Environment (development/production) |
| `CORS_ORIGIN` | string | ❌ | http://localhost:5173 | Allowed CORS origins (comma-separated) |

## 📚 Referensi Teknis

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [Express.js Guide](https://expressjs.com/)
- [Presigned URLs - AWS S3 Docs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

## 💬 Support

Jika ada pertanyaan atau issue:
1. Cek console server untuk error messages
2. Cek dashboard Cloudflare R2 untuk status bucket & API quota
3. Review file `.env` untuk konfigurasi yang salah

## 📄 License

MIT
