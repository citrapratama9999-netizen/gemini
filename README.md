# RuangKepala — Administrasi Madrasah

Aplikasi web sederhana berbahasa Indonesia untuk membantu Kepala Madrasah mengelola administrasi dan memantau kegiatan harian.

## Menjalankan aplikasi

Buka `index.html` di browser modern. Aplikasi tidak memerlukan instalasi, server, atau dependensi eksternal.

## Fitur

- Dashboard ringkasan agenda, persuratan, program kerja, dan GTK.
- Agenda dan rapat: tambah, cari, dan hapus jadwal.
- Persuratan: catat surat masuk/keluar, cari, dan hapus.
- Ringkasan program kerja, supervisi, data GTK, sarana-prasarana, dan laporan.
- Checklist prioritas mingguan dan cetak laporan.
- Halaman `administrasi-gtk.html` untuk CRUD lengkap direktori GTK (tambah, ubah, hapus, cari, dan filter) serta ekspor CSV.
- Tampilan responsif untuk desktop dan ponsel.
- Agenda dan surat disimpan lokal di browser menggunakan `localStorage`.
- Data GTK pada halaman direktori disimpan lokal dengan kunci `rk-gtk-data` di browser.

## Catatan

Data pada aplikasi ini adalah contoh/demonstrasi. Penyimpanan `localStorage` hanya tersedia di browser/perangkat yang digunakan dan bukan pengganti basis data bersama atau pencadangan resmi. Ubah nama madrasah, identitas, tahun pelajaran, dan data contoh sebelum digunakan.
