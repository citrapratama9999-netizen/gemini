# RuangKepala — Administrasi Kepala Madrasah

Aplikasi memiliki dua antarmuka. `administrasi.html` adalah demo lokal lama. Untuk penyimpanan terpusat nyata, gunakan aplikasi server baru melalui `http://localhost:3000`; aplikasi tersebut memakai API Node.js dan database SQLite di server.

## Menjalankan versi server/database

Persyaratan: Node.js 20+ dan npm.

1. Salin `.env.example` menjadi `.env`.
2. Ganti `SESSION_SECRET` dengan nilai acak minimal 32 karakter dan tetapkan `ADMIN_USERNAME` serta `ADMIN_PASSWORD` unik (minimal 12 karakter). Jangan commit file `.env`.
3. Instal dependensi: `npm install`.
4. Jalankan server: `npm start`.
5. Buka `http://localhost:3000` dan masuk menggunakan akun yang Anda set di `.env`.

Database otomatis dibuat di `data/ruangkepala.sqlite`; sesi server juga disimpan persisten di direktori data. Akun administrator awal hanya dibuat saat pertama kali username tersebut belum ada. Mengubah variabel password setelah akun dibuat tidak mengganti password di database.

## Modul dan API

Server menyediakan CRUD terautentikasi untuk agenda, persuratan, GTK, program kerja, supervisi, sarana-prasarana, dan tugas. Endpoint utama: `GET/POST /api/data/:collection`, `PUT/DELETE /api/data/:collection/:id`. Frontend `server/public/` membaca dan mengubah data melalui API; perubahan tersimpan di database server dan bukan localStorage browser.

## Keamanan dan penerapan

- Login server memverifikasi hash bcrypt; sesi disimpan dalam cookie HttpOnly, SameSite Strict dan sesi server di SQLite.
- Endpoint perubahan dilindungi token CSRF; percobaan login dibatasi; payload dan koleksi API divalidasi.
- Untuk produksi, wajib gunakan HTTPS, set `NODE_ENV=production`, rahasiakan `.env`, batasi akses jaringan, lindungi/backup direktori `data/`, serta gunakan pengelolaan akun dan pemulihan password yang aman.
- Ini merupakan starter satu administrator; belum mencakup multi-role, pemulihan akun, log audit, atau backup otomatis. Uji serta tinjau keamanan sebelum memasukkan data pribadi/kepegawaian resmi.
- Database lokal pada satu server bukan layanan cloud terkelola. Hosting dan penyiapan server perlu dilakukan oleh operator Anda.

## Demo lama

`index.html` dan `administrasi-gtk.html` adalah demonstrasi berbasis localStorage. Login demo di `administrasi.html` juga bukan autentikasi server yang aman. Jangan menggunakannya untuk data sensitif.
