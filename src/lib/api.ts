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

export async function fetchServices(all = false): Promise<Service[]> {
  const res = await fetch(`/api/services${all ? '?all=true' : ''}`);
  if (!res.ok) throw new Error('Erro ao carregar serviços');
  return res.json();
}

export async function createService(data: Partial<Service>): Promise<Service> {
  const res = await fetch('/api/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar serviço');
  }
  return res.json();
}

export async function updateService(id: string, data: Partial<Service>): Promise<Service> {
  const res = await fetch(`/api/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar serviço');
  }
  return res.json();
}

export async function toggleServiceActive(id: string): Promise<{ success: boolean; service: Service }> {
  const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao alternar status do serviço');
  return res.json();
}

export async function fetchBarbers(all = false): Promise<Barber[]> {
  const res = await fetch(`/api/barbers${all ? '?all=true' : ''}`);
  if (!res.ok) throw new Error('Erro ao carregar barbeiros');
  return res.json();
}

export async function createBarber(data: Partial<Barber>): Promise<Barber> {
  const res = await fetch('/api/barbers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao cadastrar barbeiro');
  }
  return res.json();
}

export async function updateBarber(id: string, data: Partial<Barber>): Promise<Barber> {
  const res = await fetch(`/api/barbers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar barbeiro');
  }
  return res.json();
}

export async function fetchBarberSchedules(barberId: string): Promise<BarberSchedule[]> {
  const res = await fetch(`/api/barbers/${barberId}/schedules`);
  if (!res.ok) throw new Error('Erro ao carregar horários do barbeiro');
  return res.json();
}

export async function saveBarberSchedules(barberId: string, schedules: BarberSchedule[]): Promise<void> {
  const res = await fetch(`/api/barbers/${barberId}/schedules`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schedules }),
  });
  if (!res.ok) throw new Error('Erro ao salvar horários de atendimento');
}

export async function fetchBarberTimeOff(barberId: string): Promise<BarberTimeOff[]> {
  const res = await fetch(`/api/barbers/${barberId}/time-off`);
  if (!res.ok) throw new Error('Erro ao carregar folgas e bloqueios');
  return res.json();
}

export async function addBarberTimeOff(barberId: string, data: Partial<BarberTimeOff>): Promise<BarberTimeOff> {
  const res = await fetch(`/api/barbers/${barberId}/time-off`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao adicionar bloqueio');
  }
  return res.json();
}

export async function deleteBarberTimeOff(id: string): Promise<void> {
  const res = await fetch(`/api/time-off/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir bloqueio');
}

export async function fetchAvailability(serviceId: string, date: string, barberId?: string): Promise<{
  slots: AvailabilitySlot[];
  service: Service;
  barber?: Barber | null;
}> {
  const params = new URLSearchParams({
    serviceId,
    date,
  });
  if (barberId) params.append('barberId', barberId);

  const res = await fetch(`/api/availability?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao consultar horários disponíveis');
  }
  return res.json();
}

export interface BookingPayload {
  service_id: string;
  barber_id?: string;
  date: string;
  start_time: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
}

export async function createAppointment(payload: BookingPayload): Promise<Appointment> {
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || errorData.error || 'Erro ao agendar horário.';
    const error = new Error(message);
    (error as any).status = res.status;
    (error as any).code = errorData.error;
    throw error;
  }

  return res.json();
}

export async function fetchAppointmentByCode(code: string): Promise<Appointment> {
  const res = await fetch(`/api/appointments/code/${encodeURIComponent(code)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Agendamento não encontrado');
  }
  return res.json();
}

export async function cancelAppointmentByCode(code: string): Promise<void> {
  const res = await fetch(`/api/appointments/code/${encodeURIComponent(code)}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao cancelar agendamento');
  }
}

export async function fetchAppointments(filters?: {
  barberId?: string;
  date?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Appointment[]> {
  const params = new URLSearchParams();
  if (filters?.barberId) params.append('barberId', filters.barberId);
  if (filters?.date) params.append('date', filters.date);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const res = await fetch(`/api/appointments?${params.toString()}`);
  if (!res.ok) throw new Error('Erro ao listar agendamentos');
  return res.json();
}

export async function updateAppointmentStatus(id: string, status: string): Promise<void> {
  const res = await fetch(`/api/appointments/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Erro ao atualizar status do agendamento');
}

export async function fetchAdminMetrics(): Promise<any> {
  const res = await fetch('/api/admin/metrics');
  if (!res.ok) throw new Error('Erro ao carregar métricas administrativas');
  return res.json();
}

export async function login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Credenciais inválidas');
  }
  return res.json();
}

export async function fetchShopSettings(): Promise<ShopSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Erro ao carregar configurações da barbearia');
  return res.json();
}

export async function updateShopSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar configurações da barbearia');
  }
  return res.json();
}

// ---------------- INDIVIDUAL BARBER REVENUE ----------------
export async function fetchBarberRevenue(barberId: string, period = 'all'): Promise<BarberRevenueMetrics> {
  const res = await fetch(`/api/barbers/${barberId}/revenue?period=${period}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao carregar faturamento do barbeiro');
  }
  return res.json();
}

// ---------------- OWNER APP AREA ----------------
export async function fetchOwnerOverview(): Promise<OwnerOverviewMetrics> {
  const res = await fetch('/api/owner/overview');
  if (!res.ok) throw new Error('Erro ao carregar visão geral do dono');
  return res.json();
}

export async function fetchOwnerAdmins(): Promise<AdminAccount[]> {
  const res = await fetch('/api/owner/admins');
  if (!res.ok) throw new Error('Erro ao listar administradores');
  return res.json();
}

export async function createAdminAccount(data: { name: string; email: string; password: string; phone?: string }): Promise<AdminAccount> {
  const res = await fetch('/api/owner/admins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao cadastrar administrador');
  }
  return res.json();
}

export async function updateAdminAccount(id: string, data: Partial<AdminAccount> & { password?: string }): Promise<AdminAccount> {
  const res = await fetch(`/api/owner/admins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar administrador');
  }
  return res.json();
}

export async function deleteAdminAccount(id: string): Promise<void> {
  const res = await fetch(`/api/owner/admins/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erro ao excluir administrador');
}

// ---------------- ADMIN MANAGING BARBER LOGINS ----------------
export async function fetchAdminBarberAccounts(): Promise<BarberAccount[]> {
  const res = await fetch('/api/admin/barber-accounts');
  if (!res.ok) throw new Error('Erro ao listar contas de barbeiros');
  return res.json();
}

export async function createBarberAccount(data: {
  barber_id: string;
  email: string;
  password: string;
  commission_rate: number;
  name?: string;
  phone?: string;
}): Promise<{ success: boolean; user: UserProfile; message: string }> {
  const res = await fetch('/api/admin/barber-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar conta de barbeiro');
  }
  return res.json();
}

export async function updateBarberAccount(id: string, data: Partial<BarberAccount> & { password?: string }): Promise<{ success: boolean; user: UserProfile }> {
  const res = await fetch(`/api/admin/barber-accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar conta de barbeiro');
  }
  return res.json();
}

export async function deleteBarberAccount(id: string): Promise<void> {
  const res = await fetch(`/api/admin/barber-accounts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erro ao excluir conta de barbeiro');
}


