# DTSEN Lab

## Tujuan dan batasan
Website statis edukatif berbahasa Indonesia bagi masyarakat awam, dengan alur beranda → pilih misi → simulasi → hasil → insight. Assignment adalah unit data sintetis rumah tangga; bukan individu nyata. Simulator tidak menentukan kelayakan bantuan dan tidak mengimplementasikan formula resmi DTSEN. Seluruh angka adalah **indeks simulasi kesejahteraan**.

## Teknologi dan arsitektur
HTML5, CSS3, Vanilla JavaScript ES6+, tanpa backend, build, runtime Node.js, dependensi, CDN, atau permintaan jaringan. Script klasik `defer` dimuat berurutan dengan namespace `window.DTSEN`, supaya juga bekerja melalui `file://` (ES modules dapat diblokir di mode ini).

```text
dtsen-lab/
├── index.html             # Struktur halaman dan dialog tabel
├── README.md              # Panduan cepat
├── PROJECT.md             # Definisi dan panduan pengembangan
├── css/
│   ├── style.css          # Layout responsif, komponen, aksesibilitas
│   └── animations.css     # Transisi dan reduced motion
├── js/
│   ├── app.js             # Startup, validasi awal, debug
│   ├── data.js            # Konfigurasi, label, validasi input
│   ├── ranking.js         # Indeks, urutan ranking, pemetaan desil
│   ├── simulation.js      # Before/after, validasi hasil, empat skenario
│   ├── game.js            # State, event, alur misi, animasi pergeseran
│   └── ui.js              # Rendering papan, hasil, tabel, insight
├── data/
│   └── assignments.js     # Generator deterministik 100 assignment
├── assets/
│   └── README.md          # Kebijakan aset lokal
└── tests/
    ├── index.html         # Jalankan pengujian langsung di browser
    ├── engine.test.js     # 277 pemeriksaan mesin
    ├── ui.html            # Preview dan pengujian browser asli
    ├── ui.test.js         # Dua belas variasi, tabel, fokus, dan layout
    └── check_static.py    # Pemeriksaan kesiapan deployment
```

## Data dan formula simulasi
Generator LCG dengan seed tetap `20260922` menghasilkan A001–A100. Tidak memakai `Math.random`. Atribut: pendapatan rumah tangga bulanan (rupiah, >= 0), jumlah anggota (bilangan bulat >= 1), rumah, listrik, aset, pendidikan (level ordinal sintetis 1–5). Level 1 mewakili kondisi lebih rendah dan 5 lebih tinggi; bukan klasifikasi administratif.

Bobot berada di `DTSEN.SIMULATION_CONFIG` dalam `js/data.js`:

```text
indeks = 40 × (income / householdSize / 3.000.000)
       + 20 × (housing - 1) / 4
       + 10 × (electricity - 1) / 4
       + 20 × (asset - 1) / 4
       + 10 × (education - 1) / 4
```

Pendapatan per anggota membantu menggambarkan pembagian sumber daya dalam rumah tangga. Indeks tidak dibatasi 100, bukan probabilitas/persentase, dan bukan rumus resmi DTSEN. `calculateWelfareScore(assignment)` mempertahankan presisi penuh; UI menampilkan hingga empat desimal. Bobot serta referensi pendapatan mudah diubah, tetapi uji ulang semua misi setelah perubahan.

## Ranking, desil, dan nilai sama
`calculateRanking(assignments)` membuat salinan data, menghitung indeks seluruh populasi, dan mengurutkan:

1. Indeks tertinggi lebih dahulu.
2. Jika indeks sama persis: pendapatan rumah tangga tertinggi lebih dahulu.
3. Jika masih sama: ID ascending.

Ranking 1 = kesejahteraan tertinggi, ranking 100 = terendah. Tidak menggunakan ranking bersama untuk nilai sama. `calculateDecile(rank) = 10 - floor((rank - 1) / 10)`.

| Ranking | Desil |
|---|---|
| 1–10 | 10 |
| 11–20 | 9 |
| 21–30 | 8 |
| 31–40 | 7 |
| 41–50 | 6 |
| 51–60 | 5 |
| 61–70 | 4 |
| 71–80 | 3 |
| 81–90 | 2 |
| 91–100 | 1 |

Masing-masing desil selalu berisi tepat 10 assignment. Tidak ada penetapan label desil secara manual.

## Mesin before/after
`simulateChanges(baseAssignments, changes, highlightedAssignment)` menerima perubahan berbentuk `{ id, attributes: { income: ... } }`. Tidak memutasi data asal. Output:

- `before`, `after`: seluruh populasi yang telah dihitung dan diurutkan.
- `comparisons`: seluruh 100 perbandingan.
- `changedAssignments`: hanya atribut yang benar-benar berubah.
- `rankingChanges`, `decileChanges`: semua perubahan posisi/kelompok, termasuk assignment yang datanya tetap.
- `highlightedAssignment`: ID fokus.

Setiap perbandingan berisi old/new score, rank, decile, `dataChanged`, `rankDelta = oldRank - newRank` (positif berarti naik), dan `decileDelta = newDecile - oldDecile` (positif berarti menuju kelompok lebih tinggi).

`validateSimulationResult` memeriksa ukuran populasi, ID unik dan tetap, input valid, skor dihitung dari atribut, ranking 1–100 berurutan, tie-break konsisten, desil sesuai ranking, dan tepat 10 anggota setiap desil. Pelanggaran melempar error. Validasi aktif juga di mode biasa.

## Empat skenario
Pilihan meningkat, menurun, dan tetap memberikan dua belas percobaan deterministik. Setiap misi dimulai dari data awal yang sama, bukan hasil misi sebelumnya. Fokus dipilih berdasarkan posisi awal; ID tidak diasumsikan selalu A047.

| Misi | Variasi | Fokus | Ranking | Desil | Data berubah |
|---|---|---|---|---|---|
| 1 | Naik | A013 | 55 → 53 | 5 → 5 | 1 |
| 1 | Turun | A013 | 55 → 57 | 5 → 5 | 1 |
| 2 | Naik | A078 | 51 → 49 | 5 → 6 | 1 |
| 2 | Turun | A051 | 50 → 52 | 6 → 5 | 1 |
| 3 | Campuran | A013 | 55 → 24 | 5 → 8 | 6 |
| 3 | Fokus turun | A013 | 55 → 63 | 5 → 4 | 6 |
| 4 | Naik sedikit | A013 | 55 → 55 | 5 → 5 | 6 |
| 4 | Turun sedikit | A013 | 55 → 55 | 5 → 5 | 6 |

Angka tabel merupakan hasil pengujian data bawaan, bukan hasil yang ditanamkan di UI. Misi 1–2 mencari pendapatan untuk indeks di antara tetangga pada target posisi lalu menjalankan engine. Misi 3 mengubah enam pendapatan dengan faktor berbeda tanpa mengasumsikan hasil desil fokus. Misi 4 mengubah enam pendapatan dengan selisih indeks kecil berdasarkan gap terkecil populasi. Pengecekan tujuan misi dilakukan saat skenario dibuat; ketidaksesuaian melempar error, bukan memalsukan hasil.

## Interaksi dan aksesibilitas
Sepuluh blok desil tersusun vertikal dan menampung 100 baris assignment, dengan ranking 100 hingga 1 dari atas ke bawah. Setiap baris menampilkan ID, ranking, dan indeks; panjang isian batang mencerminkan indeks pada skala yang sama sebelum/sesudah. Fokus ditandai ★, perubahan data diberi label, pergeseran ranking ↔; warna bukan satu-satunya petunjuk. Dialog tabel dapat dicari berdasarkan ID dan ditutup dengan Escape. Kontrol native, label, focus ring, skip link, live status, serta `prefers-reduced-motion` tersedia. Progress misi disimpan hanya selama halaman terbuka.

Enam tahap animasi: data → indeks → ranking → assignment lain → desil → hasil. Papan akhir bergerak dengan posisi sebelum/sesudah menggunakan Web Animations API; data akhir selalu berasal dari engine yang sama. Interaksi perubahan misi dikunci selama animasi. Di reduced motion, gerakan dihilangkan dan tahapan dipersingkat.

## Menjalankan dan debug
Buka `index.html` langsung atau gunakan Live Server. Tambahkan `?debug=1` untuk ringkasan konsol dan akses `window.DTSEN`. Buka `tests/index.html` untuk menjalankan pengujian mesin; tidak membutuhkan instalasi.

## Menambah skenario
Tambahkan cabang pada `createScenario` di `js/simulation.js`, label/deskripsi/insight pada `js/ui.js`, lalu sesuaikan jumlah misi di `js/game.js`, `js/app.js`, dan UI. Perubahan harus berbentuk atribut; tidak boleh mengatur ranking atau desil secara langsung. Tambahkan uji tujuan skenario dan invariannya. Hindari membulatkan indeks sebelum pengurutan.

## Menambah assignment
Versi ini sengaja mengunci populasi ke 100. Untuk mengganti karakteristik assignment, ubah generator dengan tetap menjaga A001–A100. Untuk mendukung populasi lebih besar, lakukan perubahan terkoordinasi: ukuran populasi harus kelipatan 10; sesuaikan generator, validator, formula ukuran desil, rentang ranking, UI, pencarian target skenario, dan seluruh tes. Jangan hanya menambahkan baris ke data karena akan merusak definisi 10 anggota/desil.

## Quality control
`tests/engine.test.js` menguji dua belas variasi, invariansi jumlah/desil, tie-break, perubahan besar, efek pada assignment lain, input tidak valid, tanpa perubahan, determinisme, dan data asal tidak termutasi. Buka halaman tes setelah setiap perubahan formula atau dataset. Pengujian otomatis mesin menggunakan JavaScriptCore menghasilkan 277 pemeriksaan lulus.


## Revisi 1
Referensi meminta layout per desil vertikal. Populasi tetap 100 (10 per desil); gambar referensi memakai 50 hanya sebagai ilustrasi. Dalam papan, kesejahteraan relatif bertambah dari atas ke bawah, sesuai urutan D1 → D10. Angka ranking mengecil ketika posisi membaik. Tidak ada perubahan definisi desil: D1 terendah, D10 tertinggi.

Tiga pilihan berlaku pada kesejahteraan assignment fokus. Pada skema 1–2, pilihan tetap adalah kondisi pembanding tanpa data berubah. Pada skema 3, fokus tetap tetapi lima data lain berubah sehingga ranking fokus 55 → 56, desil tetap 5. Pada skema 4, lima data lain berubah sedikit; fokus tetap ranking 55 dan desil 5. Kedua variasi naik/turun tetap mempertahankan tujuan awal setiap misi.

Papan dapat digulir, otomatis mengikuti fokus, dan menyediakan tombol “Temukan fokus”. Animasi memindahkan baris berdasarkan koordinat sebelum/sesudah. Semua assignment lain tetap ikut diurutkan ulang; tidak ada slot desil yang kosong.

## Deployment
Repository tujuan: https://github.com/ahnafrais02-oss/dtsen-lab . Workflow `.github/workflows/pages.yml` memeriksa aset lalu mengemas hanya `index.html`, `.nojekyll`, `css`, `js`, `data`, dan `assets`. Tidak ada build aplikasi. Tes dan dokumen pengembangan tidak masuk artifact website.

Aktifkan **Settings → Pages → Source: GitHub Actions**. Push ke `main` atau pemicu manual workflow menjalankan deployment. Alamat target: https://ahnafrais02-oss.github.io/dtsen-lab/ . Status aktif harus diverifikasi dari hasil deployment, bukan hanya keberadaan workflow.

Panduan resmi: https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically .
