# RuangKepala — Administrasi Kepala Madrasah

Aplikasi administrasi web berbahasa Indonesia untuk mengelola kegiatan madrasah. Aplikasi dapat dijalankan secara lokal tanpa dependensi eksternal.

## Mulai

Buka `administrasi.html` di browser modern. Ini adalah aplikasi lengkap yang disarankan untuk digunakan. `index.html` dan `administrasi-gtk.html` merupakan versi demo/awal.

## Modul

- Dashboard dengan ringkasan agenda, surat, program, GTK, inventaris, dan tugas.
- Agenda dan rapat: tambah, cari, ubah, dan hapus.
- Persuratan: catat surat masuk/keluar, status, asal/tujuan, cari, ubah, dan hapus.
- Data GTK: direktori nama, NIP/NIK, jabatan, status, dan kontak, termasuk CRUD.
- Program kerja: target, bidang, tanggal, realisasi, anggaran, status, dan catatan.
- Supervisi: penjadwalan, status, hasil, dan tindak lanjut.
- Sarana dan prasarana: inventaris jumlah, kategori, kondisi, lokasi, dan catatan.
- Daftar tugas kepala madrasah dengan tenggat dan checklist.
- Pencarian per modul, ekspor CSV, cetak laporan, dan ekspor/impor cadangan JSON.
- Tampilan responsif untuk ponsel dan desktop.

## Penyimpanan dan keamanan

Data disimpan dalam `localStorage` browser pada perangkat yang sedang digunakan. Data tidak disinkronkan antarperangkat dan akan hilang jika penyimpanan browser dibersihkan; unduh cadangan JSON secara berkala. Jangan memasukkan data pribadi sensitif ke demo ini.

Aplikasi ini **belum memiliki autentikasi atau basis data server**. Login yang hanya dibuat di HTML/JavaScript tidak aman untuk melindungi data. Untuk penggunaan resmi multi-pengguna, diperlukan backend dengan autentikasi, kontrol akses, basis data, HTTPS, dan pencadangan terkelola. Data contoh harus diganti dengan data resmi yang telah diverifikasi.
