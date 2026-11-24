<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2563eb,50:4f46e5,100:0f172a&height=180&section=header&text=Presensi%20Magang&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Bakesbangpol%20Kabupaten%20Ponorogo&descAlignY=62&descSize=17" width="100%" alt="Presensi Magang" />

<a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
<a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
<a href="https://vercel.com/"><img src="https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel" alt="Vercel" /></a>

<br />

<a href="https://github.com/Jull-kyori/absen-magang"><strong>Lihat repository di GitHub →</strong></a>

<br /><br />

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=18&duration=3200&pause=900&color=2563EB&center=true&vCenter=true&width=700&lines=Presensi+digital+mahasiswa+magang;Geofencing+GPS+%2B+selfie+sebagai+bukti;Monitoring+real-time+untuk+pembimbing+instansi" alt="Deskripsi animasi" />

</div>

## Tentang aplikasi

**Presensi Magang** adalah portal presensi digital untuk mahasiswa magang atau PKL di Bakesbangpol Kabupaten Ponorogo. Sistem ini memvalidasi lokasi menggunakan GPS, menyimpan foto selfie sebagai bukti, dan menyediakan panel monitoring untuk pembimbing instansi.

## Fitur utama

| Area | Fitur |
| --- | --- |
| Mahasiswa | Absen masuk dan pulang, GPS geofencing, selfie presensi, riwayat absen, status lokasi real-time |
| Admin | Monitoring presensi harian, grafik tren 7 hari, validasi foto dan GPS, filter mahasiswa, pengaturan radius kantor |
| Sistem | Supabase Auth, role admin/mahasiswa, Row Level Security, storage foto, waktu WIB |
| Tampilan | Responsive mobile, liquid glass, animasi halus, dukungan reduced motion |

## Alur sistem

```mermaid
flowchart LR
    A[Mahasiswa login] --> B{GPS dalam radius?}
    B -- Tidak --> C[Perbarui GPS]
    C --> B
    B -- Ya --> D[Ambil selfie]
    D --> E[Simpan presensi]
    E --> F[Panel admin]
    F --> G[Validasi foto, waktu, dan jarak]
```

<details>
<summary><strong>Alur presensi mahasiswa</strong></summary>

1. Mahasiswa masuk menggunakan akun masing-masing.
2. Sistem mengambil koordinat perangkat dan menghitung jarak ke kantor.
3. Tombol presensi aktif jika perangkat berada di dalam radius.
4. Mahasiswa mengambil selfie sebagai bukti.
5. Server menyimpan waktu WIB, koordinat, status, dan foto.
6. Data dapat dipantau oleh admin.

</details>

<details>
<summary><strong>Keamanan akses</strong></summary>

- Data mahasiswa dibatasi dengan Row Level Security Supabase.
- Mahasiswa hanya dapat melihat data presensi miliknya.
- Admin dapat memantau data presensi seluruh mahasiswa.
- Validasi radius dilakukan kembali di server.
- File environment dan service role key tidak boleh dipublikasikan.

</details>

## Menjalankan secara lokal

```bash
git clone https://github.com/Jull-kyori/absen-magang.git
cd ABSENSI-MAGANG
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Buat file `.env.local` berdasarkan `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Jangan commit `.env.local` atau `SUPABASE_SERVICE_ROLE_KEY` ke GitHub.

## Database Supabase

Schema, trigger profil, policy RLS, storage, dan pengaturan lokasi tersedia di [supabase/schema.sql](./supabase/schema.sql).

Jalankan file tersebut melalui **Supabase Dashboard > SQL Editor** sebelum menguji presensi.

## Deploy ke Vercel

1. Push repository ke GitHub.
2. Import repository melalui Vercel.
3. Tambahkan environment variables yang sama dengan `.env.local`.
4. Jalankan deployment.

Setiap push ke branch production akan membuat deployment baru secara otomatis.

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:4f46e5,100:2563eb&height=100&section=footer" width="100%" alt="Footer" />
</div>
