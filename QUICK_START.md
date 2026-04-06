# 🚀 Quick Start - Lengkapi Upload Dokumentasi

Panduan cepat untuk membuat fitur upload dokumentasi berfungsi. Estimasi waktu: **15-20 menit**.

## ✅ Checklist Rapi

- [ ] Dapatkan Cloudflare R2 bucket
- [ ] Generate Cloudflare API Token
- [ ] Setup backend server
- [ ] Konfigurasi .env frontend
- [ ] Test upload dokumentasi

---

## 1️⃣ Setup Cloudflare R2 (5 menit)

### Buat Bucket

1. Login ke [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Tab **R2** → **Create Bucket**
3. Nama: `jurnal-proyek-dokumentasi`
4. Region: **apac** (Singapore)
5. Klik **Create Bucket**

### Generate API Token

1. Profil Anda → **API Tokens**
2. **Create Token** → gunakan template **Edit Cloudflare R2**
3. Copy **Access Key ID** dan **Secret Access Key**
4. Di tab Settings bucket → copy **Account ID**

**Simpan 3 nilai penting ini:**
- Account ID
- Access Key ID  
- Secret Access Key

---

## 2️⃣ Setup Backend (10 menit)

### Copy Template & Install

```bash
cd backend
cp .env.example .env
npm install
```

### Isi File `.env` Backend

Buka `backend/.env` dan isi dengan nilai dari Cloudflare:

```env
CLOUDFLARE_ACCOUNT_ID=123456789abcdef
CLOUDFLARE_ACCESS_KEY_ID=1234567890abcdef
CLOUDFLARE_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxx
CLOUDFLARE_BUCKET_NAME=jurnal-proyek-dokumentasi
CLOUDFLARE_PUBLIC_URL=https://jurnal-docs.pages.dev
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

> **Catatan:** Jika tidak punya custom domain, gunakan **Cloudflare Pages** atau biarkan cloudflare bucket URL.

### Jalankan Backend

```bash
npm run dev
```

Tunggu sampai muncul:
```
✅ Upload API server started on port 3001
📍 Endpoint: http://localhost:3001/generate-upload-url
```

---

## 3️⃣ Setup Frontend (5 menit)

### Update `.env` Frontend

Edit file `.env` di root folder (`h:\Jurnal\jurnal-proyek-arduino\.env`):

Ubah baris ini:

```env
VITE_UPLOAD_API_ENDPOINT=http://localhost:3001/generate-upload-url
```

> Untuk production, ganti dengan domain backend yang sebenarnya

### Restart Dev Server Frontend

```bash
# Di terminal lain, di folder root
npm run dev
```

---

## 4️⃣ Test Upload ✨

1. Buka browser → `http://localhost:5173`
2. Buat proyek baru
3. Tambah log harian
4. **Klik tombol "Upload Berkas"**
5. Pilih gambar/video/PDF
6. Tunggu upload selesai ✅

---

## 📋 File yang Diubah/Ditambah

✅ `src/App.jsx` - Perbaiki responsive dokumentasi preview
✅ `backend/server.js` - API server baru
✅ `backend/package.json` - Dependencies
✅ `backend/.env.example` - Template config
✅ `backend/README.md` - Dokumentasi lengkap
✅ `UPLOAD_SETUP.md` - Panduan detail
✅ `.env` - Endpoint sudah bisa diisi

---

## 🆘 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Backend error saat startup | Cek `.env` backend, pastikan semua value terisi |
| Upload button tidak berfungsi | Restart frontend dev server setelah ubah `.env` |
| File gagal upload | Cek CORS setting di `CORS_ORIGIN` |
| Presigned URL expired | Normal (expired dalam 1 jam), upload ulang |
| "Set VITE_UPLOAD_API_ENDPOINT" error | Isi env di frontend `.env` + restart server |

---

## 📁 Struktur Akhir

```
jurnal-proyek-arduino/
├── src/
│   ├── App.jsx ✨ (sudah diupdate: responsive docs)
│   └── ...
├── backend/ ✨ (folder baru)
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── .env ✅ (VITE_UPLOAD_API_ENDPOINT harus diisi)
├── UPLOAD_SETUP.md 📚 (dokumentasi detail)
├── QUICK_START.md 👈 (file ini)
└── ...
```

---

## 🎯 Hasil yang Diharapkan

Setelah semua setup selesai:

✅ Tombol "Upload Berkas" dapat diklik
✅ Bisa upload foto/video/PDF  
✅ Preview dokumentasi responsive di semua ukuran layar
✅ File tersimpan aman di Cloudflare R2
✅ Guru dan siswa bisa download dokumentasi

---

## 📚 Referensi Lengkap

Untuk setup lebih detail atau custom:
- Baca [UPLOAD_SETUP.md](./UPLOAD_SETUP.md) di repo
- Baca [backend/README.md](./backend/README.md) untuk konfigurasi lanjutan
- Dokumentasi Cloudflare: https://developers.cloudflare.com/r2/

---

## 💡 Tips

- **Testing tanpa Cloudflare?** Gunakan mock API untuk development
- **Ingin custom domain?** Setup Cloudflare Pages atau domain pribadi
- **Production deployment?** Lihat bagian "Deployment" di backend/README.md
- **Auto-delete file lama?** Setup R2 Lifecycle Rules di Cloudflare dashboard

---

**Selesai! 🎉 Dokumentasi upload sudah berfungsi dan responsif di semua ukuran layar.**

Pertanyaan? Lihat file dokumentasi yang sudah dibuat di repo atau cek console untuk error details.
