# DTSEN Lab

Simulator edukasi ranking dan desil dengan 100 assignment sintetis. Empat misi interaktif menunjukkan bagaimana perubahan data memengaruhi posisi relatif dan batas desil.

**Indeks simulasi kesejahteraan bukan formula resmi DTSEN.** Tidak menggunakan data individu nyata.

## Cara menjalankan
1. Clone repository ini.
2. Buka folder `dtsen-lab`.
3. Buka `index.html` dengan browser modern, atau pilih **Open with Live Server** di editor.

Tidak perlu npm, build, server aplikasi, atau koneksi internet.

## Cara bermain dan menguji
Pilih **Mulai Simulasi**, pilih misi, pilih kesejahteraan meningkat, menurun, atau tetap, lalu tekan **Simulasikan**. Periksa perbandingan sebelum–sesudah dan pilih **Jelaskan**. Baris assignment dapat diklik; tabel lengkap tersedia lewat **Lihat semua 100 assignment**.

- Misi 1: ranking berubah, desil tetap.
- Misi 2: ranking dan desil berubah; assignment lain ikut bergeser.
- Misi 3: enam data berubah, fokus dilihat terhadap populasi.
- Misi 4: enam data berubah, ranking dan desil fokus tetap.

Ulangi dengan ketiga pilihan kondisi. **Ulangi dari awal** mengembalikan papan ke data awal; reload halaman menghapus progress misi.

Buka `tests/index.html` untuk 277 pemeriksaan mesin. Tambahkan `?debug=1` ke alamat aplikasi untuk mode debug. Definisi formula, struktur file, hasil delapan variasi, dan panduan pengembangan ada di [PROJECT.md](PROJECT.md).

## Pengujian UI
Buka `tests/ui.html` lewat Live Server, lalu tekan **Jalankan semua pemeriksaan UI**. Tes memeriksa 12 variasi misi, animasi, urutan 100 baris, pencarian tabel, fokus keyboard, reset, serta lebar 320, 390, 768, dan 1280 piksel. Halaman tes UI perlu HTTP lokal karena menggunakan iframe; aplikasi utama tetap bisa dibuka langsung sebagai file.

`python3 tests/check_static.py` memeriksa path relatif, urutan script, ID HTML, dan aset untuk deployment. Python hanya alat pemeriksaan, bukan runtime aplikasi.

## Deployment GitHub Pages
Repository: https://github.com/ahnafrais02-oss/dtsen-lab

1. Di repository GitHub, buka **Settings → Pages**.
2. Pilih **GitHub Actions** sebagai Source.
3. Push perubahan ke branch `main`, atau jalankan **Deploy DTSEN Lab** dari tab Actions.
4. Tunggu job deployment berhasil, lalu buka https://ahnafrais02-oss.github.io/dtsen-lab/ .

Workflow tersedia di `.github/workflows/pages.yml`, dengan pemeriksaan aset sebelum publikasi. Tidak perlu npm atau build. Artifact hanya berisi file aplikasi statis. Untuk hosting statis lain, unggah `index.html`, `.nojekyll`, dan folder `css`, `js`, `data`, `assets` dengan struktur yang sama.

Lihat [panduan resmi GitHub Pages](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically).
