import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Service,
  Barber,
  Appointment,
  AvailabilitySlot,
  UserProfile,
  BarberSchedule,
  BarberTimeOff,
  ShopSettings,
  AdminAccount,
  BarberAccount,
  BarberRevenueMetrics,
  OwnerOverviewMetrics
} from '../types';
import defaultDbData from '../../data/db.json';

// Ensure database is seeded with initial data if empty
let isSeeded = false;
export async function ensureFirestoreSeeded(): Promise<void> {
  if (isSeeded) return;
  try {
    const servicesSnap = await getDocs(collection(db, 'services'));
    if (servicesSnap.empty) {
      console.log('Seeding initial data to Firebase Firestore...');
      const batch = writeBatch(db);

      // Settings
      if (defaultDbData.settings) {
        const sRef = doc(db, 'settings', 'main');
        batch.set(sRef, { id: 'main', ...defaultDbData.settings });
      }

      // Services
      for (const s of defaultDbData.services) {
        batch.set(doc(db, 'services', s.id), s);
      }

      // Barbers
      for (const b of defaultDbData.barbers) {
        batch.set(doc(db, 'barbers', b.id), b);
      }

      // Schedules
      for (const sc of defaultDbData.barber_schedules) {
        batch.set(doc(db, 'barber_schedules', sc.id), sc);
      }

      // Users
      for (const u of defaultDbData.users) {
        batch.set(doc(db, 'users', u.id), u);
      }

      // Sample Appointments
      for (const a of defaultDbData.appointments) {
        batch.set(doc(db, 'appointments', a.id), a);
      }

      await batch.commit();
      console.log('Firebase Firestore seeded successfully!');
    }
    isSeeded = true;
  } catch (err) {
    console.warn('Could not auto-seed Firestore (may already be populated or offline):', err);
  }
}

// ---------------- SERVICES ----------------
export async function getServicesFS(all = false): Promise<Service[]> {
  await ensureFirestoreSeeded();
  const path = 'services';
  try {
    const snap = await getDocs(collection(db, path));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
    if (!all) {
      return items.filter(s => s.active);
    }
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createServiceFS(data: Partial<Service>): Promise<Service> {
  const path = 'services';
  try {
    const id = data.id || 'srv-' + Date.now();
    const newService: Service = {
      id,
      name: data.name || 'Novo Serviço',
      description: data.description || '',
      price: Number(data.price) || 0,
      duration_minutes: Number(data.duration_minutes) || 30,
      icon_name: data.icon_name || 'scissors',
      category: data.category || 'cabelo',
      active: data.active !== undefined ? data.active : true,
    };
    await setDoc(doc(db, path, id), newService);
    return newService;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateServiceFS(id: string, data: Partial<Service>): Promise<Service> {
  const path = `services/${id}`;
  try {
    const ref = doc(db, 'services', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Serviço não encontrado');
    const updated = { ...snap.data(), ...data, id };
    await setDoc(ref, updated);
    return updated as Service;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleServiceActiveFS(id: string): Promise<{ success: boolean; service: Service }> {
  const path = `services/${id}`;
  try {
    const ref = doc(db, 'services', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Serviço não encontrado');
    const cur = snap.data() as Service;
    const nextActive = !cur.active;
    await updateDoc(ref, { active: nextActive });
    return { success: true, service: { ...cur, active: nextActive } };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------- BARBERS ----------------
export async function getBarbersFS(all = false): Promise<Barber[]> {
  await ensureFirestoreSeeded();
  const path = 'barbers';
  try {
    const snap = await getDocs(collection(db, path));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Barber));
    if (!all) {
      return items.filter(b => b.active);
    }
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createBarberFS(data: Partial<Barber>): Promise<Barber> {
  const path = 'barbers';
  try {
    const id = data.id || 'barber-' + Date.now();
    const newBarber: Barber = {
      id,
      name: data.name || 'Barbeiro',
      nickname: data.nickname || data.name || 'Barbeiro',
      bio: data.bio || '',
      photo_url: data.photo_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
      specialties: data.specialties || ['Cortes Clássicos', 'Degradê'],
      active: data.active !== undefined ? data.active : true,
      phone: data.phone || '',
      email: data.email || '',
      rating: data.rating || 5,
      reviews_count: data.reviews_count || 10,
      commission_rate: data.commission_rate !== undefined ? data.commission_rate : 50,
    };
    await setDoc(doc(db, path, id), newBarber);

    // Initialize default weekly schedules (Mon-Sat 09:00 - 20:00)
    for (let day = 0; day <= 6; day++) {
      const schedId = `sched-${id}-${day}`;
      const sched: BarberSchedule = {
        id: schedId,
        barber_id: id,
        day_of_week: day,
        start_time: day === 0 ? '00:00' : '09:00',
        end_time: day === 0 ? '00:00' : '20:00',
        break_start: '12:30',
        break_end: '13:30',
        active: day !== 0,
      };
      await setDoc(doc(db, 'barber_schedules', schedId), sched);
    }

    return newBarber;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBarberFS(id: string, data: Partial<Barber>): Promise<Barber> {
  const path = `barbers/${id}`;
  try {
    const ref = doc(db, 'barbers', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Barbeiro não encontrado');
    const updated = { ...snap.data(), ...data, id };
    await setDoc(ref, updated);
    return updated as Barber;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------- SCHEDULES & TIME OFF ----------------
export async function getBarberSchedulesFS(barberId: string): Promise<BarberSchedule[]> {
  await ensureFirestoreSeeded();
  const path = 'barber_schedules';
  try {
    const q = query(collection(db, path), where('barber_id', '==', barberId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as BarberSchedule))
      .sort((a, b) => a.day_of_week - b.day_of_week);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveBarberSchedulesFS(barberId: string, schedules: BarberSchedule[]): Promise<void> {
  const path = 'barber_schedules';
  try {
    for (const s of schedules) {
      const id = s.id || `sched-${barberId}-${s.day_of_week}`;
      await setDoc(doc(db, path, id), { ...s, id, barber_id: barberId });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getBarberTimeOffFS(barberId: string): Promise<BarberTimeOff[]> {
  await ensureFirestoreSeeded();
  const path = 'barber_time_off';
  try {
    const q = query(collection(db, path), where('barber_id', '==', barberId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as BarberTimeOff));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addBarberTimeOffFS(barberId: string, data: Partial<BarberTimeOff>): Promise<BarberTimeOff> {
  const path = 'barber_time_off';
  try {
    const id = 'timeoff-' + Date.now();
    const item: BarberTimeOff = {
      id,
      barber_id: barberId,
      date: data.date || '',
      reason: data.reason || 'Folga',
      full_day: data.full_day !== undefined ? data.full_day : true,
      start_time: data.start_time || '',
      end_time: data.end_time || '',
    };
    await setDoc(doc(db, path, id), item);
    return item;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteBarberTimeOffFS(id: string): Promise<void> {
  const path = `barber_time_off/${id}`;
  try {
    await deleteDoc(doc(db, 'barber_time_off', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- AVAILABILITY CALCULATION ----------------
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function getAvailabilityFS(
  serviceId: string,
  date: string,
  barberId?: string
): Promise<{ slots: AvailabilitySlot[]; service: Service; barber?: Barber | null }> {
  await ensureFirestoreSeeded();
  const services = await getServicesFS(true);
  const service = services.find(s => s.id === serviceId);
  if (!service) throw new Error('Serviço não encontrado');

  const barbers = await getBarbersFS(false);
  let targetBarbers = barbers;
  if (barberId) {
    targetBarbers = barbers.filter(b => b.id === barberId);
  }
  if (targetBarbers.length === 0) {
    return { slots: [], service, barber: null };
  }

  const selectedDate = new Date(date + 'T12:00:00');
  const dayOfWeek = selectedDate.getDay();

  // Load schedules, time off, and appointments
  const allSchedulesSnap = await getDocs(collection(db, 'barber_schedules'));
  const allSchedules = allSchedulesSnap.docs.map(d => d.data() as BarberSchedule);

  const allTimeOffSnap = await getDocs(collection(db, 'barber_time_off'));
  const allTimeOff = allTimeOffSnap.docs.map(d => d.data() as BarberTimeOff);

  const appointmentsSnap = await getDocs(
    query(collection(db, 'appointments'), where('date', '==', date))
  );
  const existingAppts = appointmentsSnap.docs
    .map(d => d.data() as Appointment)
    .filter(a => a.status === 'confirmed');

  const slotMap = new Map<string, AvailabilitySlot>();

  for (const barber of targetBarbers) {
    const sched = allSchedules.find(s => s.barber_id === barber.id && s.day_of_week === dayOfWeek);
    if (!sched || !sched.active) continue;

    const isOff = allTimeOff.some(t => t.barber_id === barber.id && t.date === date && t.full_day);
    if (isOff) continue;

    const startMins = timeToMinutes(sched.start_time);
    const endMins = timeToMinutes(sched.end_time);
    const breakStartMins = sched.break_start ? timeToMinutes(sched.break_start) : null;
    const breakEndMins = sched.break_end ? timeToMinutes(sched.break_end) : null;

    const duration = service.duration_minutes;
    const step = 30; // 30-minute slot interval

    for (let cur = startMins; cur + duration <= endMins; cur += step) {
      const slotEnd = cur + duration;

      // Check break
      if (breakStartMins !== null && breakEndMins !== null) {
        if (!(slotEnd <= breakStartMins || cur >= breakEndMins)) {
          continue;
        }
      }

      // Check time off partial
      const partialOff = allTimeOff.find(
        t => t.barber_id === barber.id && t.date === date && !t.full_day && t.start_time && t.end_time
      );
      if (partialOff) {
        const offStart = timeToMinutes(partialOff.start_time);
        const offEnd = timeToMinutes(partialOff.end_time);
        if (!(slotEnd <= offStart || cur >= offEnd)) {
          continue;
        }
      }

      // Check existing appointments
      const conflict = existingAppts.some(a => {
        if (a.barber_id !== barber.id) return false;
        const apptStart = timeToMinutes(a.start_time);
        const apptEnd = timeToMinutes(a.end_time);
        return !(slotEnd <= apptStart || cur >= apptEnd);
      });

      if (!conflict) {
        const timeStr = minutesToTime(cur);
        const slotKey = barberId ? `${timeStr}-${barber.id}` : timeStr;
        if (!slotMap.has(slotKey)) {
          slotMap.set(slotKey, {
            time: timeStr,
            available: true,
            barber_id: barber.id,
          });
        }
      }
    }
  }

  const sortedSlots = Array.from(slotMap.values()).sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  return {
    slots: sortedSlots,
    service,
    barber: barberId ? targetBarbers[0] || null : null,
  };
}

// ---------------- APPOINTMENTS ----------------
export async function createAppointmentFS(payload: {
  service_id: string;
  barber_id?: string;
  date: string;
  start_time: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
}): Promise<Appointment> {
  const path = 'appointments';
  try {
    const services = await getServicesFS(true);
    const service = services.find(s => s.id === payload.service_id);
    if (!service) throw new Error('Serviço selecionado não encontrado');

    const barbers = await getBarbersFS(false);
    let chosenBarber = barbers.find(b => b.id === payload.barber_id);
    if (!chosenBarber && barbers.length > 0) {
      chosenBarber = barbers[0];
    }
    if (!chosenBarber) throw new Error('Barbeiro não disponível');

    const startMins = timeToMinutes(payload.start_time);
    const endMins = startMins + service.duration_minutes;
    const endTime = minutesToTime(endMins);

    // Verify conflicts
    const existingSnap = await getDocs(
      query(
        collection(db, 'appointments'),
        where('barber_id', '==', chosenBarber.id),
        where('date', '==', payload.date)
      )
    );
    const hasConflict = existingSnap.docs
      .map(d => d.data() as Appointment)
      .some(a => {
        if (a.status !== 'confirmed') return false;
        const aStart = timeToMinutes(a.start_time);
        const aEnd = timeToMinutes(a.end_time);
        return !(endMins <= aStart || startMins >= aEnd);
      });

    if (hasConflict) {
      throw new Error('Este horário acabou de ser preenchido. Por favor, escolha outro horário.');
    }

    const code = 'LIB-' + Math.floor(1000 + Math.random() * 9000);
    const id = 'appt-' + Date.now();

    const appointment: Appointment = {
      id,
      code,
      service_id: service.id,
      barber_id: chosenBarber.id,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      customer_email: payload.customer_email || '',
      notes: payload.notes || '',
      date: payload.date,
      start_time: payload.start_time,
      end_time: endTime,
      price: service.price,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    await setDoc(doc(db, path, id), appointment);
    return appointment;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getAppointmentByCodeFS(code: string): Promise<Appointment> {
  const path = 'appointments';
  try {
    const q = query(collection(db, path), where('code', '==', code.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Agendamento não encontrado com o código fornecido.');
    return snap.docs[0].data() as Appointment;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function cancelAppointmentByCodeFS(code: string): Promise<void> {
  const path = 'appointments';
  try {
    const q = query(collection(db, path), where('code', '==', code.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Agendamento não encontrado.');
    const docRef = snap.docs[0].ref;
    await updateDoc(docRef, { status: 'cancelled' });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getAppointmentsFS(filters?: {
  barberId?: string;
  date?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Appointment[]> {
  await ensureFirestoreSeeded();
  const path = 'appointments';
  try {
    const snap = await getDocs(collection(db, path));
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));

    if (filters?.barberId) {
      items = items.filter(a => a.barber_id === filters.barberId);
    }
    if (filters?.date) {
      items = items.filter(a => a.date === filters.date);
    }
    if (filters?.status) {
      items = items.filter(a => a.status === filters.status);
    }
    if (filters?.startDate) {
      items = items.filter(a => a.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      items = items.filter(a => a.date <= filters.endDate!);
    }

    return items.sort((a, b) => `${b.date} ${b.start_time}`.localeCompare(`${a.date} ${a.start_time}`));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateAppointmentStatusFS(id: string, status: string): Promise<void> {
  const path = `appointments/${id}`;
  try {
    const ref = doc(db, 'appointments', id);
    await updateDoc(ref, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------- SETTINGS ----------------
export async function getShopSettingsFS(): Promise<ShopSettings> {
  await ensureFirestoreSeeded();
  const path = 'settings/main';
  try {
    const ref = doc(db, 'settings', 'main');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as ShopSettings;
    }
    return defaultDbData.settings as ShopSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateShopSettingsFS(data: Partial<ShopSettings>): Promise<ShopSettings> {
  const path = 'settings/main';
  try {
    const ref = doc(db, 'settings', 'main');
    const snap = await getDoc(ref);
    const cur = snap.exists() ? snap.data() : defaultDbData.settings;
    const updated = { ...cur, ...data, id: 'main' };
    await setDoc(ref, updated);
    return updated as ShopSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- AUTHENTICATION & USERS ----------------
export async function loginFS(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
  await ensureFirestoreSeeded();
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const normalizedEmail = email.trim().toLowerCase();
    const matched = users.find(u => {
      if (u.active === false || u.password !== password) return false;
      const uEmail = (u.email || '').toLowerCase();
      if (uEmail === normalizedEmail) return true;
      // Aliases para facilitar acesso do dono e admin
      if (u.role === 'owner' && (normalizedEmail === 'dono' || normalizedEmail === 'allinesoares050@gmail.com' || normalizedEmail === 'dono@liderbarbers.com.br')) {
        return true;
      }
      if (u.role === 'admin' && (normalizedEmail === 'admin' || normalizedEmail === 'admin@liderbarbers.com.br' || normalizedEmail === 'admin@liberdade.com.br')) {
        return true;
      }
      return false;
    });

    if (!matched) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const { password: _, ...userSafe } = matched;
    return {
      user: userSafe as UserProfile,
      token: 'fs-token-' + matched.id,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ---------------- REVENUE & METRICS ----------------
export async function getBarberRevenueFS(barberId: string, period = 'all'): Promise<BarberRevenueMetrics> {
  const appts = await getAppointmentsFS({ barberId, status: 'completed' });
  const barbers = await getBarbersFS(true);
  const barber = barbers.find(b => b.id === barberId);
  const commRate = (barber?.commission_rate !== undefined ? barber.commission_rate : 50) / 100;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const filtered = appts.filter(a => {
    if (period === 'today') return a.date === todayStr;
    return true;
  });

  const gross = filtered.reduce((acc, a) => acc + (a.price || 0), 0);
  const netCommission = gross * commRate;
  const houseShare = gross - netCommission;

  return {
    barber_id: barberId,
    barber_name: barber?.name || 'Barbeiro',
    barber_nickname: barber?.nickname || barber?.name || 'Barbeiro',
    commission_rate: (barber?.commission_rate !== undefined ? barber.commission_rate : 50),
    period,
    totalAppointments: filtered.length,
    completedCount: filtered.length,
    cancelledCount: 0,
    grossRevenue: gross,
    netEarnings: netCommission,
    averageTicket: filtered.length > 0 ? gross / filtered.length : 0,
    completedAppointments: filtered.map(a => ({
      ...a,
      status: 'completed' as const,
      commission: (a.price || 0) * commRate,
    })),
  };
}

export async function getOwnerOverviewFS(): Promise<OwnerOverviewMetrics> {
  const appts = await getAppointmentsFS({ status: 'completed' });
  const barbers = await getBarbersFS(true);
  const admins = await getOwnerAdminsFS();
  const services = await getServicesFS(true);

  const totalGross = appts.reduce((acc, a) => acc + (a.price || 0), 0);

  const barberStats = barbers.map(b => {
    const bAppts = appts.filter(a => a.barber_id === b.id);
    const bGross = bAppts.reduce((acc, a) => acc + (a.price || 0), 0);
    const rate = (b.commission_rate !== undefined ? b.commission_rate : 50) / 100;
    const bNet = bGross * rate;

    return {
      barber_id: b.id,
      name: b.name,
      nickname: b.nickname || b.name,
      completed: bAppts.length,
      gross: bGross,
      net: bNet,
    };
  });

  return {
    totalGrossRevenue: totalGross,
    totalCompletedAppointments: appts.length,
    totalAdmins: admins.length,
    totalBarbers: barbers.length,
    totalServices: services.length,
    barberRevenues: barberStats,
  };
}

// ---------------- ADMIN ACCOUNTS (OWNER MANAGES) ----------------
export async function getOwnerAdminsFS(): Promise<AdminAccount[]> {
  await ensureFirestoreSeeded();
  const snap = await getDocs(collection(db, 'users'));
  const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  return users
    .filter(u => u.role === 'admin')
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      active: u.active !== false,
      role: 'admin',
      created_at: u.created_at,
    }));
}

export async function createAdminAccountFS(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AdminAccount> {
  const id = 'user-admin-' + Date.now();
  const newAdmin = {
    id,
    email: data.email,
    password: data.password,
    name: data.name,
    role: 'admin',
    phone: data.phone || '',
    active: true,
    created_at: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', id), newAdmin);
  return {
    id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    active: true,
    role: 'admin',
    created_at: newAdmin.created_at,
  };
}

export async function updateAdminAccountFS(
  id: string,
  data: Partial<AdminAccount> & { password?: string }
): Promise<AdminAccount> {
  const ref = doc(db, 'users', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Administrador não encontrado');
  const cur = snap.data();
  const updated = { ...cur, ...data };
  await setDoc(ref, updated);
  return {
    id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    active: updated.active !== false,
    role: 'admin',
    created_at: updated.created_at || new Date().toISOString(),
  };
}

export async function deleteAdminAccountFS(id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', id));
}

// ---------------- BARBER ACCOUNTS (ADMIN MANAGES) ----------------
export async function getAdminBarberAccountsFS(): Promise<BarberAccount[]> {
  await ensureFirestoreSeeded();
  const snap = await getDocs(collection(db, 'users'));
  const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  return users
    .filter(u => u.role === 'barber')
    .map(u => ({
      id: u.id,
      barber_id: u.barber_id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      active: u.active !== false,
      commission_rate: u.commission_rate !== undefined ? u.commission_rate : 50,
      created_at: u.created_at,
    }));
}

export async function createBarberAccountFS(data: {
  barber_id: string;
  email: string;
  password: string;
  commission_rate: number;
  name?: string;
  phone?: string;
}): Promise<{ success: boolean; user: UserProfile; message: string }> {
  const id = 'user-barber-' + Date.now();
  const newUser = {
    id,
    email: data.email,
    password: data.password,
    name: data.name || 'Barbeiro',
    role: 'barber',
    barber_id: data.barber_id,
    commission_rate: data.commission_rate,
    phone: data.phone || '',
    active: true,
    created_at: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', id), newUser);

  // Update barber commission in barbers collection as well
  try {
    const bRef = doc(db, 'barbers', data.barber_id);
    await updateDoc(bRef, {
      commission_rate: data.commission_rate,
      has_login: true,
      login_email: data.email,
    });
  } catch (e) {
    console.warn('Barber profile update notice:', e);
  }

  const { password: _, ...safe } = newUser;
  return {
    success: true,
    user: safe as UserProfile,
    message: 'Conta criada com sucesso!',
  };
}

export async function updateBarberAccountFS(
  id: string,
  data: Partial<BarberAccount> & { password?: string }
): Promise<{ success: boolean; user: UserProfile }> {
  const ref = doc(db, 'users', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Conta de barbeiro não encontrada');
  const cur = snap.data();
  const updated = { ...cur, ...data };
  await setDoc(ref, updated);

  if (updated.barber_id && data.commission_rate !== undefined) {
    try {
      await updateDoc(doc(db, 'barbers', updated.barber_id), {
        commission_rate: data.commission_rate,
      });
    } catch (e) {
      // ignore
    }
  }

  const { password: _, ...safe } = updated;
  return {
    success: true,
    user: safe as UserProfile,
  };
}

export async function deleteBarberAccountFS(id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', id));
}
