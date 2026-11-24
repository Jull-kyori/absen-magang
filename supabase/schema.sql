-- ============================================================
-- 1. EXTENSIONS & ENUMS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'magang');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.attendance_status AS ENUM ('hadir', 'terlambat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.leave_type AS ENUM ('izin', 'sakit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.leave_status AS ENUM ('menunggu', 'disetujui', 'ditolak');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. TABEL PROFIL PENGGUNA (users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role public.user_role NOT NULL DEFAULT 'magang'::public.user_role,
    instansi TEXT,
    nim TEXT,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. TABEL PENGATURAN LOKASI (locations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    radius_meter INTEGER NOT NULL DEFAULT 100,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pastikan hanya ada satu lokasi aktif. Jika schema pernah dijalankan
-- berkali-kali, pertahankan lokasi aktif yang paling baru diperbarui.
WITH ranked_active_locations AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY updated_at DESC, created_at DESC, id DESC) AS row_number
    FROM public.locations
    WHERE aktif = TRUE
)
UPDATE public.locations AS locations
SET aktif = FALSE,
    updated_at = now()
FROM ranked_active_locations AS ranked
WHERE locations.id = ranked.id
  AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_single_active
    ON public.locations (aktif)
    WHERE aktif = TRUE;

INSERT INTO public.locations (nama, lat, lng, radius_meter, aktif)
SELECT 'Bakesbangpol Kabupaten Ponorogo', -7.868800, 111.464500, 100, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM public.locations WHERE aktif = TRUE
);
-- ============================================================
CREATE TABLE IF NOT EXISTS public.work_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    jam_masuk TIME NOT NULL DEFAULT '08:00:00',
    batas_terlambat TIME NOT NULL DEFAULT '08:30:00',
    jam_pulang TIME NOT NULL DEFAULT '17:00:00',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT singleton_check CHECK (id = 1)
);

INSERT INTO public.work_settings (id, jam_masuk, batas_terlambat, jam_pulang)
VALUES (1, '08:00:00', '08:30:00', '17:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. TABEL ABSENSI (attendance)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date,
    jam_masuk TIME,
    jam_pulang TIME,
    lat_masuk DOUBLE PRECISION,
    lng_masuk DOUBLE PRECISION,
    lat_pulang DOUBLE PRECISION,
    lng_pulang DOUBLE PRECISION,
    foto_masuk_url TEXT,
    foto_pulang_url TEXT,
    status public.attendance_status,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_tanggal UNIQUE (user_id, tanggal)
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_tanggal ON public.attendance(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_attendance_tanggal ON public.attendance(tanggal);

-- ============================================================
-- 6. TABEL PERIZINAN (leave_requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    jenis public.leave_type NOT NULL,
    keterangan TEXT NOT NULL,
    lampiran_url TEXT,
    status public.leave_status NOT NULL DEFAULT 'menunggu'::public.leave_status,
    catatan_admin TEXT,
    approved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_leave_user_tanggal UNIQUE (user_id, tanggal)
);

CREATE INDEX IF NOT EXISTS idx_leave_user_tanggal ON public.leave_requests(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_leave_status ON public.leave_requests(status);

-- ============================================================
-- 7. FUNGSI SERVER: HITUNG JARAK (HAVERSINE FORMULA)
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    r DOUBLE PRECISION := 6371000;
    phi1 DOUBLE PRECISION := radians(lat1);
    phi2 DOUBLE PRECISION := radians(lat2);
    delta_phi DOUBLE PRECISION := radians(lat2 - lat1);
    delta_lambda DOUBLE PRECISION := radians(lon2 - lon1);
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    a := sin(delta_phi / 2.0) ^ 2 +
         cos(phi1) * cos(phi2) * (sin(delta_lambda / 2.0) ^ 2);
    c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 8. HELPER FUNCTION UNTUK RLS: CEK ADMIN
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
          AND aktif = TRUE
          AND (
              role = 'admin'::public.user_role
              -- Kompatibilitas dengan akun admin lama yang dikenali dari email.
              -- Login berikutnya akan menyinkronkan role akun tersebut menjadi admin.
              OR lower(email) LIKE '%admin%'
          )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. TRIGGER: OTOMATIS TAMBAH PROFIL SAAT USER BARU DIDAFTARKAN
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.users (id, nama, email, role, instansi, nim, aktif)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
        new.email,
        -- Akun baru selalu dibuat sebagai mahasiswa. Role admin harus diberikan
        -- secara eksplisit oleh administrator melalui database/panel admin.
        'magang'::public.user_role,
        new.raw_user_meta_data->>'instansi',
        new.raw_user_meta_data->>'nim',
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        nama = EXCLUDED.nama,
        email = EXCLUDED.email,
        -- Jangan menurunkan akun admin menjadi mahasiswa saat trigger berjalan ulang.
        role = public.users.role,
        instansi = COALESCE(EXCLUDED.instansi, public.users.instansi),
        nim = COALESCE(EXCLUDED.nim, public.users.nim),
        updated_at = now();
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 9b. SINKRONISASI PROFIL AUTH YANG SUDAH ADA
-- ============================================================
-- Berguna saat schema ini dipasang setelah beberapa akun sudah dibuat
-- di auth.users tetapi trigger profil sebelumnya gagal atau belum tersedia.
-- Profil yang sudah ada tidak ditimpa role/nama/metadata-nya.
INSERT INTO public.users (id, nama, email, role, instansi, nim, aktif)
SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'nama', split_part(au.email, '@', 1)),
    au.email,
    'magang'::public.user_role,
    au.raw_user_meta_data->>'instansi',
    au.raw_user_meta_data->>'nim',
    TRUE
FROM auth.users AS au
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    instansi = COALESCE(EXCLUDED.instansi, public.users.instansi),
    nim = COALESCE(EXCLUDED.nim, public.users.nim),
    updated_at = now();

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin dapat mengelola semua user" ON public.users;
DROP POLICY IF EXISTS "User dapat melihat profil miliknya sendiri" ON public.users;
CREATE POLICY "Admin dapat mengelola semua user" ON public.users FOR ALL USING (public.is_admin());
CREATE POLICY "User dapat melihat profil miliknya sendiri" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Semua user terotentikasi dapat melihat lokasi aktif" ON public.locations;
DROP POLICY IF EXISTS "Admin dapat mengelola lokasi" ON public.locations;
CREATE POLICY "Semua user terotentikasi dapat melihat lokasi aktif" ON public.locations FOR SELECT TO authenticated USING (aktif = TRUE);
CREATE POLICY "Admin dapat mengelola lokasi" ON public.locations FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Semua user terotentikasi dapat melihat jam kerja" ON public.work_settings;
DROP POLICY IF EXISTS "Admin dapat mengubah jam kerja" ON public.work_settings;
CREATE POLICY "Semua user terotentikasi dapat melihat jam kerja" ON public.work_settings FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admin dapat mengubah jam kerja" ON public.work_settings FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin dapat melihat dan mengelola seluruh absensi" ON public.attendance;
DROP POLICY IF EXISTS "Magang hanya dapat melihat absensi miliknya" ON public.attendance;
DROP POLICY IF EXISTS "Magang dapat mencatat absen masuk miliknya" ON public.attendance;
DROP POLICY IF EXISTS "Magang dapat memperbarui absen pulang miliknya" ON public.attendance;
CREATE POLICY "Admin dapat melihat dan mengelola seluruh absensi" ON public.attendance FOR ALL USING (public.is_admin());
CREATE POLICY "Magang hanya dapat melihat absensi miliknya" ON public.attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Magang dapat mencatat absen masuk miliknya" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Magang dapat memperbarui absen pulang miliknya" ON public.attendance FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin dapat melihat dan mengelola seluruh perizinan" ON public.leave_requests;
DROP POLICY IF EXISTS "Magang dapat melihat izin miliknya" ON public.leave_requests;
DROP POLICY IF EXISTS "Magang dapat mengajukan perizinan baru" ON public.leave_requests;
CREATE POLICY "Admin dapat melihat dan mengelola seluruh perizinan" ON public.leave_requests FOR ALL USING (public.is_admin());
CREATE POLICY "Magang dapat melihat izin miliknya" ON public.leave_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Magang dapat mengajukan perizinan baru" ON public.leave_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 11. SUPABASE STORAGE BUCKETS SETUP
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('attendance_photos', 'attendance_photos', true),
    ('leave_attachments', 'leave_attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "User terotentikasi dapat upload selfie" ON storage.objects;
DROP POLICY IF EXISTS "Foto selfie dapat dilihat publik atau terotentikasi" ON storage.objects;
CREATE POLICY "User terotentikasi dapat upload selfie" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attendance_photos');
CREATE POLICY "Foto selfie dapat dilihat publik atau terotentikasi" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attendance_photos');

DROP POLICY IF EXISTS "User terotentikasi dapat upload lampiran izin" ON storage.objects;
DROP POLICY IF EXISTS "Lampiran izin dapat dilihat pemilik atau admin" ON storage.objects;
CREATE POLICY "User terotentikasi dapat upload lampiran izin" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'leave_attachments');
CREATE POLICY "Lampiran izin dapat dilihat pemilik atau admin" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'leave_attachments' 
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);

-- ============================================================
-- 12. PERMISSIONS GRANT
-- ============================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
