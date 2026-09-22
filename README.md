# DTSEN Lab

Simulator edukasi ranking dan desil. **50 assignment sintetis, 10 desil, masing-masing 5 assignment.** Indeks simulasi kesejahteraan bukan formula resmi DTSEN.

## Menjalankan
Buka `index.html` langsung di browser modern atau melalui Live Server. Tidak perlu npm, build, backend, atau dependensi eksternal.

## Revisi 2
- Papan ringkas: seluruh desil terlihat bersama di desktop, dengan animasi perpindahan dan fokus ★.
- Tiga atribut berlevel 1–10: Kondisi Perumahan dan Pemenuhan Kebutuhan Dasar, Kepemilikan Aset, Pengeluaran dan/atau Pendapatan.
- Atribut lama dan penjelasan formula di halaman dihapus.
- Tabel detail meminta password dari dokumen revisi dan kembali terkunci setelah ditutup.
- Misi 4 menggeser lima assignment lain sementara ranking fokus tetap.

Password merupakan pembatas tampilan lokal untuk data sintetis, bukan perlindungan data rahasia. Aplikasi tidak mengirim password ke server.

## Mencoba
Pilih misi → pilih kesejahteraan meningkat, menurun, atau tetap → **Simulasikan**. Amati gerakan baris dan pelacak fokus. Pilih **Lihat penjelasan hasil** untuk before/after dan insight. **Perbesar papan** membantu presentasi; **Temukan fokus** membawa pengamatan kembali ke fokus.

## Pengujian
- Buka `tests/index.html`: 295 pemeriksaan mesin untuk 12 variasi, tie-break, 5 anggota/desil, immutability, dan input invalid.
- Buka `tests/ui.html` melalui Live Server, lalu **Jalankan semua pemeriksaan UI**: 286 pemeriksaan UI untuk alur, password, tabel, reset, keyboard, dan layout 320–1280 piksel.
- `python3 tests/check_static.py`: audit aset, path relatif, script, dan target DOM. Python hanya alat pemeriksaan.

Lihat [PROJECT.md](PROJECT.md) untuk definisi dan hasil skenario.

## Hosting statis
Konfigurasi `.github/workflows/pages.yml` dari tahap sebelumnya tetap tersedia. Untuk GitHub Pages, gunakan **Settings → Pages → Source: GitHub Actions**; push ke `main` memicu workflow. Untuk hosting lain, unggah `index.html`, `.nojekyll`, `css`, `js`, `data`, dan `assets` dengan struktur yang sama.

Fokus pekerjaan Revisi 2 adalah aplikasi dan pengujian; tidak melakukan push atau deployment baru.
