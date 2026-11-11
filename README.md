# Spin & Split

Aplikasi web sederhana untuk mengundi nama lewat roda putar (*spin wheel*) dan membagi peserta ke beberapa tim secara acak.

## SKPL Singkat

### Deskripsi Umum
Spin & Split adalah aplikasi *client-side* (tanpa backend) yang berjalan di browser. Pengguna memasukkan daftar nama, lalu bisa memutar roda untuk memilih satu nama secara acak atau membagi semua nama ke dalam tim.

### Kebutuhan Fungsional
| ID | Kebutuhan |
|----|-----------|
| F-01 | Pengguna dapat menambah daftar nama (satu nama per baris). |
| F-02 | Pengguna dapat mengacak (*shuffle*), mengurutkan A–Z / Z–A, dan menghapus semua nama (dengan konfirmasi). |
| F-03 | Pengguna dapat memutar roda untuk memilih satu nama secara acak (minimal 2 nama). |
| F-04 | Sistem menampilkan pemenang dalam popup, dengan opsi menghapus nama tersebut dari roda. |
| F-05 | Sistem menyimpan riwayat nama terpilih; nama bisa dikembalikan ke roda atau riwayat dihapus. |
| F-06 | Pengguna dapat menentukan jumlah tim dan membagi nama secara acak, disertai animasi pembagian. |
| F-07 | Data nama dan riwayat tersimpan otomatis di `localStorage` sehingga tetap ada setelah halaman dimuat ulang. |

### Kebutuhan Non-Fungsional
- **Usability:** antarmuka berbahasa Indonesia, responsif untuk desktop dan ponsel.
- **Performa:** berjalan sepenuhnya di sisi klien, tanpa request ke server.
- **Privasi:** data hanya disimpan di browser pengguna.
- **Kompatibilitas:** browser modern yang mendukung ES modules.

## Tech Stack
- [SolidJS](https://www.solidjs.com/) — UI library reaktif
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) + `vite-plugin-solid` — dev server & bundler
- CSS murni + Google Fonts (Poppins)
- `localStorage` untuk penyimpanan data

## Menjalankan

```bash
npm install
npm run dev      # mode development
npm run build    # build produksi ke folder dist/
npm run preview  # pratinjau hasil build
```
