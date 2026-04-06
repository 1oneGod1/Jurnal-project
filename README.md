# Jurnal Proyek Arduino (Standalone)

Aplikasi ini adalah platform resmi e-logbook pembelajaran berbasis Single Page Application (SPA) yang berjalan mandiri di browser untuk mendokumentasikan proyek Arduino secara real-time, terstruktur, dan kolaboratif.

## Stack

- React + Vite
- Tailwind CSS v4
- Firebase Realtime Database (real-time data)
- Lucide React (ikon)
- React Syntax Highlighter (highlight kode Arduino/C++)

## Fitur Utama

- Dashboard proyek kelas dalam bentuk kartu
- Detail proyek dengan timeline log progres (terbaru ke terlama)
- Modal tambah proyek
- Modal tambah log harian
- Tersedia kolom upload dokumentasi via Presigned URL Cloudflare R2
- Sinkronisasi data real-time antardevice melalui Firebase Realtime Database

## Struktur Data Firebase

Data disimpan pada node utama projects dengan struktur tree seperti berikut:

{
	"projects": {
		"<projectId>": {
			"title": "Tempat Sampah Pintar",
			"group": "Kelas 11 IPA 1 - Kelompok 1",
			"description": "Membuat tempat sampah otomatis",
			"components": "Arduino Uno, Sensor Ultrasonik",
			"createdAt": "2026-04-06",
			"status": "In Progress",
			"updates": {
				"<updateId>": {
					"date": "2026-04-06",
					"title": "Pertemuan 1",
					"objective": "Merangkai komponen",
					"description": "Pin berhasil terhubung",
					"documentation": "https://pub-xxxxx.r2.dev/foto.jpg",
					"challenges": "Kabel jumper kurang",
					"nextTarget": "Tulis kode",
					"code": "void setup() {}"
				}
			}
		}
	}
}

## Setup Lokal

1. Install dependency.

	 npm install

2. Salin file environment.

	 File .env sudah disiapkan sesuai project Firebase jurnal-project-665c6.
	 Jika perlu, Anda tetap bisa menyesuaikan nilainya.

3. Jalankan aplikasi.

	 npm run dev

4. Build production.

	 npm run build

## Konfigurasi Environment

Variabel yang wajib diisi pada file .env:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_DATABASE_URL
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID

Opsional untuk upload file R2:

- VITE_UPLOAD_API_ENDPOINT

## Alur Upload Cloudflare R2 (Presigned URL)

Frontend tidak pernah memegang secret key R2. Aplikasi melakukan:

1. Request POST ke endpoint VITE_UPLOAD_API_ENDPOINT untuk meminta uploadUrl dan publicUrl.
2. Upload file langsung ke R2 via PUT ke uploadUrl.
3. Simpan publicUrl ke field dokumentasi log harian.

Contoh payload request dari frontend:

{
	"filename": "foto-arduino.jpg",
	"contentType": "image/jpeg",
	"projectId": "-Oa1b2..."
}

Contoh response yang diharapkan dari backend:

{
	"uploadUrl": "https://...presigned-url...",
	"publicUrl": "https://pub-xxxxx.r2.dev/foto-arduino.jpg"
}

## Deploy ke Firebase Hosting

Project Firebase default sudah dipasang ke jurnal-project-665c6 melalui file .firebaserc.

Langkah deploy:

1. Login ke Firebase CLI.

	 npx firebase login

2. Deploy hosting.

	 npm run deploy

Konfigurasi SPA rewrite sudah disediakan di firebase.json, jadi route React tetap bisa dibuka langsung tanpa 404.
