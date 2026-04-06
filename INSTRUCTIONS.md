# ⚡ DEPLOYMENT RINGKAS - Copy-Paste Commands

## ✅ Apa Sudah Jadi

```
✅ Frontend: https://jurnal-project-665c6.web.app (LIVE!)
✅ Database: Firebase Realtime DB (Connected)
✅ Responsive doc preview: FIXED!
✅ Backend code: Ready untuk Vercel
```

## 🔄 Yang Tinggal: Backend ke Vercel (5 Menit)

### 1️⃣ Push Code ke GitHub

```bash
cd h:\Jurnal\jurnal-proyek-arduino
git config --global user.email "your@email.com"
git config --global user.name "Your Name"
git init
git add .
git commit -m "Add jurnal backend & frontend production"
git remote add origin https://github.com/YOUR_USERNAME/jurnal-proyek-arduino.git
git branch -M main
git push -u origin main
```

**Catatan:** 
- Ganti `YOUR_USERNAME` dengan username GitHub Anda
- Sudah punya repo? `git push origin main` saja

---

### 2️⃣ Login & Import ke Vercel

1. Buka https://vercel.com
2. Click **Sign In** → **Continue with GitHub**
3. Authorize Vercel
4. Click **Add New** → **Project**
5. Pilih `jurnal-proyek-arduino`
6. **Root Directory:** ubah ke `backend`
7. Click **Continue**

---

### 3️⃣ Setup Environment Variables (Copas dari Cloudflare)

Di halaman "Configure Project" di Vercel, add 6 variables ini:

| Field | Value | Sumber |
|-------|-------|--------|
| Name: `CLOUDFLARE_ACCOUNT_ID` | `123456...` | R2 Settings → Account ID |
| Name: `CLOUDFLARE_ACCESS_KEY_ID` | `abc123...` | API Tokens → R2 Token → Access Key |
| Name: `CLOUDFLARE_SECRET_ACCESS_KEY` | `xyz789...` | API Tokens → R2 Token → Secret |
| Name: `CLOUDFLARE_BUCKET_NAME` | `jurnal-proyek-dokumentasi` | R2 bucket name |
| Name: `CLOUDFLARE_PUBLIC_URL` | `https://r2-public-url.com` | R2 bucket public URL |
| Name: `CORS_ORIGIN` | `https://jurnal-project-665c6.web.app` | Firebase URL |

Click **Deploy**

---

### 4️⃣ Tunggu Deploy Selesai ⏳

Vercel akan:
- Build code
- Deploy serverless functions
- Generate URL (contoh: `https://jurnal-backend.vercel.app`)

**Copy URL Vercel Anda!** ← Penting untuk step berikutnya

---

### 5️⃣ Update Frontend .env

Edit file: `h:\Jurnal\jurnal-proyek-arduino\.env.production`

Ubah baris ini:
```env
# Ganti URL_INI dengan URL Vercel Anda dari step 4
VITE_UPLOAD_API_ENDPOINT=https://jurnal-backend.vercel.app/api/generate-upload-url
```

Contoh URL Vercel:
- `https://jurnal-backend-andi.vercel.app`
- `https://my-upload-api.vercel.app`
- dll

Ganti dengan **URL Vercel Anda langsung!**

---

### 6️⃣ Push Update

```bash
cd h:\Jurnal\jurnal-proyek-arduino
git add .env.production
git commit -m "Update backend API endpoint untuk production"
git push origin main
```

Firebase akan **auto-redeploy** frontend (tunggu 1-2 menit)

---

### 7️⃣ TEST ✨

1. Buka: https://jurnal-project-665c6.web.app
2. **Buat Proyek** → **Tambah Log** → **Pilih Upload Berkas**
3. Upload foto/video/PDF
4. Lihat apakah preview muncul

---

## 🎉 Hasil Final

```
https://jurnal-project-665c6.web.app
│
├─ Frontend: ✅ LIVE (Firebase Hosting)
├─ Database: ✅ Firebase Realtime DB
├─ File Storage: ✅ Cloudflare R2
└─ Backend API: ✅ https://jurnal-backend.vercel.app
```

---

## 🆘 Kalau Ada Masalah

### "Error CORS" saat upload

→ Cek `CORS_ORIGIN` di Vercel environment variables

### "Backend URL tidak bekerja"

→ Copas URL dari Vercel dashboard sesuai Step 4

### "Environment variables not found"

→ Redeploy di Vercel setelah update env vars

### Upload API timeout

→ Cek Cloudflare credentials di `.env` backend

---

## 📋 File-File Penting

```
jurnal-proyek-arduino/
├── backend/
│   ├── api/generate-upload-url.js  ← Vercel serverless function
│   ├── package.json  ← Updated
│   ├── vercel.json   ← Config
│   └── .env.example
├── .env.production   ← Update dengan backend URL
├── DEPLOY_VERCEL.md  ← Detail lengkap
└── DEPLOYMENT_STATUS.md  ← Status saat ini
```

---

**Total waktu: 5-10 menit** ⏱️

**Setelah selesai: Upload dokumentasi 100% berfungsi di production!** 🚀
