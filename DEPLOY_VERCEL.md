# 🚀 Deploy Backend ke Vercel

**Frontend sudah live di:** https://jurnal-project-665c6.web.app

Sekarang deploy backend API ke Vercel (gratis, auto-scaling).

## 📋 Prasyarat

- Akun [Vercel](https://vercel.com) (login dengan GitHub recommended)
- Cloudflare R2 credentials (sudah ada dari setup sebelumnya)

## 🎯 Step-by-Step Deploy

### Step 1: Push Code ke GitHub

```bash
# Di folder root repo
git init
git add .
git commit -m "Add backend API for Vercel deployment"
git remote add origin https://github.com/USERNAME/jurnal-proyek-arduino.git
git branch -M main
git push -u origin main
```

> Ganti `USERNAME` dengan username GitHub Anda

### Step 2: Login ke Vercel

1. Buka https://vercel.com
2. Klik **Sign Up** (atau **Sign In** jika sudah punya akun)
3. Pilih **Continue with GitHub**
4. Authorize Vercel untuk akses repo GitHub Anda

### Step 3: Import Project

1. Di Vercel dashboard, klik **Add New...** → **Project**
2. Pilih repo `jurnal-proyek-arduino`
3. Konfigurasi:
   - **Framework**: None (NodeJS)
   - **Root Directory**: `backend`
   - Klik **Continue**

### Step 4: Tambah Environment Variables

Di halaman "Configure Project", scroll ke **Environment Variables**

Tambahkan 5 variable ini dengan nilai dari Cloudflare Anda:

| Variable | Value |
|----------|-------|
| `CLOUDFLARE_ACCOUNT_ID` | Dari Cloudflare R2 Settings |
| `CLOUDFLARE_ACCESS_KEY_ID` | Dari Cloudflare API Token |
| `CLOUDFLARE_SECRET_ACCESS_KEY` | Dari Cloudflare API Token |
| `CLOUDFLARE_BUCKET_NAME` | `jurnal-proyek-dokumentasi` |
| `CLOUDFLARE_PUBLIC_URL` | `https://r2.yourcdn.com` atau custom domain |
| `CORS_ORIGIN` | `https://jurnal-project-665c6.web.app` |

Klik **Deploy**

### Step 5: Tunggu Deploy Selesai

Vercel akan:
- Build project (`npm install`)
- Deploy serverless functions
- Generate URL: `https://your-project-name.vercel.app`

Deploy biasanya selesai dalam 1-2 menit ✅

### Step 6: Update Frontend Env

Setelah backend deploy berhasil:

1. Edit file `.env.production` di root folder
2. Update `VITE_UPLOAD_API_ENDPOINT`:

```env
VITE_UPLOAD_API_ENDPOINT=https://your-project-name.vercel.app/api/generate-upload-url
```

3. Push ke GitHub:
```bash
git add .env.production
git commit -m "Update backend API endpoint"
git push
```

4. Firebase akan auto-redeploy frontend dengan env baru

### Step 7: Test Upload

1. Buka https://jurnal-project-665c6.web.app
2. Buat proyek → Tambah log → Upload berkas
3. Tunggu upload selesai ✨

---

## ✅ URL Production

| Service | URL |
|---------|-----|
| **Frontend** | https://jurnal-project-665c6.web.app |
| **Database** | Firebase Realtime DB (terintegrasi) |
| **Backend API** | `https://your-project-name.vercel.app/api/generate-upload-url` |
| **File Storage** | Cloudflare R2 |

---

## 🔍 Troubleshooting

### Deployment Gagal

- Cek logs di Vercel dashboard
- Pastikan `backend/` folder punya `package.json`
- Vercel butuh `build` script di package.json

### CORS Error

Update `CORS_ORIGIN` di Vercel environment variables:

```
https://jurnal-project-665c6.web.app
```

### Upload API tidak bisa upload file

- Cek `CLOUDFLARE_ACCOUNT_ID`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY` di Vercel env
- Cek R2 bucket name sesuai
- Cek CORS setting di R2 bucket (jika diperlukan)

### Environment Variable tidak terbaca

- Redeploy di Vercel setelah update env var
- Tunggu 1 menit, lalu test lagi

---

## 📊 Status Deployment

- ✅ Frontend: **LIVE** di Firebase Hosting
- 🔄 Backend: Deploy ke Vercel (ikuti step di atas)
- ✅ Database: Firebase Realtime DB
- ✅ File Storage: Cloudflare R2

---

## 💡 Tips

### Monitoring

- **Frontend logs**: Firebase Console
- **Backend logs**: Vercel Logs tab
- **API requests**: Vercel Analytics

### Custom Domain (Opsional)

1. Vercel → Project Settings → Domains
2. Tambah domain custom Anda
3. Follow DNS setup instructions

### Rollback Deployment

Di Vercel dashboard, bisa langsung switch ke deployment versi lama jika ada issue.

---

**Deploy selesai! Aplikasi sudah production-ready.** 🎉
