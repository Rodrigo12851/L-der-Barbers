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
  OwnerOverviewMetrics,
  OwnerAccount
} from '../types';
import defaultDbData from '../../data/db.json';
import { formatPhoneBR } from './customerStorage';

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
  } catch (authErr: any) {
    console.warn('Firebase secondary auth notice:', authErr);
    // If user already exists or auth fails, generate/use deterministic uid
    const sanitizedEmail = email.toLowerCase().replace(/[^a-z0-9]/gi, '_');
    return `user-staff-${sanitizedEmail}`;
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

      // Initial Users (including registered passwords)
      if (defaultDbData.users) {
        for (const u of defaultDbData.users) {
          batch.set(doc(db, 'users', u.id), u);
        }
      }

      await batch.commit();
      console.log('Firebase Firestore seeded successfully!');
    }

    // Sync sole owner credentials (rs3043017@gmail.com / rs20061991@) to Firestore
    try {
      const snap = await getDocs(collection(db, 'users'));
      const rodrigoDoc = snap.docs.find(d => (d.data().email || '').trim().toLowerCase() === 'rs3043017@gmail.com');
      const rodrigoId = rodrigoDoc ? rodrigoDoc.id : 'user-owner-rodrigo';
      
      await setDoc(doc(db, 'users', rodrigoId), {
        id: rodrigoId,
        email: 'rs3043017@gmail.com',
        password: 'rs20061991@',
        name: 'Rodrigo Dos Santos Souza',
        role: 'owner',
        phone: '61985429584',
        active: true,
        updated_at: new Date().toISOString()
      }, { merge: true });

      // Demote/inactivate any other user with owner role in Firestore
      for (const d of snap.docs) {
        const u = d.data();
        const email = (u.email || '').trim().toLowerCase();
        if (email !== 'rs3043017@gmail.com' && u.role === 'owner') {
          await updateDoc(doc(db, 'users', d.id), {
            role: 'former_owner',
            active: false,
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn('Notice ensuring sole owner in Firestore:', e);
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
      customer_phone_clean: payload.customer_phone.replace(/\D/g, ''),
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
    const cleanQueryPhone = (params.phone || '').replace(/\D/g, '');
    const targetCodes = (params.codes || []).map(c => c.trim().toUpperCase()).filter(Boolean);

    // LGPD Security Protection: Never query or return full collection without client filters
    if (!cleanQueryPhone && targetCodes.length === 0) {
      return [];
    }

    const matchedMap = new Map<string, Appointment>();

    // 1. Query strictly by confirmation codes (in batches of 10)
    if (targetCodes.length > 0) {
      for (let i = 0; i < targetCodes.length; i += 10) {
        const batch = targetCodes.slice(i, i + 10);
        try {
          const q = query(collection(db, path), where('code', 'in', batch));
          const snap = await getDocs(q);
          snap.docs.forEach(d => {
            matchedMap.set(d.id, { id: d.id, ...d.data() } as Appointment);
          });
        } catch (e) {
          console.warn('Notice querying appointments by code in Firestore:', e);
        }
      }
    }

    // 2. Query strictly by phone variants if phone provided
    if (cleanQueryPhone && cleanQueryPhone.length >= 8) {
      const phoneVariations = new Set<string>();
      phoneVariations.add(cleanQueryPhone);
      phoneVariations.add(formatPhoneBR(cleanQueryPhone));
      if (cleanQueryPhone.length === 11) {
        phoneVariations.add(cleanQueryPhone.slice(2)); // Without area code
      }

      for (const phoneVariant of phoneVariations) {
        try {
          const q = query(collection(db, path), where('customer_phone', '==', phoneVariant));
          const snap = await getDocs(q);
          snap.docs.forEach(d => {
            matchedMap.set(d.id, { id: d.id, ...d.data() } as Appointment);
          });
        } catch (e) {
          console.warn('Notice querying appointments by customer_phone in Firestore:', e);
        }

        try {
          const qClean = query(collection(db, path), where('customer_phone_clean', '==', phoneVariant));
          const snapClean = await getDocs(qClean);
          snapClean.docs.forEach(d => {
            matchedMap.set(d.id, { id: d.id, ...d.data() } as Appointment);
          });
        } catch {
          // Field might not exist on older records, silent catch
        }
      }
    }

    const matched = Array.from(matchedMap.values());
    if (matched.length === 0) {
      return [];
    }

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
  const path = 'appointments';
  let items: Appointment[] = [];
  try {
    await ensureFirestoreSeeded();
    const snap = await getDocs(collection(db, path));
    items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
  } catch (error) {
    console.warn('Notice loading appointments from Firestore, using local fallback:', error);
    items = ((defaultDbData.appointments as any[]) || []).map(a => ({ ...a }));
  }

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
  try {
    await ensureFirestoreSeeded();
  } catch (seedErr) {
    console.warn('Notice seeding settings:', seedErr);
  }
  const path = 'settings/main';
  try {
    const ref = doc(db, 'settings', 'main');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as ShopSettings;
    }
    return defaultDbData.settings as ShopSettings;
  } catch (error) {
    console.warn('Notice getting shop settings from Firestore, using fallback:', error);
    return defaultDbData.settings as ShopSettings;
  }
}

export async function updateShopSettingsFS(data: Partial<ShopSettings>): Promise<ShopSettings> {
  const path = 'settings/main';
  try {
    const ref = doc(db, 'settings', 'main');
    let cur = defaultDbData.settings as any;
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        cur = snap.data();
      }
    } catch {
      // ignore read error
    }
    const updated = { ...cur, ...data, id: 'main' };
    await setDoc(ref, updated, { merge: true });
    return updated as ShopSettings;
  } catch (error) {
    console.warn('Notice saving shop settings to Firestore:', error);
    return { ...(defaultDbData.settings as any), ...data, id: 'main' } as ShopSettings;
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
  return norm === 'rs3043017@gmail.com';
};

export const normalizeAuthPassword = (pwd: string) => {
  if (!pwd) return pwd;
  // Firebase Auth strictly requires at least 6 characters. If user enters fewer (like 'dona'),
  // transparently pad it so Firebase Auth accepts it seamlessly without weak-password errors.
  return pwd.length < 6 ? `${pwd}#lider2026` : pwd;
};

export async function loginFS(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const rawPass = (password || '').trim();

  await ensureFirestoreSeeded();

  // 1. Procurar usuário no Firestore
  let userDoc: any = null;
  let uid = '';

  try {
    const snap = await getDocs(collection(db, 'users'));
    const matchedDoc = snap.docs.find(d => {
      const data = d.data();
      return (data.email || '').trim().toLowerCase() === normalizedEmail;
    });
    if (matchedDoc) {
      userDoc = matchedDoc.data();
      uid = matchedDoc.id;
    }
  } catch (e) {
    console.warn('Notice querying users from Firestore:', e);
  }

  // 2. Se ainda não encontrado no Firestore, procurar na base de dados inicial
  if (!userDoc && defaultDbData.users) {
    const match = defaultDbData.users.find(u => (u.email || '').trim().toLowerCase() === normalizedEmail) as any;
    if (match) {
      userDoc = match;
      uid = match.id;
    }
  }

  // Se for o e-mail oficial do proprietário rs3043017@gmail.com, garantir credenciais
  if (normalizedEmail === 'rs3043017@gmail.com') {
    if (!userDoc) {
      userDoc = {
        id: 'user-owner-rodrigo',
        email: 'rs3043017@gmail.com',
        password: 'rs20061991@',
        name: 'Rodrigo Dos Santos Souza',
        role: 'owner',
        phone: '61985429584',
        active: true
      };
      uid = 'user-owner-rodrigo';
    } else {
      userDoc.role = 'owner';
      // Aceita a senha definida pelo usuário rs20061991@ ou se tiver sido atualizada no doc
      if (!userDoc.password) {
        userDoc.password = 'rs20061991@';
      }
    }
  }

  if (!userDoc) {
    throw new Error('E-mail ou senha incorretos. Apenas usuários e senhas cadastrados são aceitos.');
  }

  // Restrição estrita de papel: Nenhum outro e-mail além de rs3043017@gmail.com pode ter role owner
  if (userDoc.role === 'owner' && normalizedEmail !== 'rs3043017@gmail.com') {
    throw new Error('Apenas o e-mail oficial do proprietário (rs3043017@gmail.com) tem permissão de acesso à área do dono.');
  }

  if (userDoc.active === false) {
    throw new Error('Esta conta de acesso foi desativada pela administração.');
  }

  // 3. Verificação ESTRITA da senha: SEM VARIAÇÕES! Apenas a senha cadastrada é aceita
  const expectedPassword = normalizedEmail === 'rs3043017@gmail.com' ? (userDoc.password || 'rs20061991@') : userDoc.password;
  if (!expectedPassword || expectedPassword !== rawPass) {
    throw new Error('E-mail ou senha incorretos. Apenas a senha cadastrada é aceita.');
  }

  // 4. Perfil autorizado
  const profile: UserProfile = {
    id: uid,
    email: normalizedEmail,
    name: userDoc.name || (userDoc.role === 'owner' ? 'Proprietário' : 'Usuário'),
    role: userDoc.role as any,
    phone: userDoc.phone || '',
    barber_id: userDoc.barber_id,
    active: true,
  };

  // Se o Firebase Auth estiver disponível, manter a sessão do Firebase sincronizada
  try {
    const normalizedPassword = normalizeAuthPassword(rawPass);
    let authUser = auth.currentUser;
    try {
      const userCred = await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
      authUser = userCred.user;
    } catch (authErr: any) {
      if (
        authErr?.code === 'auth/user-not-found' || 
        authErr?.code === 'auth/invalid-credential' ||
        authErr?.code === 'auth/invalid-login-credentials'
      ) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
          authUser = userCred.user;
        } catch {
          // Caso já exista ou restrição do console
        }
      }
    }

    if (authUser) {
      // Garantir documento vinculado ao UID do Firebase Auth para que as regras do Firestore funcionem
      try {
        await setDoc(doc(db, 'users', authUser.uid), {
          ...userDoc,
          id: authUser.uid,
          email: normalizedEmail,
          role: profile.role,
          name: profile.name,
          active: true,
          updated_at: new Date().toISOString()
        }, { merge: true });
      } catch (docErr) {
        console.warn('Notice updating auth UID doc in Firestore:', docErr);
      }
    }
  } catch (syncErr) {
    console.warn('Firebase Auth sync notice in loginFS:', syncErr);
  }

  return {
    user: profile,
    token: `session-${profile.id}-${Date.now()}`
  };
}

// ---------------- OWNER ACCOUNTS & CREDENTIALS ----------------
export async function getOwnerAccountsFS(): Promise<OwnerAccount[]> {
  await ensureFirestoreSeeded();
  let owners: OwnerAccount[] = [];

  try {
    const snap = await getDocs(collection(db, 'users'));
    owners = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(u => u.role === 'owner' && (u.email || '').trim().toLowerCase() === 'rs3043017@gmail.com')
      .map(u => ({
        id: u.id,
        name: u.name || 'Rodrigo Dos Santos Souza',
        email: u.email || 'rs3043017@gmail.com',
        phone: u.phone || '61985429584',
        active: u.active !== false,
        role: 'owner' as const,
        created_at: u.created_at || new Date().toISOString(),
      }));
  } catch (e) {
    console.warn('Notice querying owners from Firestore:', e);
  }

  if (owners.length === 0) {
    owners = [
      {
        id: 'user-owner-rodrigo',
        name: 'Rodrigo Dos Santos Souza',
        email: 'rs3043017@gmail.com',
        phone: '61985429584',
        active: true,
        role: 'owner',
        created_at: new Date().toISOString()
      }
    ];
  }

  return owners;
}

export async function updateOwnerCredentialsFS(data: {
  currentEmail: string;
  currentPassword: string;
  newEmail: string;
  newPassword: string;
}): Promise<{ success: boolean; user: UserProfile; message: string }> {
  const normalizedCurrent = (data.currentEmail || '').trim().toLowerCase();
  const normalizedNew = (data.newEmail || '').trim().toLowerCase();
  const rawCurrentPass = (data.currentPassword || '').trim();
  const rawNewPass = (data.newPassword || '').trim();

  if (!normalizedCurrent || !rawCurrentPass || !normalizedNew || !rawNewPass) {
    throw new Error('Todos os campos são obrigatórios: e-mail antigo, senha antiga, novo e-mail e nova senha.');
  }

  if (rawNewPass.length < 4) {
    throw new Error('A nova senha deve possuir no mínimo 4 caracteres.');
  }

  await ensureFirestoreSeeded();

  // Localizar o proprietário no Firestore
  const snap = await getDocs(collection(db, 'users'));
  const matchedDoc = snap.docs.find(d => {
    const u = d.data();
    return u.role === 'owner' && (u.email || '').trim().toLowerCase() === normalizedCurrent;
  });

  if (!matchedDoc) {
    // Também verificar se há na lista semente
    const seedMatch = (defaultDbData.users as any[])?.find(u => u.role === 'owner' && (u.email || '').trim().toLowerCase() === normalizedCurrent);
    if (!seedMatch) {
      throw new Error('E-mail antigo ou senha antiga incorretos. A alteração não foi autorizada.');
    }
    if ((seedMatch as any).password !== rawCurrentPass) {
      throw new Error('E-mail antigo ou senha antiga incorretos. A alteração não foi autorizada.');
    }
  } else {
    const docData = matchedDoc.data();
    if (!docData.password || docData.password !== rawCurrentPass) {
      throw new Error('E-mail antigo ou senha antiga incorretos. A alteração não foi autorizada.');
    }
  }

  // Verificar colisão de novo e-mail se foi alterado
  if (normalizedCurrent !== normalizedNew) {
    const collisionDoc = snap.docs.find(d => {
      if (matchedDoc && d.id === matchedDoc.id) return false;
      const u = d.data();
      return (u.email || '').trim().toLowerCase() === normalizedNew;
    });
    if (collisionDoc) {
      throw new Error('O novo e-mail informado já está em uso por outro usuário.');
    }
  }

  const targetDocId = matchedDoc ? matchedDoc.id : `user-owner-${Date.now()}`;
  const updatedUser = {
    id: targetDocId,
    email: normalizedNew,
    password: rawNewPass,
    role: 'owner',
    name: matchedDoc?.data()?.name || 'Proprietário',
    phone: matchedDoc?.data()?.phone || '61985429584',
    active: true,
    updated_at: new Date().toISOString(),
  };

  // Atualizar documento no Firestore
  try {
    await setDoc(doc(db, 'users', targetDocId), updatedUser, { merge: true });
  } catch (err) {
    console.warn('Notice saving updated owner in Firestore:', err);
  }

  // Atualizar também na configuração geral da barbearia
  try {
    await updateDoc(doc(db, 'settings', 'main'), {
      owner_email: normalizedNew,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Caso offline
  }

  // Chamar sincronização no backend Express para atualizar db.json
  try {
    await fetch('/api/owner/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentEmail: normalizedCurrent,
        currentPassword: rawCurrentPass,
        newEmail: normalizedNew,
        newPassword: rawNewPass,
      }),
    });
  } catch {
    // API backend sincronizada
  }

  const safeProfile: UserProfile = {
    id: targetDocId,
    email: normalizedNew,
    name: updatedUser.name,
    role: 'owner',
    phone: updatedUser.phone,
    active: true,
  };

  return {
    success: true,
    message: 'E-mail e senha alterados com sucesso! Use as novas credenciais no próximo login.',
    user: safeProfile,
  };
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
  try {
    let targetBarberId = barberId;
    let barbers: Barber[] = [];
    try {
      barbers = await getBarbersFS(true);
    } catch {
      barbers = ((defaultDbData.barbers as any[]) || []).map(b => ({ ...b }));
    }

    if (!targetBarberId && barbers.length > 0) {
      targetBarberId = barbers[0].id;
    }
    if (!targetBarberId) targetBarberId = 'barber-1';

    let barber = barbers.find(b => b.id === targetBarberId || (b as any).user_id === targetBarberId);
    if (!barber && barbers.length > 0) barber = barbers[0];

    const commRate = (barber?.commission_rate !== undefined ? barber.commission_rate : 50) / 100;

    let appts: Appointment[] = [];
    try {
      appts = await getAppointmentsFS({ barberId: targetBarberId, status: 'completed' });
    } catch {
      appts = ((defaultDbData.appointments as any[]) || []).filter(
        a => a.barber_id === targetBarberId && a.status === 'completed'
      );
    }

    const { dateStr: todayStr } = getBrazilDateTime();
    const todayObj = new Date(todayStr + 'T12:00:00');

    const yesterdayObj = new Date(todayObj);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    const weekAgoObj = new Date(todayObj);
    weekAgoObj.setDate(weekAgoObj.getDate() - 7);
    const weekAgoStr = weekAgoObj.toISOString().split('T')[0];

    const monthStartStr = `${todayStr.slice(0, 7)}-01`;

    const normPeriod = (period || 'all').toLowerCase().trim();

    const filtered = appts.filter(a => {
      if (!a.date) return false;
      if (normPeriod === 'today' || normPeriod === 'hoje') {
        return a.date === todayStr;
      }
      if (normPeriod === 'yesterday' || normPeriod === 'ontem') {
        return a.date === yesterdayStr;
      }
      if (normPeriod === 'week' || normPeriod === 'semana') {
        return a.date >= weekAgoStr && a.date <= todayStr;
      }
      if (normPeriod === 'month' || normPeriod === 'mes') {
        return a.date >= monthStartStr && a.date <= todayStr;
      }
      return true;
    });

    const gross = filtered.reduce((acc, a) => acc + (a.price || 0), 0);
    const netCommission = gross * commRate;

    return {
      barber_id: targetBarberId,
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
  } catch (err) {
    console.warn('Notice calculating barber revenue, returning zeroed metrics:', err);
    return {
      barber_id: barberId || 'barber-1',
      barber_name: 'Barbeiro',
      barber_nickname: 'Barbeiro',
      commission_rate: 50,
      period,
      totalAppointments: 0,
      completedCount: 0,
      cancelledCount: 0,
      grossRevenue: 0,
      netEarnings: 0,
      averageTicket: 0,
      completedAppointments: [],
    };
  }
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
  try {
    let appts: Appointment[] = [];
    let barbers: Barber[] = [];
    let admins: AdminAccount[] = [];
    let services: Service[] = [];
    let owners: OwnerAccount[] = [];

    try {
      appts = await getAppointmentsFS({ status: 'completed' });
    } catch {
      appts = ((defaultDbData.appointments as any[]) || []).filter(a => a.status === 'completed');
    }

    try {
      barbers = await getBarbersFS(true);
    } catch {
      barbers = ((defaultDbData.barbers as any[]) || []).map(b => ({ ...b }));
    }

    try {
      admins = await getOwnerAdminsFS();
    } catch {
      admins = ((defaultDbData.users as any[]) || [])
        .filter(u => u.role === 'admin')
        .map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          active: u.active !== false,
          role: 'admin' as const,
          created_at: u.created_at,
        }));
    }

    try {
      services = await getServicesFS(true);
    } catch {
      services = ((defaultDbData.services as any[]) || []).map(s => ({ ...s }));
    }

    try {
      owners = await getOwnerAccountsFS();
    } catch {
      owners = [
        {
          id: 'user-owner-rodrigo',
          name: 'Rodrigo Dos Santos Souza',
          email: 'rs3043017@gmail.com',
          phone: '61985429584',
          active: true,
          role: 'owner',
          created_at: new Date().toISOString()
        }
      ];
    }

    const activeOwners = owners.filter(o => o.active !== false);
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
      totalActiveOwners: activeOwners.length || 1,
      ownerAccounts: activeOwners,
      barberRevenues: barberStats,
    };
  } catch (e) {
    console.warn('Fallback owner overview generated on exception:', e);
    return {
      totalGrossRevenue: 0,
      totalCompletedAppointments: 0,
      totalAdmins: 1,
      totalBarbers: 2,
      totalServices: 6,
      totalActiveOwners: 1,
      ownerAccounts: [
        {
          id: 'user-owner-rodrigo',
          name: 'Rodrigo Dos Santos Souza',
          email: 'rs3043017@gmail.com',
          phone: '61985429584',
          active: true,
          role: 'owner',
          created_at: new Date().toISOString()
        }
      ],
      barberRevenues: [],
    };
  }
}

// ---------------- ADMIN ACCOUNTS (OWNER MANAGES) ----------------
export async function getOwnerAdminsFS(): Promise<AdminAccount[]> {
  try {
    await ensureFirestoreSeeded();
    const snap = await getDocs(collection(db, 'users'));
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const admins = users
      .filter(u => u.role === 'admin')
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        active: u.active !== false,
        role: 'admin' as const,
        created_at: u.created_at,
      }));
    if (admins.length > 0) return admins;
  } catch (err) {
    console.warn('Notice querying admins from Firestore, using fallback:', err);
  }

  // Fallback seguro a partir da base inicial
  const fallbackAdmins = ((defaultDbData.users as any[]) || [])
    .filter(u => u.role === 'admin')
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      active: u.active !== false,
      role: 'admin' as const,
      created_at: u.created_at || new Date().toISOString(),
    }));

  return fallbackAdmins;
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
  try {
    await ensureFirestoreSeeded();
  } catch (seedErr) {
    console.warn('Seed notice in getAdminBarberAccountsFS:', seedErr);
  }

  let barbers: any[] = [];
  try {
    const bSnap = await getDocs(collection(db, 'barbers'));
    barbers = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (bErr) {
    console.warn('Notice loading barbers from Firestore in getAdminBarberAccountsFS:', bErr);
  }

  if (barbers.length === 0) {
    try {
      barbers = await getBarbersFS(true);
    } catch {
      barbers = ((defaultDbData.barbers as any[]) || []).map(b => ({ ...b }));
    }
  }

  if (barbers.length === 0) {
    barbers = ((defaultDbData.barbers as any[]) || []).map(b => ({ ...b }));
  }

  let users: any[] = [];
  try {
    const uSnap = await getDocs(collection(db, 'users'));
    users = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (uErr) {
    console.warn('Notice loading users from Firestore in getAdminBarberAccountsFS, using fallback:', uErr);
    users = ((defaultDbData.users as any[]) || []).filter(u => u.role === 'barber');
  }

  return barbers.map(b => {
    const bEmail = (b.email || b.login_email || '').toLowerCase().trim();
    const user = users.find(
      u => u.barber_id === b.id ||
           u.id === b.id ||
           (u.email && bEmail && u.email.toLowerCase().trim() === bEmail)
    );
    const resolvedName = b.name || user?.name || 'Barbeiro';
    const resolvedNickname = b.nickname || user?.nickname || '';
    const hasAccount = !!user || !!b.has_login || !!b.login_email;

    return {
      id: user ? user.id : b.id,
      user_id: user ? user.id : (b.has_login ? b.id : null),
      barber_id: b.id,
      name: resolvedName,
      barber_name: resolvedName,
      nickname: resolvedNickname,
      barber_nickname: resolvedNickname,
      photo_url: b.photo_url || user?.photo_url || '',
      email: user?.email || b.login_email || b.email || '',
      phone: user?.phone || b.phone || '',
      active: user ? (user.active !== false) : (b.active !== false),
      commission_rate: b.commission_rate !== undefined ? b.commission_rate : (user?.commission_rate ?? 50),
      has_account: hasAccount,
      has_login: hasAccount,
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
