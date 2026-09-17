import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// In-memory / persistent database
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  settings?: {
    name: string;
    tagline: string;
    logo_url: string;
    hero_image_url: string;
    phone: string;
    address: string;
  };
  services: any[];
  barbers: any[];
  barber_schedules: any[];
  barber_time_off: any[];
  appointments: any[];
  users: any[];
}

const defaultData: DatabaseSchema = {
  settings: {
    name: 'Líder Barbers',
    tagline: 'Barbearia Clássica & Moderna',
    logo_url: '',
    hero_image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
    phone: '(11) 98765-4321',
    address: 'Av. Paulista, 1000 — São Paulo, SP'
  },
  services: [
    {
      id: 'combo-liberdade',
      name: 'Combo Liberdade (Corte + Barba)',
      description: 'Nosso atendimento assinatura: Corte degradê ou tesoura + Barboterapia completa com toalha quente, massagem facial e finalização com pomada premium.',
      price: 100,
      duration_minutes: 75,
      icon_name: 'crown',
      category: 'combo',
      active: true
    },
    {
      id: 'degrade-navalhado',
      name: 'Degradê Navalhado (Fade)',
      description: 'Fade com transição milimétrica impecável (Skin fade, Mid, Low ou Taper), lavado com shampoo mentolado e finalizado na navalha.',
      price: 65,
      duration_minutes: 45,
      icon_name: 'scissors',
      category: 'cabelo',
      active: true
    },
    {
      id: 'corte-tradicional',
      name: 'Corte Tradicional / Tesoura',
      description: 'Corte clássico feito prioritariamente na tesoura, respeitando o caimento natural do fio e o formato craniano.',
      price: 55,
      duration_minutes: 35,
      icon_name: 'scissors',
      category: 'cabelo',
      active: true
    },
    {
      id: 'barba-terapia',
      name: 'Barboterapia com Toalha Quente',
      description: 'Abertura de poros com toalha quente aromatizada, óleos essenciais, desenho preciso na lâmina descartável e hidratação com bálsamo pós-barba.',
      price: 50,
      duration_minutes: 40,
      icon_name: 'razor',
      category: 'barba',
      active: true
    },
    {
      id: 'acabamento-pezinho',
      name: 'Acabamento, Pezinho & Sobrancelha',
      description: 'Alinhamento dos contornos da nuca, costeletas e sobrancelhas com lâmina e navalhete afiado.',
      price: 30,
      duration_minutes: 20,
      icon_name: 'ruler',
      category: 'tratamento',
      active: true
    },
    {
      id: 'corte-infantil',
      name: 'Corte Infantil Estilizado',
      description: 'Atendimento especial e paciente para os pequenos cavaleiros, com brinquedos e finalização descolada.',
      price: 45,
      duration_minutes: 30,
      icon_name: 'star',
      category: 'cabelo',
      active: true
    },
    {
      id: 'platinado-nevou',
      name: 'Nevou / Descoloração Global',
      description: 'Descoloração segura com proteção capilar e tonalização em tom platinado ou gelo.',
      price: 140,
      duration_minutes: 90,
      icon_name: 'sparkles',
      category: 'tratamento',
      active: true
    }
  ],
  barbers: [
    {
      id: 'barber-1',
      name: 'Marcos Valente',
      nickname: 'Mestre Valente',
      bio: 'Mais de 12 anos de bancada. Mestre em cortes clássicos na tesoura, visagismo e consultoria de estilo masculino.',
      photo_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80',
      specialties: ['Cortes Clássicos', 'Tesoura', 'Visagismo Masculino', 'Tratamentos'],
      active: true,
      phone: '(11) 98765-4321',
      email: 'marcos@liberdade.com.br',
      rating: 4.98,
      reviews_count: 240
    },
    {
      id: 'barber-2',
      name: 'Diego Castro',
      nickname: 'Diego Navalha',
      bio: 'Especialista em fades cirúrgicos, freestyles e transições modernas. Referência em barba desenhada e alta precisão.',
      photo_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
      specialties: ['Skin Fade', 'Degradê Navalhado', 'Barba Esculpida', 'Freestyle'],
      active: true,
      phone: '(11) 97654-3210',
      email: 'diego@liberdade.com.br',
      rating: 4.95,
      reviews_count: 195
    },
    {
      id: 'barber-3',
      name: 'André Santana',
      nickname: 'André Santana',
      bio: 'Especialista em barboterapia tradicional, relaxamento com toalhas quentes e tratamentos para barba lenhador.',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      specialties: ['Barboterapia', 'Barba Lenhador', 'Coloração & Nevou', 'Alinhamento'],
      active: true,
      phone: '(11) 96543-2109',
      email: 'andre@liberdade.com.br',
      rating: 4.92,
      reviews_count: 160
    }
  ],
  barber_schedules: [],
  barber_time_off: [
    {
      id: 'off-1',
      barber_id: 'barber-1',
      date: '2026-09-25',
      reason: 'Congresso Nacional de Barbeiros',
      full_day: true
    }
  ],
  appointments: [],
  users: [
    {
      id: 'user-owner',
      email: 'dono@liderbarbers.com.br',
      password: 'dono',
      name: 'Proprietário Geral',
      role: 'owner',
      phone: '(11) 99999-0000',
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'user-admin',
      email: 'admin@liderbarbers.com.br',
      password: 'admin',
      name: 'Gerente da Barbearia',
      role: 'admin',
      phone: '(11) 98765-4321',
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'user-marcos',
      email: 'marcos@liberdade.com.br',
      password: 'barber',
      name: 'Marcos Valente',
      role: 'barber',
      barber_id: 'barber-1',
      commission_rate: 50,
      phone: '(11) 98765-4321',
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'user-diego',
      email: 'diego@liberdade.com.br',
      password: 'barber',
      name: 'Diego Castro',
      role: 'barber',
      barber_id: 'barber-2',
      commission_rate: 50,
      phone: '(11) 97654-3210',
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'user-andre',
      email: 'andre@liberdade.com.br',
      password: 'barber',
      name: 'André Santana',
      role: 'barber',
      barber_id: 'barber-3',
      commission_rate: 50,
      phone: '(11) 96543-2109',
      active: true,
      created_at: new Date().toISOString()
    }
  ]
};

// Generate default schedules for Monday-Saturday (1 to 6)
['barber-1', 'barber-2', 'barber-3'].forEach(bId => {
  for (let day = 0; day <= 6; day++) {
    const isSunday = day === 0;
    defaultData.barber_schedules.push({
      id: `sched-${bId}-${day}`,
      barber_id: bId,
      day_of_week: day,
      start_time: isSunday ? '00:00' : (day === 6 ? '08:30' : '09:00'),
      end_time: isSunday ? '00:00' : (day === 6 ? '19:00' : '20:00'),
      break_start: '12:30',
      break_end: '13:30',
      active: !isSunday
    });
  }
});

// Helper for today's date formatted YYYY-MM-DD
function getTodayString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// Pre-seed some realistic appointments
const todayStr = getTodayString(0);
const tomorrowStr = getTodayString(1);

defaultData.appointments = [
  {
    id: 'apt-1',
    code: 'LIB-4091',
    service_id: 'combo-liberdade',
    barber_id: 'barber-1',
    customer_name: 'Rodrigo Medeiros',
    customer_phone: '(11) 98111-2233',
    customer_email: 'rodrigo.m@email.com',
    notes: 'Degradê na 0.5 e barba desenhada rente.',
    date: todayStr,
    start_time: '10:00',
    end_time: '11:15',
    price: 100,
    status: 'completed',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'apt-2',
    code: 'LIB-5122',
    service_id: 'degrade-navalhado',
    barber_id: 'barber-2',
    customer_name: 'Gabriel Alencar',
    customer_phone: '(11) 97222-3344',
    customer_email: 'gabriel.alencar@email.com',
    notes: 'Low fade com risquinho lateral.',
    date: todayStr,
    start_time: '14:30',
    end_time: '15:15',
    price: 65,
    status: 'confirmed',
    created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: 'apt-3',
    code: 'LIB-6304',
    service_id: 'barba-terapia',
    barber_id: 'barber-3',
    customer_name: 'Carlos Eduardo',
    customer_phone: '(11) 96333-4455',
    customer_email: 'cadu.barba@email.com',
    notes: 'Pele sensível.',
    date: todayStr,
    start_time: '16:00',
    end_time: '16:40',
    price: 50,
    status: 'confirmed',
    created_at: new Date(Date.now() - 20000000).toISOString()
  },
  {
    id: 'apt-4',
    code: 'LIB-7719',
    service_id: 'corte-tradicional',
    barber_id: 'barber-1',
    customer_name: 'Felipe Santana',
    customer_phone: '(11) 95444-5566',
    customer_email: 'felipe.s@email.com',
    date: tomorrowStr,
    start_time: '11:00',
    end_time: '11:35',
    price: 55,
    status: 'confirmed',
    created_at: new Date().toISOString()
  },
  {
    id: 'apt-5',
    code: 'LIB-8945',
    service_id: 'combo-liberdade',
    barber_id: 'barber-2',
    customer_name: 'Lucas Brandão',
    customer_phone: '(11) 94555-6677',
    customer_email: 'lucas.brandao@email.com',
    date: tomorrowStr,
    start_time: '15:00',
    end_time: '16:15',
    price: 100,
    status: 'confirmed',
    created_at: new Date().toISOString()
  }
];

let db: DatabaseSchema = JSON.parse(JSON.stringify(defaultData));

function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      if (!db.settings) {
        db.settings = {
          name: 'Líder Barbers',
          tagline: 'Barbearia Clássica & Moderna',
          logo_url: '',
          hero_image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
          phone: '(11) 98765-4321',
          address: 'Av. Paulista, 1000 — São Paulo, SP'
        };
      }
      // Ensure owner user exists
      if (!db.users) db.users = [];
      const hasOwner = db.users.some(u => u.role === 'owner');
      if (!hasOwner) {
        db.users.unshift({
          id: 'user-owner',
          email: 'dono@liderbarbers.com.br',
          password: 'dono',
          name: 'Proprietário Geral',
          role: 'owner',
          phone: '(11) 99999-0000',
          active: true,
          created_at: new Date().toISOString()
        });
      }
      // Ensure admin exists
      const hasAdmin = db.users.some(u => u.role === 'admin');
      if (!hasAdmin) {
        db.users.push({
          id: 'user-admin',
          email: 'admin@liderbarbers.com.br',
          password: 'admin',
          name: 'Gerente da Barbearia',
          role: 'admin',
          barber_id: 'user-admin',
          phone: '(11) 98765-4321',
          active: true,
          created_at: new Date().toISOString()
        });
      }

      // Ensure every Admin user automatically has a Barber profile in db.barbers & schedules
      if (!db.barbers) db.barbers = [];
      if (!db.barber_schedules) db.barber_schedules = [];

      db.users.filter(u => u.role === 'admin').forEach(adminUser => {
        const barberId = adminUser.barber_id || adminUser.id;
        adminUser.barber_id = barberId;
        let adminBarber = db.barbers.find(b => b.id === barberId || b.id === adminUser.id || (b as any).user_id === adminUser.id);
        if (!adminBarber) {
          adminBarber = {
            id: barberId,
            name: adminUser.name,
            nickname: `${adminUser.name} (Admin)`,
            bio: 'Administrador & Barbeiro Especialista',
            photo_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80',
            specialties: ['Cortes Clássicos', 'Visagismo', 'Barboterapia', 'Degradê'],
            active: adminUser.active !== false,
            phone: adminUser.phone || '',
            email: adminUser.email || '',
            commission_rate: 100,
            rating: 5.0,
            reviews_count: 48
          };
          db.barbers.unshift(adminBarber);
        } else {
          adminBarber.name = adminUser.name;
          adminBarber.email = adminUser.email;
          if (adminUser.phone) adminBarber.phone = adminUser.phone;
          adminBarber.active = adminUser.active !== false;
        }

        // Ensure schedule exists for this admin barber
        for (let day = 0; day <= 6; day++) {
          const hasSched = db.barber_schedules.some(s => (s.barber_id === barberId || s.barber_id === adminUser.id) && s.day_of_week === day);
          if (!hasSched) {
            const isSunday = day === 0;
            db.barber_schedules.push({
              id: `sched-${barberId}-${day}`,
              barber_id: barberId,
              day_of_week: day,
              start_time: isSunday ? '00:00' : (day === 6 ? '08:30' : '09:00'),
              end_time: isSunday ? '00:00' : (day === 6 ? '19:00' : '20:00'),
              break_start: '12:30',
              break_end: '13:30',
              active: !isSunday
            });
          }
        }
      });

      // Ensure barbers commission rate
      if (db.barbers) {
        db.barbers.forEach(b => {
          if (!b.commission_rate) b.commission_rate = 50;
        });
      }
      saveDb();
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('Error loading db, using in-memory default:', err);
  }
}

function saveDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db:', err);
  }
}

loadDb();

// Helper time converters
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// Generate slot times for a given day, barber, and service
function calculateAvailableSlots(barberId: string, serviceDuration: number, dateStr: string) {
  // Parse day of week from dateStr (YYYY-MM-DD)
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const dayOfWeek = targetDate.getDay(); // 0 = Domingo, 1 = Segunda, ...

  // Resolve actual barberId (in case admin user id or alias was passed)
  const foundBarber = db.barbers.find(b => b.id === barberId || (b as any).user_id === barberId) ||
                      db.barbers.find(b => {
                        const u = db.users.find(usr => usr.id === barberId && usr.role === 'admin');
                        return u && (b.id === u.barber_id || b.id === u.id);
                      });
  const bId = foundBarber ? foundBarber.id : barberId;

  // Find schedule
  const sched = db.barber_schedules.find(
    s => (s.barber_id === bId || s.barber_id === barberId) && s.day_of_week === dayOfWeek && s.active
  );
  if (!sched) return [];

  // Check if barber has full day time off on this date
  const isOff = db.barber_time_off.some(
    o => (o.barber_id === bId || o.barber_id === barberId) && o.date === dateStr && o.full_day
  );
  if (isOff) return [];

  const partialOffs = db.barber_time_off.filter(
    o => (o.barber_id === bId || o.barber_id === barberId) && o.date === dateStr && !o.full_day
  );

  // Existing active appointments
  const activeAppointments = db.appointments.filter(
    a => (a.barber_id === bId || a.barber_id === barberId) && a.date === dateStr && a.status !== 'cancelled'
  );

  const startMins = timeToMinutes(sched.start_time);
  const endMins = timeToMinutes(sched.end_time);
  const breakStartMins = sched.break_start ? timeToMinutes(sched.break_start) : -1;
  const breakEndMins = sched.break_end ? timeToMinutes(sched.break_end) : -1;

  const step = 30; // 30 minute grid
  const slots: string[] = [];

  // If date is today, check current time to exclude past hours
  const now = new Date();
  const isToday = now.toISOString().split('T')[0] === dateStr;
  const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

  for (let slot = startMins; slot + serviceDuration <= endMins; slot += step) {
    const slotEnd = slot + serviceDuration;

    // Past time check (today)
    if (isToday && slot <= currentMinutes + 15) {
      continue;
    }

    // Break time check
    if (breakStartMins !== -1 && breakEndMins !== -1) {
      if (slot < breakEndMins && slotEnd > breakStartMins) {
        continue;
      }
    }

    // Partial time off check
    let overlapsOff = false;
    for (const off of partialOffs) {
      if (off.start_time && off.end_time) {
        const offStart = timeToMinutes(off.start_time);
        const offEnd = timeToMinutes(off.end_time);
        if (slot < offEnd && slotEnd > offStart) {
          overlapsOff = true;
          break;
        }
      }
    }
    if (overlapsOff) continue;

    // Existing appointments check
    let overlapsApt = false;
    for (const apt of activeAppointments) {
      const aptStart = timeToMinutes(apt.start_time);
      const aptEnd = timeToMinutes(apt.end_time);
      if (slot < aptEnd && slotEnd > aptStart) {
        overlapsApt = true;
        break;
      }
    }
    if (overlapsApt) continue;

    slots.push(minutesToTime(slot));
  }

  return slots;
}

// ---------------- REST API ROUTES ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Líder Barbers API' });
});

// Barbershop Settings & Custom Logo / Identity
app.get('/api/settings', (req, res) => {
  if (!db.settings) {
    db.settings = {
      name: 'Líder Barbers',
      tagline: 'Barbearia Clássica & Moderna',
      logo_url: '',
      hero_image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
      phone: '(11) 98765-4321',
      address: 'Av. Principal, 780'
    };
  }
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  if (!db.settings) {
    db.settings = {
      name: 'Líder Barbers',
      tagline: 'Barbearia Clássica & Moderna',
      logo_url: '',
      hero_image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
      phone: '(11) 98765-4321',
      address: 'Av. Principal, 780'
    };
  }
  db.settings = {
    ...db.settings,
    ...req.body
  };
  saveDb();
  res.json(db.settings);
});

// Services
app.get('/api/services', (req, res) => {
  const includeInactive = req.query.all === 'true';
  const list = includeInactive ? db.services : db.services.filter(s => s.active);
  res.json(list);
});

app.post('/api/services', (req, res) => {
  const { name, description, price, duration_minutes, icon_name, category, active } = req.body;
  if (!name || !price || !duration_minutes) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, price, duration_minutes' });
  }
  const id = req.body.id || `srv-${Date.now()}`;
  const newService = {
    id,
    name,
    description: description || '',
    price: Number(price),
    duration_minutes: Number(duration_minutes),
    icon_name: icon_name || 'scissors',
    category: category || 'cabelo',
    active: active !== false
  };
  db.services.push(newService);
  saveDb();
  res.status(201).json(newService);
});

app.put('/api/services/:id', (req, res) => {
  const idx = db.services.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Serviço não encontrado' });
  db.services[idx] = { ...db.services[idx], ...req.body };
  saveDb();
  res.json(db.services[idx]);
});

app.delete('/api/services/:id', (req, res) => {
  const idx = db.services.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Serviço não encontrado' });
  db.services[idx].active = !db.services[idx].active;
  saveDb();
  res.json({ success: true, service: db.services[idx] });
});

// Barbers
app.get('/api/barbers', (req, res) => {
  const includeInactive = req.query.all === 'true';
  const list = includeInactive ? db.barbers : db.barbers.filter(b => b.active);
  res.json(list);
});

app.post('/api/barbers', (req, res) => {
  const { name, nickname, bio, photo_url, specialties, phone, email, active } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  const id = `barber-${Date.now()}`;
  const newBarber = {
    id,
    name,
    nickname: nickname || name,
    bio: bio || '',
    photo_url: photo_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600',
    specialties: Array.isArray(specialties) ? specialties : (specialties ? specialties.split(',').map((s: string) => s.trim()) : ['Corte Clássico']),
    active: active !== false,
    phone: phone || '',
    email: email || '',
    rating: 5.0,
    reviews_count: 0
  };
  db.barbers.push(newBarber);

  // Initialize schedules
  for (let day = 0; day <= 6; day++) {
    const isSunday = day === 0;
    db.barber_schedules.push({
      id: `sched-${id}-${day}`,
      barber_id: id,
      day_of_week: day,
      start_time: isSunday ? '00:00' : '09:00',
      end_time: isSunday ? '00:00' : '20:00',
      break_start: '12:30',
      break_end: '13:30',
      active: !isSunday
    });
  }

  saveDb();
  res.status(201).json(newBarber);
});

app.put('/api/barbers/:id', (req, res) => {
  const idx = db.barbers.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Barbeiro não encontrado' });
  db.barbers[idx] = { ...db.barbers[idx], ...req.body };
  saveDb();
  res.json(db.barbers[idx]);
});

// Barber Schedules
app.get('/api/barbers/:id/schedules', (req, res) => {
  const list = db.barber_schedules.filter(s => s.barber_id === req.params.id);
  res.json(list);
});

app.put('/api/barbers/:id/schedules', (req, res) => {
  const { schedules } = req.body;
  if (!Array.isArray(schedules)) return res.status(400).json({ error: 'Lista de horários inválida' });

  // Update or replace schedules
  db.barber_schedules = db.barber_schedules.filter(s => s.barber_id !== req.params.id);
  schedules.forEach((s, idx) => {
    db.barber_schedules.push({
      id: s.id || `sched-${req.params.id}-${idx}`,
      barber_id: req.params.id,
      day_of_week: s.day_of_week,
      start_time: s.start_time || '09:00',
      end_time: s.end_time || '19:00',
      break_start: s.break_start || '12:30',
      break_end: s.break_end || '13:30',
      active: s.active !== false
    });
  });
  saveDb();
  res.json({ success: true });
});

// Barber Time-Off
app.get('/api/barbers/:id/time-off', (req, res) => {
  const list = db.barber_time_off.filter(o => o.barber_id === req.params.id);
  res.json(list);
});

app.post('/api/barbers/:id/time-off', (req, res) => {
  const { date, reason, full_day, start_time, end_time } = req.body;
  if (!date) return res.status(400).json({ error: 'Data é obrigatória' });
  const newOff = {
    id: `off-${Date.now()}`,
    barber_id: req.params.id,
    date,
    reason: reason || 'Bloqueio de agenda / Folga',
    full_day: full_day !== false,
    start_time: full_day ? undefined : start_time,
    end_time: full_day ? undefined : end_time
  };
  db.barber_time_off.push(newOff);
  saveDb();
  res.status(201).json(newOff);
});

app.delete('/api/time-off/:id', (req, res) => {
  const initialLen = db.barber_time_off.length;
  db.barber_time_off = db.barber_time_off.filter(o => o.id !== req.params.id);
  if (db.barber_time_off.length === initialLen) {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }
  saveDb();
  res.json({ success: true });
});

// Availability calculation endpoint
app.get('/api/availability', (req, res) => {
  const { serviceId, barberId, date } = req.query as { serviceId?: string; barberId?: string; date?: string };
  if (!serviceId || !date) {
    return res.status(400).json({ error: 'Parâmetros serviceId e date são obrigatórios.' });
  }

  const service = db.services.find(s => s.id === serviceId);
  if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

  // If specific barber requested
  if (barberId && barberId !== 'any') {
    const barber = db.barbers.find(b => b.id === barberId);
    if (!barber || !barber.active) return res.status(404).json({ error: 'Barbeiro não disponível' });

    const slots = calculateAvailableSlots(barberId, service.duration_minutes, date);
    return res.json({
      date,
      service,
      barber,
      slots: slots.map(t => ({ time: t, barber_id: barberId }))
    });
  }

  // If "any" barber requested: gather all active barbers and combine available slots
  const activeBarbers = db.barbers.filter(b => b.active);
  const slotMap = new Map<string, string[]>(); // time -> barberIds

  activeBarbers.forEach(b => {
    const slots = calculateAvailableSlots(b.id, service.duration_minutes, date);
    slots.forEach(t => {
      const existing = slotMap.get(t) || [];
      existing.push(b.id);
      slotMap.set(t, existing);
    });
  });

  const sortedTimes = Array.from(slotMap.keys()).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  const slots = sortedTimes.map(t => ({
    time: t,
    barber_id: (slotMap.get(t) || [])[0], // primary suggested barber
    available_barber_ids: slotMap.get(t)
  }));

  res.json({
    date,
    service,
    barber: null,
    slots
  });
});

// ANTI-DUPLICATION TRANSACTIONAL APPOINTMENT CREATION
let appointmentLock: Promise<any> = Promise.resolve();

app.post('/api/appointments', async (req, res) => {
  const { service_id, barber_id, date, start_time, customer_name, customer_phone, customer_email, notes } = req.body;

  if (!service_id || !date || !start_time || !customer_name || !customer_phone) {
    return res.status(400).json({ error: 'Dados incompletos para agendamento.' });
  }

  // Mutex lock to guarantee atomic concurrency check
  appointmentLock = appointmentLock.then(async () => {
    try {
      const service = db.services.find(s => s.id === service_id);
      if (!service) {
        return res.status(400).json({ error: 'Serviço não encontrado' });
      }

      // Determine barber
      let targetBarberId = barber_id;
      if (!targetBarberId || targetBarberId === 'any') {
        // Find first barber available at this time
        const activeBarbers = db.barbers.filter(b => b.active);
        for (const b of activeBarbers) {
          const slots = calculateAvailableSlots(b.id, service.duration_minutes, date);
          if (slots.includes(start_time)) {
            targetBarberId = b.id;
            break;
          }
        }
        if (!targetBarberId) {
          return res.status(409).json({
            error: 'CONFLITO_HORARIO',
            message: 'Nenhum profissional está disponível neste horário no momento. Por favor, selecione outro horário.'
          });
        }
      }

      const barber = db.barbers.find(b => b.id === targetBarberId);
      if (!barber || !barber.active) {
        return res.status(400).json({ error: 'Barbeiro selecionado não está ativo.' });
      }

      // Calculate start and end minutes
      const newStartMins = timeToMinutes(start_time);
      const newEndMins = newStartMins + service.duration_minutes;
      const end_time = minutesToTime(newEndMins);

      // Check anti-duplication collision
      const collision = db.appointments.find(a => {
        if (a.barber_id !== targetBarberId || a.date !== date || a.status === 'cancelled') {
          return false;
        }
        const aStart = timeToMinutes(a.start_time);
        const aEnd = timeToMinutes(a.end_time);
        return newStartMins < aEnd && newEndMins > aStart;
      });

      if (collision) {
        return res.status(409).json({
          error: 'CONFLITO_HORARIO',
          message: `O horário das ${start_time} com ${barber.nickname} acabou de ser reservado por outro cliente. Por favor, escolha outro horário disponível.`
        });
      }

      // Generate human-friendly unique code e.g. LIB-4921
      let code = '';
      do {
        code = `LIB-${Math.floor(1000 + Math.random() * 9000)}`;
      } while (db.appointments.some(a => a.code === code));

      const newAppointment = {
        id: `apt-${Date.now()}`,
        code,
        service_id,
        barber_id: targetBarberId,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        customer_email: customer_email ? customer_email.trim() : '',
        notes: notes ? notes.trim() : '',
        date,
        start_time,
        end_time,
        price: service.price,
        status: 'confirmed',
        created_at: new Date().toISOString()
      };

      db.appointments.unshift(newAppointment);
      saveDb();

      // Return with hydrated joins
      res.status(201).json({
        ...newAppointment,
        service,
        barber
      });
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      res.status(500).json({ error: 'Erro interno ao processar agendamento.' });
    }
  });

  await appointmentLock;
});

// Get appointment by unique confirmation code
app.get('/api/appointments/code/:code', (req, res) => {
  const apt = db.appointments.find(a => a.code.toUpperCase() === req.params.code.toUpperCase());
  if (!apt) {
    return res.status(404).json({ error: 'Agendamento não encontrado com o código fornecido.' });
  }
  const service = db.services.find(s => s.id === apt.service_id);
  const barber = db.barbers.find(b => b.id === apt.barber_id);
  res.json({ ...apt, service, barber });
});

// Cancel appointment by code (public customer cancel)
app.post('/api/appointments/code/:code/cancel', (req, res) => {
  const apt = db.appointments.find(a => a.code.toUpperCase() === req.params.code.toUpperCase());
  if (!apt) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  if (apt.status === 'cancelled') {
    return res.status(400).json({ error: 'Este agendamento já foi cancelado anteriormente.' });
  }
  apt.status = 'cancelled';
  saveDb();
  res.json({ success: true, message: 'Agendamento cancelado com sucesso.', appointment: apt });
});

// Appointments listing with filters (barber, date, status, period)
app.get('/api/appointments', (req, res) => {
  const { barberId, date, status, startDate, endDate } = req.query as {
    barberId?: string;
    date?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };

  let list = db.appointments;

  if (barberId && barberId !== 'all') {
    list = list.filter(a => a.barber_id === barberId);
  }
  if (date) {
    list = list.filter(a => a.date === date);
  }
  if (startDate && endDate) {
    list = list.filter(a => a.date >= startDate && a.date <= endDate);
  }
  if (status && status !== 'all') {
    list = list.filter(a => a.status === status);
  }

  // Hydrate with service and barber details
  const hydrated = list.map(a => ({
    ...a,
    service: db.services.find(s => s.id === a.service_id),
    barber: db.barbers.find(b => b.id === a.barber_id)
  }));

  // Sort by date and start_time
  hydrated.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.start_time.localeCompare(b.start_time);
  });

  res.json(hydrated);
});

// Update appointment status (for barbers and admin)
app.patch('/api/appointments/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'completed', 'no_show', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }
  const apt = db.appointments.find(a => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Agendamento não encontrado' });
  apt.status = status;
  saveDb();
  res.json({ success: true, appointment: apt });
});

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users.find(u => {
    const uEmail = (u.email || '').toLowerCase().trim();
    if (uEmail === normalizedEmail) return true;
    if (u.role === 'owner' && (normalizedEmail === 'dono' || normalizedEmail === 'dono@liderbarbers.com.br' || normalizedEmail === 'allinesoares050@gmail.com')) {
      return true;
    }
    if (u.role === 'admin' && (normalizedEmail === 'admin' || normalizedEmail === 'admin@liderbarbers.com.br' || normalizedEmail === 'admin@liberdade.com.br')) {
      return true;
    }
    return false;
  });

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
  }

  if (user.active === false) {
    return res.status(403).json({ error: 'Esta conta de acesso foi desativada pela administração.' });
  }

  // Don't send back password
  const { password: _, ...profile } = user;
  if (profile.role === 'admin' && !profile.barber_id) {
    profile.barber_id = profile.id;
  }
  res.json({
    user: profile,
    token: `session-${profile.id}-${Date.now()}`
  });
});

// ---------------- INDIVIDUAL BARBER REVENUE ----------------
app.get('/api/barbers/:id/revenue', (req, res) => {
  const barberId = req.params.id;
  const { period, startDate, endDate } = req.query as {
    period?: string; // 'today' | 'yesterday' | 'week' | 'month' | 'all'
    startDate?: string;
    endDate?: string;
  };

  const barber = db.barbers.find(b => b.id === barberId);
  if (!barber) {
    return res.status(404).json({ error: 'Barbeiro não encontrado' });
  }

  // Find linked user for commission rate
  const barberUser = db.users.find(u => u.barber_id === barberId);
  const commissionRate = barber.commission_rate ?? barberUser?.commission_rate ?? 50;

  // Filter barber's appointments
  let list = db.appointments.filter(a => a.barber_id === barberId);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (startDate && endDate) {
    list = list.filter(a => a.date >= startDate && a.date <= endDate);
  } else if (period === 'today' || period === 'hoje') {
    list = list.filter(a => a.date === todayStr);
  } else if (period === 'yesterday' || period === 'ontem') {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yStr = y.toISOString().split('T')[0];
    list = list.filter(a => a.date === yStr);
  } else if (period === 'week' || period === 'semana') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    list = list.filter(a => a.date >= weekStr);
  } else if (period === 'month' || period === 'mes') {
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    list = list.filter(a => a.date >= monthStart);
  }

  const totalAppointments = list.length;
  const completedApts = list.filter(a => a.status === 'completed');
  const cancelledCount = list.filter(a => a.status === 'cancelled').length;
  const completedCount = completedApts.length;

  const grossRevenue = completedApts.reduce((sum, curr) => sum + (curr.price || 0), 0);
  const netEarnings = Math.round((grossRevenue * (commissionRate / 100)) * 100) / 100;
  const averageTicket = completedCount > 0 ? Math.round((grossRevenue / completedCount) * 100) / 100 : 0;

  // Hydrate completed appointments with service and commission per cut
  const hydratedCompleted = completedApts.map(a => {
    const srv = db.services.find(s => s.id === a.service_id);
    const cutPrice = a.price || srv?.price || 0;
    const cutCommission = Math.round((cutPrice * (commissionRate / 100)) * 100) / 100;
    return {
      ...a,
      service: srv,
      barber,
      commission: cutCommission
    };
  });

  res.json({
    barber_id: barber.id,
    barber_name: barber.name,
    barber_nickname: barber.nickname,
    commission_rate: commissionRate,
    period: period || 'all',
    totalAppointments,
    completedCount,
    cancelledCount,
    grossRevenue,
    netEarnings,
    averageTicket,
    completedAppointments: hydratedCompleted
  });
});

// ---------------- OWNER APP AREA (DONO DO APP) ----------------
app.get('/api/owner/overview', (req, res) => {
  const totalCompleted = db.appointments.filter(a => a.status === 'completed');
  const totalGrossRevenue = totalCompleted.reduce((acc, a) => acc + (a.price || 0), 0);
  const totalAdmins = db.users.filter(u => u.role === 'admin').length;
  const totalBarbers = db.barbers.length;
  const totalServices = db.services.length;

  // Revenue per barber
  const barberRevenues = db.barbers.map(b => {
    const apts = db.appointments.filter(a => a.barber_id === b.id && a.status === 'completed');
    const gross = apts.reduce((acc, a) => acc + (a.price || 0), 0);
    const rate = b.commission_rate || 50;
    const net = Math.round((gross * (rate / 100)) * 100) / 100;
    return {
      barber_id: b.id,
      name: b.name,
      nickname: b.nickname,
      gross,
      net,
      completed: apts.length
    };
  });

  res.json({
    totalGrossRevenue,
    totalCompletedAppointments: totalCompleted.length,
    totalAdmins,
    totalBarbers,
    totalServices,
    barberRevenues
  });
});

app.get('/api/owner/admins', (req, res) => {
  const admins = db.users
    .filter(u => u.role === 'admin')
    .map(({ password: _, ...rest }) => rest);
  res.json(admins);
});

app.post('/api/owner/admins', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (db.users.some(u => u.email.toLowerCase().trim() === normalizedEmail)) {
    return res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
  }

  const adminId = `admin-${Date.now()}`;
  const newAdmin = {
    id: adminId,
    name: name.trim(),
    email: normalizedEmail,
    password: password.trim(),
    phone: phone ? phone.trim() : '',
    role: 'admin',
    barber_id: adminId,
    active: true,
    created_at: new Date().toISOString()
  };

  db.users.push(newAdmin);

  // AUTOMATICALLY CREATE BARBER PROFILE FOR THE ADMIN (Nível 2 - Admin também é Barbeiro)
  if (!db.barbers) db.barbers = [];
  if (!db.barber_schedules) db.barber_schedules = [];

  const newAdminBarber = {
    id: adminId,
    name: newAdmin.name,
    nickname: `${newAdmin.name} (Admin)`,
    bio: 'Administrador & Barbeiro Especialista',
    photo_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80',
    specialties: ['Cortes Clássicos', 'Visagismo', 'Barboterapia', 'Degradê'],
    active: true,
    phone: newAdmin.phone,
    email: newAdmin.email,
    commission_rate: 100,
    rating: 5.0,
    reviews_count: 0
  };
  db.barbers.unshift(newAdminBarber);

  // Initialize schedule for the admin barber (Mon-Sat active)
  for (let day = 0; day <= 6; day++) {
    const isSunday = day === 0;
    db.barber_schedules.push({
      id: `sched-${adminId}-${day}`,
      barber_id: adminId,
      day_of_week: day,
      start_time: isSunday ? '00:00' : (day === 6 ? '08:30' : '09:00'),
      end_time: isSunday ? '00:00' : (day === 6 ? '19:00' : '20:00'),
      break_start: '12:30',
      break_end: '13:30',
      active: !isSunday
    });
  }

  saveDb();

  const { password: _, ...safeAdmin } = newAdmin;
  res.status(201).json(safeAdmin);
});

app.put('/api/owner/admins/:id', (req, res) => {
  const admin = db.users.find(u => u.id === req.params.id && u.role === 'admin');
  if (!admin) return res.status(404).json({ error: 'Administrador não encontrado.' });

  const { name, email, password, phone, active } = req.body;
  if (name) admin.name = name.trim();
  if (phone !== undefined) admin.phone = phone.trim();
  if (active !== undefined) admin.active = Boolean(active);
  if (password && password.trim()) admin.password = password.trim();

  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    const collision = db.users.find(u => u.id !== admin.id && u.email.toLowerCase().trim() === normalizedEmail);
    if (collision) return res.status(409).json({ error: 'E-mail já utilizado por outro usuário.' });
    admin.email = normalizedEmail;
  }

  // Synchronize matching barber profile
  const adminBarber = db.barbers.find(b => b.id === admin.id || b.id === admin.barber_id || (b as any).user_id === admin.id);
  if (adminBarber) {
    if (name) {
      adminBarber.name = name.trim();
      adminBarber.nickname = `${name.trim()} (Admin)`;
    }
    if (phone !== undefined) adminBarber.phone = phone.trim();
    if (email) adminBarber.email = email.toLowerCase().trim();
    if (active !== undefined) adminBarber.active = Boolean(active);
  }

  saveDb();
  const { password: _, ...safeAdmin } = admin;
  res.json(safeAdmin);
});

app.delete('/api/owner/admins/:id', (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id && u.role === 'admin');
  if (index === -1) return res.status(404).json({ error: 'Administrador não encontrado.' });

  const admin = db.users[index];
  const barberIdToRemove = admin.barber_id || admin.id;

  db.users.splice(index, 1);

  // Remove corresponding barber profile & schedules
  const barberIdx = db.barbers.findIndex(b => b.id === barberIdToRemove || b.id === admin.id || (b as any).user_id === admin.id);
  if (barberIdx !== -1) {
    db.barbers.splice(barberIdx, 1);
  }
  db.barber_schedules = db.barber_schedules.filter(s => s.barber_id !== barberIdToRemove && s.barber_id !== admin.id);

  saveDb();
  res.json({ success: true, message: 'Administrador e seu perfil de barbeiro removidos com sucesso.' });
});

// ---------------- ADMIN MANAGING BARBER ACCOUNTS ----------------
app.get('/api/admin/barber-accounts', (req, res) => {
  const barberAccounts = db.barbers.map(b => {
    const user = db.users.find(u => u.barber_id === b.id);
    return {
      id: user ? user.id : b.id,
      user_id: user ? user.id : null,
      barber_id: b.id,
      name: b.name,
      barber_name: b.name,
      nickname: b.nickname || '',
      barber_nickname: b.nickname || '',
      photo_url: b.photo_url || '',
      phone: user?.phone || b.phone || '',
      commission_rate: b.commission_rate ?? user?.commission_rate ?? 50,
      email: user ? user.email : (b.email || ''),
      has_account: !!user,
      has_login: !!user,
      active: user ? (user.active !== false) : (b.active !== false)
    };
  });
  res.json(barberAccounts);
});

app.post('/api/admin/barber-accounts', (req, res) => {
  const { barber_id, email, password, commission_rate, name, phone } = req.body;
  if (!barber_id || !email || !password) {
    return res.status(400).json({ error: 'Barbeiro, e-mail e senha são obrigatórios.' });
  }

  const barber = db.barbers.find(b => b.id === barber_id);
  if (!barber) return res.status(404).json({ error: 'Barbeiro não encontrado.' });

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = db.users.find(u => u.email.toLowerCase().trim() === normalizedEmail);
  if (existingUser && existingUser.barber_id !== barber_id) {
    return res.status(409).json({ error: 'Este e-mail já está sendo utilizado por outro usuário.' });
  }

  const rate = Number(commission_rate) || 50;
  barber.commission_rate = rate;

  if (existingUser) {
    existingUser.password = password.trim();
    existingUser.name = name ? name.trim() : barber.name;
    existingUser.phone = phone ? phone.trim() : barber.phone;
    existingUser.commission_rate = rate;
    existingUser.active = true;
    saveDb();
    const { password: _, ...safe } = existingUser;
    return res.json({ success: true, user: safe, message: 'Acesso do barbeiro atualizado.' });
  }

  const newUser = {
    id: `user-barber-${Date.now()}`,
    email: normalizedEmail,
    password: password.trim(),
    name: name ? name.trim() : barber.name,
    role: 'barber',
    barber_id: barber.id,
    commission_rate: rate,
    phone: phone ? phone.trim() : barber.phone,
    active: true,
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDb();

  const { password: _, ...safe } = newUser;
  res.status(201).json({ success: true, user: safe, message: 'Acesso criado com sucesso para o barbeiro.' });
});

app.put('/api/admin/barber-accounts/:id', (req, res) => {
  const user = db.users.find(u => u.id === req.params.id && u.role === 'barber');
  if (!user) return res.status(404).json({ error: 'Conta de barbeiro não encontrada.' });

  const { email, password, commission_rate, active, name, phone } = req.body;
  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (active !== undefined) user.active = Boolean(active);
  if (password && password.trim()) user.password = password.trim();
  if (commission_rate !== undefined) {
    user.commission_rate = Number(commission_rate) || 50;
    const barber = db.barbers.find(b => b.id === user.barber_id);
    if (barber) barber.commission_rate = user.commission_rate;
  }
  if (email) {
    const normalized = email.toLowerCase().trim();
    const collision = db.users.find(u => u.id !== user.id && u.email.toLowerCase().trim() === normalized);
    if (collision) return res.status(409).json({ error: 'E-mail já está em uso.' });
    user.email = normalized;
  }

  saveDb();
  const { password: _, ...safe } = user;
  res.json({ success: true, user: safe });
});

app.delete('/api/admin/barber-accounts/:id', (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id && u.role === 'barber');
  if (index === -1) return res.status(404).json({ error: 'Conta de barbeiro não encontrada.' });

  db.users.splice(index, 1);
  saveDb();
  res.json({ success: true, message: 'Acesso de barbeiro revogado com sucesso.' });
});

// Metrics for Admin Dashboard
app.get('/api/admin/metrics', (req, res) => {
  const totalAppointments = db.appointments.length;
  const confirmed = db.appointments.filter(a => a.status === 'confirmed').length;
  const completed = db.appointments.filter(a => a.status === 'completed').length;
  const noShow = db.appointments.filter(a => a.status === 'no_show').length;
  const cancelled = db.appointments.filter(a => a.status === 'cancelled').length;

  const totalForecastRevenue = db.appointments
    .filter(a => a.status !== 'cancelled')
    .reduce((acc, curr) => acc + (curr.price || 0), 0);

  const totalRealizedRevenue = db.appointments
    .filter(a => a.status === 'completed')
    .reduce((acc, curr) => acc + (curr.price || 0), 0);

  // Revenue by barber
  const barberMetrics = db.barbers.map(b => {
    const barberApts = db.appointments.filter(a => a.barber_id === b.id && a.status !== 'cancelled');
    const revenue = barberApts.reduce((acc, curr) => acc + (curr.price || 0), 0);
    return {
      barber_id: b.id,
      name: b.name,
      nickname: b.nickname,
      total_appointments: barberApts.length,
      revenue
    };
  });

  res.json({
    totalAppointments,
    confirmed,
    completed,
    noShow,
    cancelled,
    totalForecastRevenue,
    totalRealizedRevenue,
    barberMetrics
  });
});

// ---------------- VITE MIDDLEWARE / STATIC ASSETS ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Barbearia Liberdade Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
