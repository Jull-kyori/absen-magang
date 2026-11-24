export type UserRole = 'admin' | 'magang'
export type AttendanceStatus = 'hadir' | 'terlambat'
export type LeaveType = 'izin' | 'sakit'
export type LeaveStatus = 'menunggu' | 'disetujui' | 'ditolak'

export interface UserProfile {
  id: string
  nama: string
  email: string
  role: UserRole
  instansi: string | null
  nim: string | null
  aktif: boolean
  created_at: string
  updated_at: string
}

export interface LocationSetting {
  id: string
  nama: string
  lat: number
  lng: number
  radius_meter: number
  gunakan_radius: boolean
  aktif: boolean
  created_at: string
  updated_at: string
}

export interface WorkSetting {
  id: number
  jam_masuk: string
  batas_terlambat: string
  jam_pulang: string
  updated_at: string
}

export interface Attendance {
  id: string
  user_id: string
  tanggal: string
  jam_masuk: string | null
  jam_pulang: string | null
  lat_masuk: number | null
  lng_masuk: number | null
  lat_pulang: number | null
  lng_pulang: number | null
  foto_masuk_url: string | null
  foto_pulang_url: string | null
  status: AttendanceStatus | null
  created_at: string
  updated_at: string
  users?: UserProfile
}

export interface DailyLogbook {
  id: string
  user_id: string
  tanggal: string
  kegiatan: string
  hasil: string | null
  kendala: string | null
  bukti_url: string | null
  created_at: string
  updated_at: string
  users?: UserProfile
}

export interface LeaveRequest {
  id: string
  user_id: string
  tanggal: string
  jenis: LeaveType
  keterangan: string
  lampiran_url: string | null
  status: LeaveStatus
  catatan_admin: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  users?: UserProfile
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserProfile
        Insert: Partial<UserProfile> & { id: string; nama: string; email: string }
        Update: Partial<UserProfile>
        Relationships: []
      }
      locations: {
        Row: LocationSetting
        Insert: Omit<LocationSetting, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<LocationSetting>
        Relationships: []
      }
      work_settings: {
        Row: WorkSetting
        Insert: Partial<WorkSetting>
        Update: Partial<WorkSetting>
        Relationships: []
      }
      attendance: {
        Row: Attendance
        Insert: Partial<Attendance> & { user_id: string; tanggal: string }
        Update: Partial<Attendance>
        Relationships: [
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_logbooks: {
        Row: DailyLogbook
        Insert: Partial<DailyLogbook> & { user_id: string; tanggal: string; kegiatan: string }
        Update: Partial<DailyLogbook>
        Relationships: [
          {
            foreignKeyName: "daily_logbooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      leave_requests: {
        Row: LeaveRequest
        Insert: Partial<LeaveRequest> & { user_id: string; tanggal: string; jenis: LeaveType; keterangan: string }
        Update: Partial<LeaveRequest>
        Relationships: [
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      calculate_distance: {
        Args: {
          lat1: number
          lon1: number
          lat2: number
          lon2: number
        }
        Returns: number
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      attendance_status: AttendanceStatus
      leave_type: LeaveType
      leave_status: LeaveStatus
    }
    CompositeTypes: Record<string, never>
  }
}
