export type UserRole = 'owner' | 'admin' | 'barber' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  barber_id?: string;
  commission_rate?: number;
  phone?: string;
  active?: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  icon_name: 'scissors' | 'razor' | 'sparkles' | 'crown' | 'ruler' | 'star';
  active: boolean;
  category?: 'cabelo' | 'barba' | 'combo' | 'tratamento';
}

export interface Barber {
  id: string;
  name: string;
  nickname: string;
  bio: string;
  photo_url: string;
  specialties: string[];
  active: boolean;
  phone: string;
  email: string;
  rating?: number;
  reviews_count?: number;
  commission_rate?: number; // e.g. 50 (percentage)
  has_login?: boolean;
  login_email?: string;
}

export interface BarberSchedule {
  id: string;
  barber_id: string;
  day_of_week: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  start_time: string; // "09:00"
  end_time: string; // "20:00"
  break_start: string; // "13:00"
  break_end: string; // "14:00"
  active: boolean;
}

export interface BarberTimeOff {
  id: string;
  barber_id: string;
  date: string; // "YYYY-MM-DD"
  reason: string;
  full_day: boolean;
  start_time?: string;
  end_time?: string;
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'no_show' | 'cancelled';

export interface Appointment {
  id: string;
  code: string; // e.g. "LIB-7842"
  service_id: string;
  barber_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes?: string;
  date: string; // "YYYY-MM-DD"
  start_time: string; // "14:00"
  end_time: string; // "14:45"
  price: number;
  status: AppointmentStatus;
  created_at: string;
  // Hydrated joins
  service?: Service;
  barber?: Barber;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
  barber_id?: string;
}

export interface ShopSettings {
  name: string;
  tagline: string;
  logo_url: string;
  hero_image_url: string;
  phone: string;
  address: string;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  active: boolean;
  role: 'admin';
  barber_id?: string;
  created_at: string;
}

export interface BarberAccount {
  id: string;
  user_id?: string | null;
  name: string;
  barber_name?: string;
  nickname?: string;
  barber_nickname?: string;
  photo_url?: string;
  has_account?: boolean;
  has_login?: boolean;
  email: string;
  password?: string;
  barber_id: string;
  commission_rate: number;
  phone?: string;
  active: boolean;
  created_at?: string;
}

export interface BarberRevenueMetrics {
  barber_id: string;
  barber_name: string;
  barber_nickname: string;
  commission_rate: number;
  period: string;
  totalAppointments: number;
  completedCount: number;
  cancelledCount: number;
  grossRevenue: number;
  netEarnings: number;
  averageTicket: number;
  completedAppointments: (Appointment & { commission: number })[];
}

export interface OwnerAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  role: 'owner';
  created_at?: string;
}

export interface OwnerOverviewMetrics {
  totalGrossRevenue: number;
  totalCompletedAppointments: number;
  totalAdmins: number;
  totalBarbers: number;
  totalServices: number;
  totalActiveOwners?: number;
  ownerAccounts?: OwnerAccount[];
  barberRevenues: {
    barber_id: string;
    name: string;
    nickname: string;
    gross: number;
    net: number;
    completed: number;
  }[];
}
