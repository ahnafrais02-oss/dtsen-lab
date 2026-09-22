# DTSEN Lab

## Tujuan dan ruang lingkup Revisi 2
Simulator edukasi berbahasa Indonesia untuk memahami perubahan kondisi, indeks, ranking, dan desil relatif. Semua assignment sintetis; indeks ini bukan formula resmi DTSEN dan tidak digunakan untuk penetapan bantuan.

Revisi 2 mengganti populasi menjadi **50 assignment**, masing-masing desil tepat **5 assignment**. Rincian atribut di panel simulasi dan bagian formula di halaman dihapus sesuai gambar referensi. Tabel detail dibuka melalui password lokal. Papan dibuat ringkas dan misi 4 memperlihatkan assignment lain bergerak sementara ranking fokus tetap.

## Teknologi dan struktur
HTML5, CSS3, JavaScript ES6+ tanpa framework, backend, dependensi eksternal, atau build aplikasi. Script klasik `defer` memakai namespace `window.DTSEN` agar halaman juga bekerja melalui file lokal.

| File | Tanggung jawab |
|---|---|
| `index.html` | Beranda, misi, papan, hasil, dialog password dan tabel |
| `css/style.css` | Layout responsif dan papan ringkas |
| `css/animations.css` | Animasi dasar dan reduced motion |
| `data/assignments.js` | Generator deterministik A001–A050 |
| `js/data.js` | Konfigurasi, label, validator atribut, rentang desil |
| `js/ranking.js` | Indeks, tie-break, ranking, desil |
| `js/simulation.js` | Before/after, validasi hasil, pencarian perubahan tiap misi |
| `js/ui.js` | Papan, ringkasan, hasil dan kolom tabel |
| `js/game.js` | Alur, animasi perpindahan, password, penguncian ulang |
| `js/app.js` | Validasi awal dan entry point |
| `tests/engine.test.js`, `tests/index.html` | Pengujian mesin |
| `tests/ui.test.js`, `tests/ui.html` | Pengujian browser asli dan preview ukuran layar |
| `tests/check_static.py` | Pemeriksaan path, aset, urutan script, dan target DOM |
| `.github/workflows/pages.yml`, `.nojekyll` | Konfigurasi hosting statis yang sudah disiapkan |

## Data Revisi 2
Tiga atribut berikut adalah level/peringkat kondisi sintetis bilangan bulat **1–10**, semakin besar semakin tinggi kondisi kesejahteraan simulasi. Atribut lama dihapus dari model, bukan hanya disembunyikan di tabel.

- `basicNeeds`: Kondisi Perumahan dan Pemenuhan Kebutuhan Dasar.
- `assets`: Kepemilikan Aset.
- `expenditure`: Pengeluaran dan/atau Pendapatan.

Tidak ada nominal rupiah, jumlah anggota, maupun atribut rumah/listrik/pendidikan terpisah. Data memakai seed tetap `20260922`, tanpa `Math.random`. Profil atribut awal dibuat unik.

## Indeks, ranking, desil
Bobot simulasi di `SIMULATION_CONFIG.weights`: basicNeeds 0,40; assets 0,25; expenditure 0,35. `calculateWelfareScore` menghitung rata-rata berbobot pada skala 1–10. Presisi dibulatkan enam desimal untuk menghilangkan noise floating point; UI menampilkan hingga dua desimal. Formula didokumentasikan untuk pengembang, tidak ditampilkan lagi di halaman.

Ranking tetap **1–50**, bukan skala atribut: ranking 1 adalah indeks tertinggi. Aturan nilai sama: indeks menurun, lalu expenditure menurun, lalu ID menaik. `calculateRanking` menghitung ulang seluruh populasi dan menghasilkan salinan baru.

`calculateDecile(rank) = 10 - floor((rank - 1) / 5)`:

| Ranking | Desil |
|---|---|
| 1–5 | 10 |
| 6–10 | 9 |
| 11–15 | 8 |
| 16–20 | 7 |
| 21–25 | 6 |
| 26–30 | 5 |
| 31–35 | 4 |
| 36–40 | 3 |
| 41–45 | 2 |
| 46–50 | 1 |

Semua desil berisi tepat lima anggota. Indeks/atribut lebih tinggi tidak berarti angka ranking membesar: posisi membaik berarti angka ranking mengecil. Papan menampilkan D1 → D10 dan urutan dalam setiap desil dari ranking terbesar ke terkecil, sesuai arah rendah → tinggi.

## Mesin simulasi
`simulateChanges(baseAssignments, changes, highlightedAssignment)` menerima perubahan atribut, menghitung ulang indeks seluruh 50 assignment, mengurutkan ranking dan menentukan desil. Tidak memutasi data awal. Output memuat `before`, `after`, `comparisons`, `changedAssignments`, `rankingChanges`, `decileChanges`, dan `highlightedAssignment`.

Setiap perbandingan menyimpan old/new score, rank, decile, `dataChanged`, `rankDelta = oldRank - newRank`, `decileDelta = newDecile - oldDecile`. Rank delta positif berarti posisi membaik. Assignment lain yang datanya tetap juga tercatat jika ranking/desilnya berubah.

Validasi selalu aktif: populasi tepat 50, ID unik dan tetap, tiga atribut integer 1–10, indeks sesuai data, ranking 1–50, urutan tie-break, pemetaan desil, serta lima anggota/desil. Input invalid melempar error yang jelas.

## Misi dan tiga pilihan kondisi
Meningkat/menurun/tetap berlaku pada **indeks fokus**, bukan otomatis seluruh populasi. Setiap misi mulai dari dataset awal yang sama. Fokus dipilih oleh engine agar syarat misi dapat dipenuhi. Hasil tidak ditanamkan secara manual ke UI.

- Misi 1: cari perubahan satu atribut yang menggeser ranking dalam desil yang sama.
- Misi 2: cari perubahan satu atribut yang melewati batas desil; assignment lain ikut mengisi posisi.
- Misi 3: ubah sedikitnya lima data dan amati fokus dalam konteks populasi. Jika kondisi fokus tetap, data lain tetap dapat menggeser ranking/desilnya.
- Misi 4: cari perubahan indeks fokus yang mempertahankan ranking; kemudian rotasikan lima profil berbeda yang semuanya berada di atas fokus. Kelimanya bertukar ranking, tetapi jumlah assignment di atas fokus tetap. Pada pilihan tetap, hanya lima profil lain yang berubah.
- Pilihan tetap pada misi 1–2 menjadi kondisi pembanding tanpa perubahan data.

Hasil data bawaan:

| Misi | Kondisi | Fokus | Ranking | Desil | Ranking bergeser |
|---|---|---|---|---|---|
| 1 | Naik | A007 | 28 → 26 | 5 → 5 | 3 |
| 1 | Turun | A007 | 28 → 30 | 5 → 5 | 3 |
| 1 | Tetap | A007 | 28 → 28 | 5 → 5 | 0 |
| 2 | Naik | A007 | 28 → 23 | 5 → 6 | 6 |
| 2 | Turun | A007 | 28 → 31 | 5 → 4 | 4 |
| 2 | Tetap | A007 | 28 → 28 | 5 → 5 | 0 |
| 3 | Naik | A007 | 28 → 18 | 5 → 7 | 35 |
| 3 | Turun | A007 | 28 → 39 | 5 → 3 | 29 |
| 3 | Tetap | A007 | 28 → 31 | 5 → 4 | 43 |
| 4 | Naik | A038 | 29 → 29 | 5 → 5 | 5 |
| 4 | Turun | A007 | 28 → 28 | 5 → 5 | 5 |
| 4 | Tetap | A007 | 28 → 28 | 5 → 5 | 5 |

Cache skenario memakai dataset serta konfigurasi sebagai kunci dan selalu mengembalikan salinan agar perubahan dari pemanggil tidak merusak hasil berikutnya.

## Papan, animasi, aksesibilitas
Desktop/tablet memakai lima kolom × dua baris desil, masing-masing lima assignment, tanpa area gulir internal. Pada ponsel, dua kolom menjaga label tetap terbaca. Tombol Perbesar papan menampilkan seluruh populasi dalam ruang lebih besar. Fokus ditandai bintang, garis tebal, dan pelacak ranking/desil sebelum–sesudah.

Animasi FLIP menghitung koordinat baris sebelum/sesudah, lalu memindahkannya bersama perubahan urutan. Fokus mendapat durasi lebih panjang dan penekanan; pada misi 4 fokus berdenyut di tempat sementara baris lain bergerak. Hasil tersedia di bawah papan tanpa otomatis melompat meninggalkan gerakan. Reduced motion menghilangkan pergerakan. Tombol terkunci selama proses; pesan error terlihat jika simulasi gagal.

Kontrol native, label, focus ring, live status, dialog modal, pencarian ID, dan pengembalian fokus setelah dialog ditutup tersedia.

## Password tabel
Password mengikuti nilai pada dokumen Revisi 2, peka huruf besar/kecil. Aplikasi menyimpan digest SHA-256, tidak menyimpan password pengguna dan tidak mengirimnya ke server. Tabel tidak dirender sebelum verifikasi sukses. Menutup tabel menghapus isinya dari DOM dan mengunci ulang; pembukaan berikutnya meminta password lagi.

Ini **pembatas tampilan lokal**, bukan autentikasi server atau enkripsi dataset. Seluruh data sintetis dan JavaScript tetap dapat diperiksa di browser. Jangan gunakan pola ini untuk data rahasia. Web Crypto membutuhkan browser modern dengan konteks aman (HTTPS, localhost, atau file lokal yang didukung).

## Menjalankan dan menguji
Buka `index.html` langsung atau melalui Live Server. `?debug=1` menampilkan ringkasan validasi startup. Buka `tests/index.html` untuk 295 pemeriksaan mesin. Buka `tests/ui.html` melalui server lokal untuk pemeriksaan browser, termasuk password salah/benar dan penguncian ulang. `python3 tests/check_static.py` adalah alat pengembangan saja.

## Pengembangan berikutnya
Untuk skenario baru, tambahkan logika `createScenario`, label/insight UI, alur jumlah misi, dan tes tujuan skenario. Jangan pernah mengubah ranking/desil langsung. Ubah dataset atau bobot hanya bersama pengujian ulang seluruh misi.

Untuk jumlah assignment lain, koordinasikan generator, `population`, `perDecile`, label UI, dan tes; populasi harus tetap sepuluh kali ukuran desil. Jangan menambahkan satu assignment tanpa menyesuaikan invariant populasi.

## Hosting
Konfigurasi Pages dari pekerjaan sebelumnya tetap tersedia dan semua aset memakai path relatif. Aplikasi tidak membutuhkan build. Revisi 2 ini berfokus pada aplikasi dan pengujian; publikasi GitHub tidak dilakukan dalam lingkup revisi ini.

## Hasil verifikasi Revisi 2
- 295 pemeriksaan mesin lulus untuk seluruh 12 variasi.
- 286 pemeriksaan UI lulus di Safari: alur simulasi, password salah/benar, penguncian ulang, tabel/pencarian, fokus keyboard, reset, dan viewport 320, 390, 768, 1280 piksel.
- Papan desktop/tablet memiliki tinggi kurang dari 480px dan tidak memakai gulir internal. Pemeriksaan visual desktop memperlihatkan seluruh 50 assignment dan fokus dalam satu frame papan.
- Tinggi baris tablet disesuaikan setelah pemeriksaan pertama menemukan papan terlalu tinggi.
- Audit aset statis dan `git diff --check` lulus. Tidak melakukan push/deployment dalam pekerjaan Revisi 2.
