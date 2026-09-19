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
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';
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

/**
 * Creates a new user in Firebase Authentication without logging out the currently
 * authenticated Admin or Owner user, using an ephemeral secondary Firebase App instance.
 */
export async function createAuthUserWithoutSwitching(email: string, pass: string): Promise<string> {
  const secondaryAppName = `staffUserCreation-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = (await import('firebase/auth')).getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), pass);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch (e) {
      console.warn('Ephemeral auth app cleanup notice:', e);
    }
  }
}

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
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Get current date and minutes in Brazil timezone (America/Sao_Paulo)
export function getBrazilDateTime(): { dateStr: string; currentMinutes: number; timeStr: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const getVal = (t: string) => parts.find(p => p.type === t)?.value || '';
  const y = getVal('year');
  const m = getVal('month');
  const d = getVal('day');
  const h = parseInt(getVal('hour'), 10) || 0;
  const min = parseInt(getVal('minute'), 10) || 0;
  return {
    dateStr: `${y}-${m}-${d}`,
    currentMinutes: h * 60 + min,
    timeStr: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  };
}

// Get current date string in local/Brazil format YYYY-MM-DD
function getLocalDateString(d: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
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
  let targetBarbers = barbers.filter(b => b.active);
  if (barberId && barberId !== 'any') {
    targetBarbers = barbers.filter(b => (b.id === barberId || (b as any).user_id === barberId) && b.active);
  }
  if (targetBarbers.length === 0) {
    return { slots: [], service, barber: null };
  }

  // Obter data e minutos no fuso horário do Brasil
  const { dateStr: todayBrazil, currentMinutes } = getBrazilDateTime();
  if (date < todayBrazil) {
    return { slots: [], service, barber: barberId && barberId !== 'any' ? targetBarbers[0] || null : null };
  }

  const isToday = date === todayBrazil;

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
  // Any appointment not cancelled is active and blocks the time
  const existingAppts = appointmentsSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as Appointment))
    .filter(a => a.status !== 'cancelled');

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

      // 1. Descartar horários passados para o dia de hoje (+ 10 minutos de margem)
      if (isToday && cur <= currentMinutes + 10) {
        continue;
      }

      // 2. Check break / lunch interval
      if (breakStartMins !== null && breakEndMins !== null) {
        if (!(slotEnd <= breakStartMins || cur >= breakEndMins)) {
          continue;
        }
      }

      // 3. Check time off partial
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

      // 4. Check existing appointments conflict (same barber)
      const conflict = existingAppts.some(a => {
        if (a.barber_id !== barber.id) return false;
        const apptStart = timeToMinutes(a.start_time);
        const apptEnd = timeToMinutes(a.end_time);
        return !(slotEnd <= apptStart || cur >= apptEnd);
      });

      if (!conflict) {
        const timeStr = minutesToTime(cur);
        const slotKey = barberId && barberId !== 'any' ? `${timeStr}-${barber.id}` : timeStr;
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
    barber: barberId && barberId !== 'any' ? targetBarbers[0] || null : null,
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
    // 1. Validação de horário no passado (Fuso Horário do Brasil)
    const { dateStr: todayBrazil, currentMinutes } = getBrazilDateTime();
    const startMins = timeToMinutes(payload.start_time);

    if (payload.date < todayBrazil) {
      throw new Error('Não é possível realizar agendamento para uma data que já passou.');
    }
    if (payload.date === todayBrazil && startMins <= currentMinutes) {
      throw new Error('Este horário já passou. Por favor, escolha um horário futuro disponível.');
    }

    const services = await getServicesFS(true);
    const service = services.find(s => s.id === payload.service_id);
    if (!service) throw new Error('Serviço selecionado não encontrado');

    const endMins = startMins + service.duration_minutes;
    const endTime = minutesToTime(endMins);

    const barbers = await getBarbersFS(false);
    const activeBarbers = barbers.filter(b => b.active);

    // Carregar agendamentos existentes na data para verificar conflitos
    const existingSnap = await getDocs(
      query(collection(db, 'appointments'), where('date', '==', payload.date))
    );
    const existingAppts = existingSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as Appointment))
      .filter(a => a.status !== 'cancelled');

    // Carregar folgas na data
    const allTimeOffSnap = await getDocs(collection(db, 'barber_time_off'));
    const allTimeOff = allTimeOffSnap.docs
      .map(d => d.data() as BarberTimeOff)
      .filter(t => t.date === payload.date);

    // Carregar grades
    const selectedDateObj = new Date(payload.date + 'T12:00:00');
    const dayOfWeek = selectedDateObj.getDay();
    const allSchedulesSnap = await getDocs(collection(db, 'barber_schedules'));
    const allSchedules = allSchedulesSnap.docs.map(d => d.data() as BarberSchedule);

    let chosenBarber: Barber | undefined;

    if (payload.barber_id && payload.barber_id !== 'any') {
      chosenBarber = activeBarbers.find(b => b.id === payload.barber_id);
      if (!chosenBarber) throw new Error('Barbeiro selecionado não está disponível.');

      // Verificar se este barbeiro já tem agendamento ativo neste horário
      const hasConflict = existingAppts.some(a => {
        if (a.barber_id !== chosenBarber!.id) return false;
        const aStart = timeToMinutes(a.start_time);
        const aEnd = timeToMinutes(a.end_time);
        return !(endMins <= aStart || startMins >= aEnd);
      });

      if (hasConflict) {
        throw new Error(`O horário das ${payload.start_time} com ${chosenBarber.nickname || chosenBarber.name} já foi reservado. Por favor, escolha outro horário disponível.`);
      }
    } else {
      // "Qualquer Barbeiro": encontrar um barbeiro ativo que esteja REALMENTE livre neste horário
      for (const b of activeBarbers) {
        const sched = allSchedules.find(s => s.barber_id === b.id && s.day_of_week === dayOfWeek);
        if (!sched || !sched.active) continue;

        const bStart = timeToMinutes(sched.start_time);
        const bEnd = timeToMinutes(sched.end_time);
        if (startMins < bStart || endMins > bEnd) continue;

        if (sched.break_start && sched.break_end) {
          const brkStart = timeToMinutes(sched.break_start);
          const brkEnd = timeToMinutes(sched.break_end);
          if (!(endMins <= brkStart || startMins >= brkEnd)) continue;
        }

        const isOff = allTimeOff.some(t => t.barber_id === b.id && t.full_day);
        if (isOff) continue;

        const partialOff = allTimeOff.find(t => t.barber_id === b.id && !t.full_day && t.start_time && t.end_time);
        if (partialOff) {
          const offStart = timeToMinutes(partialOff.start_time!);
          const offEnd = timeToMinutes(partialOff.end_time!);
          if (!(endMins <= offStart || startMins >= offEnd)) continue;
        }

        const hasConflict = existingAppts.some(a => {
          if (a.barber_id !== b.id) return false;
          const aStart = timeToMinutes(a.start_time);
          const aEnd = timeToMinutes(a.end_time);
          return !(endMins <= aStart || startMins >= aEnd);
        });

        if (!hasConflict) {
          chosenBarber = b;
          break;
        }
      }

      if (!chosenBarber) {
        throw new Error(`Nenhum barbeiro está disponível no horário das ${payload.start_time} nesta data. Por favor, selecione outro horário.`);
      }
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

export async function getCustomerAppointmentsFS(params: {
  phone?: string;
  codes?: string[];
}): Promise<Appointment[]> {
  await ensureFirestoreSeeded();
  const path = 'appointments';
  try {
    const snap = await getDocs(collection(db, path));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));

    const cleanQueryPhone = (params.phone || '').replace(/\D/g, '');
    const targetCodes = (params.codes || []).map(c => c.trim().toUpperCase()).filter(Boolean);

    if (!cleanQueryPhone && targetCodes.length === 0) {
      return [];
    }

    const matched = all.filter(a => {
      if (a.code && targetCodes.includes(a.code.toUpperCase())) return true;
      if (cleanQueryPhone && cleanQueryPhone.length >= 8 && a.customer_phone) {
        const aptPhone = a.customer_phone.replace(/\D/g, '');
        if (aptPhone === cleanQueryPhone) return true;
        if (aptPhone.endsWith(cleanQueryPhone) || cleanQueryPhone.endsWith(aptPhone)) return true;
      }
      return false;
    });

    const [services, barbers] = await Promise.all([
      getServicesFS(false),
      getBarbersFS(false),
    ]);

    const hydrated = matched.map(apt => {
      const service = services.find(s => s.id === apt.service_id);
      const barber = barbers.find(b => b.id === apt.barber_id);
      return { ...apt, service, barber };
    });

    hydrated.sort((a, b) => {
      const dateComp = (b.date || '').localeCompare(a.date || '');
      if (dateComp !== 0) return dateComp;
      return (b.start_time || '').localeCompare(a.start_time || '');
    });

    return hydrated;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
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

export function subscribeToAppointmentsFS(
  filters: { barberId?: string; date?: string; status?: string } | undefined,
  callback: (appointments: Appointment[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = 'appointments';
  try {
    const unsub = onSnapshot(
      collection(db, path),
      (snap) => {
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
        items.sort((a, b) => `${b.date} ${b.start_time}`.localeCompare(`${a.date} ${a.start_time}`));
        callback(items);
      },
      (error) => {
        console.warn('Firestore real-time subscription error:', error);
        if (onError) onError(error);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('Error starting Firestore onSnapshot:', err);
    if (onError) onError(err);
    return () => {};
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

export async function checkNeedsOwnerSetupFS(): Promise<boolean> {
  return false;
}

export async function setupInitialOwnerFS(_data?: any): Promise<{ user: UserProfile; token: string }> {
  throw new Error('O proprietário do sistema já possui conta configurada. Por favor, faça login com seu e-mail e senha.');
}

export const isKnownOwnerEmail = (e: string) => {
  const norm = (e || '').toLowerCase().trim();
  return (
    norm === 'rs3043017@gmail.com' ||
    norm === 'allinesoares050@gmail.com' ||
    norm === 'dono@liderbarbers.com.br' ||
    Boolean(defaultDbData.users?.some(u => u.role === 'owner' && u.email?.toLowerCase().trim() === norm))
  );
};

export async function loginFS(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const isOwner = isKnownOwnerEmail(normalizedEmail);

  try {
    // Authenticate securely via Firebase Authentication SDK
    const userCred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const uid = userCred.user.uid;
    const token = await userCred.user.getIdToken();

    // Fetch user profile from Firestore users collection
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data.active === false) {
        await signOut(auth);
        throw new Error('Esta conta de acesso foi desativada pela administração.');
      }
      if (isOwner && data.role !== 'owner') {
        await updateDoc(userDocRef, { role: 'owner' });
        data.role = 'owner';
      }
      return {
        user: { id: uid, ...data } as UserProfile,
        token,
      };
    }

    // Profile document does not exist yet in Firestore - provision it
    const newProfile: UserProfile = {
      id: uid,
      email: userCred.user.email || normalizedEmail,
      name: userCred.user.displayName || (isOwner ? (normalizedEmail === 'rs3043017@gmail.com' ? 'Rodrigo Dos Santos Souza' : 'Proprietário Líder Barbers') : 'Membro da Equipe'),
      role: isOwner ? 'owner' : 'admin',
      phone: '61985429584',
      active: true,
    };
    await setDoc(userDocRef, {
      ...newProfile,
      created_at: new Date().toISOString(),
    });

    return {
      user: newProfile,
      token,
    };
  } catch (error: any) {
    // If user not found in Firebase Auth, but email is a designated owner account, create/register in Firebase Auth
    if (
      isOwner &&
      (error.code === 'auth/user-not-found' ||
       error.code === 'auth/invalid-credential') &&
      password.length >= 6
    ) {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        const uid = newCred.user.uid;
        const token = await newCred.user.getIdToken();

        const ownerProfile: UserProfile = {
          id: uid,
          email: normalizedEmail,
          name: normalizedEmail === 'rs3043017@gmail.com' ? 'Rodrigo Dos Santos Souza' : 'Proprietário Líder Barbers',
          role: 'owner',
          phone: '61985429584',
          active: true,
        };

        await setDoc(doc(db, 'users', uid), {
          ...ownerProfile,
          created_at: new Date().toISOString(),
        });

        // Ensure settings know the owner email
        try {
          await updateDoc(doc(db, 'settings', 'main'), {
            owner_configured: true,
            owner_email: normalizedEmail,
          });
        } catch (e) {
          console.warn('Notice setting owner_email in settings:', e);
        }

        return {
          user: ownerProfile,
          token,
        };
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          throw new Error('Senha incorreta para esta conta de proprietário. Verifique a senha digitada.');
        }
        if (createErr.code === 'auth/weak-password') {
          throw new Error('A senha deve ter no mínimo 6 caracteres.');
        }
      }
    }

    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/invalid-email'
    ) {
      throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Muitas tentativas sem sucesso. Aguarde alguns instantes e tente novamente.');
    }
    throw error;
  }
}

export async function loginWithGoogleFS(): Promise<{ user: UserProfile; token: string }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const userCred = await signInWithPopup(auth, provider);
  const uid = userCred.user.uid;
  const normalizedEmail = (userCred.user.email || '').toLowerCase().trim();
  const token = await userCred.user.getIdToken();

  const userDocRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userDocRef);

  const isOwner = isKnownOwnerEmail(normalizedEmail);

  if (userSnap.exists()) {
    const data = userSnap.data();
    if (data.active === false) {
      await signOut(auth);
      throw new Error('Esta conta de acesso foi desativada pela administração.');
    }
    if (isOwner && data.role !== 'owner') {
      await updateDoc(userDocRef, { role: 'owner' });
      data.role = 'owner';
    }
    return {
      user: { id: uid, ...data, role: isOwner ? 'owner' : data.role } as UserProfile,
      token,
    };
  }

  const newProfile: UserProfile = {
    id: uid,
    email: normalizedEmail,
    name: userCred.user.displayName || (isOwner ? 'Proprietário Líder Barbers' : 'Membro da Equipe'),
    role: isOwner ? 'owner' : 'admin',
    phone: userCred.user.phoneNumber || '61985429584',
    active: true,
  };

  await setDoc(userDocRef, {
    ...newProfile,
    created_at: new Date().toISOString(),
  });

  return {
    user: newProfile,
    token,
  };
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

export async function getAdminMetricsFS(): Promise<any> {
  const appts = await getAppointmentsFS();
  const barbers = await getBarbersFS(true);

  const totalAppointments = appts.length;
  const confirmed = appts.filter(a => a.status === 'confirmed').length;
  const completed = appts.filter(a => a.status === 'completed').length;
  const noShow = appts.filter(a => a.status === 'no_show').length;
  const cancelled = appts.filter(a => a.status === 'cancelled').length;

  const totalForecastRevenue = appts
    .filter(a => a.status !== 'cancelled')
    .reduce((acc, curr) => acc + (curr.price || 0), 0);

  const totalRealizedRevenue = appts
    .filter(a => a.status === 'completed')
    .reduce((acc, curr) => acc + (curr.price || 0), 0);

  const barberMetrics = barbers.map(b => {
    const barberApts = appts.filter(a => a.barber_id === b.id && a.status !== 'cancelled');
    const revenue = barberApts.reduce((acc, curr) => acc + (curr.price || 0), 0);
    return {
      barber_id: b.id,
      name: b.name,
      nickname: b.nickname || b.name,
      total_appointments: barberApts.length,
      revenue,
    };
  });

  return {
    totalAppointments,
    confirmed,
    completed,
    noShow,
    cancelled,
    totalForecastRevenue,
    totalRealizedRevenue,
    barberMetrics,
    total_appointments: totalAppointments,
    completed_appointments: completed,
    gross_revenue: totalRealizedRevenue,
    active_barbers: barbers.filter(b => b.active).length,
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
  const normalizedEmail = data.email.trim().toLowerCase();
  const uid = await createAuthUserWithoutSwitching(normalizedEmail, data.password);
  const newAdmin = {
    id: uid,
    email: normalizedEmail,
    name: data.name.trim(),
    role: 'admin',
    phone: data.phone?.trim() || '',
    active: true,
    created_at: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', uid), newAdmin);
  return {
    id: uid,
    name: data.name,
    email: normalizedEmail,
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
  const { password: _pass, ...cleanData } = data;
  const updated = { ...cur, ...cleanData };
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
  const [bSnap, uSnap] = await Promise.all([
    getDocs(collection(db, 'barbers')),
    getDocs(collection(db, 'users'))
  ]);
  const barbers = bSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const users = uSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  return barbers.map(b => {
    const user = users.find(u => u.barber_id === b.id || u.id === b.id);
    const resolvedName = b.name || user?.name || 'Barbeiro';
    const resolvedNickname = b.nickname || user?.nickname || '';
    return {
      id: user ? user.id : b.id,
      user_id: user ? user.id : null,
      barber_id: b.id,
      name: resolvedName,
      barber_name: resolvedName,
      nickname: resolvedNickname,
      barber_nickname: resolvedNickname,
      photo_url: b.photo_url || user?.photo_url || '',
      email: user?.email || b.email || '',
      phone: user?.phone || b.phone || '',
      active: user ? (user.active !== false) : (b.active !== false),
      commission_rate: b.commission_rate !== undefined ? b.commission_rate : (user?.commission_rate ?? 50),
      has_account: !!user,
      has_login: !!user,
      created_at: user?.created_at || b.created_at || new Date().toISOString(),
    };
  });
}

export async function createBarberAccountFS(data: {
  barber_id: string;
  email: string;
  password: string;
  commission_rate: number;
  name?: string;
  phone?: string;
}): Promise<{ success: boolean; user: UserProfile; message: string }> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const uid = await createAuthUserWithoutSwitching(normalizedEmail, data.password);
  const newUser = {
    id: uid,
    email: normalizedEmail,
    name: data.name || 'Barbeiro',
    role: 'barber',
    barber_id: data.barber_id,
    commission_rate: data.commission_rate,
    phone: data.phone?.trim() || '',
    active: true,
    created_at: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', uid), newUser);

  // Update barber commission in barbers collection as well
  try {
    const bRef = doc(db, 'barbers', data.barber_id);
    await updateDoc(bRef, {
      commission_rate: data.commission_rate,
      has_login: true,
      login_email: normalizedEmail,
    });
  } catch (e) {
    console.warn('Barber profile update notice:', e);
  }

  return {
    success: true,
    user: newUser as UserProfile,
    message: 'Conta criada com sucesso no Firebase Auth!',
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
  const { password: _pass, ...cleanData } = data;
  const updated = { ...cur, ...cleanData };
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

  return {
    success: true,
    user: updated as UserProfile,
  };
}

export async function deleteBarberAccountFS(id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', id));
}
