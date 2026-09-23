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
import * as FS from './firestoreService';

// Helper to attempt Firestore first, falling back to server /api/* if needed
async function tryFirestoreOrApi<T>(
  firestoreFn: () => Promise<T>,
  apiFn: () => Promise<T>
): Promise<T> {
  try {
    return await firestoreFn();
  } catch (fsErr) {
    console.warn('Firestore attempt deferred to API fallback:', fsErr);
    try {
      return await apiFn();
    } catch (apiErr) {
      throw fsErr || apiErr;
    }
  }
}

// ---------------- SERVICES ----------------
export async function fetchServices(all = false): Promise<Service[]> {
  return tryFirestoreOrApi(
    () => FS.getServicesFS(all),
    async () => {
      const res = await fetch(`/api/services${all ? '?all=true' : ''}`);
      if (!res.ok) throw new Error('Erro ao carregar serviços');
      return res.json();
    }
  );
}

export async function createService(data: Partial<Service>): Promise<Service> {
  return tryFirestoreOrApi(
    () => FS.createServiceFS(data),
    async () => {
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
  );
}

export async function updateService(id: string, data: Partial<Service>): Promise<Service> {
  return tryFirestoreOrApi(
    () => FS.updateServiceFS(id, data),
    async () => {
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
  );
}

export async function toggleServiceActive(id: string): Promise<{ success: boolean; service: Service }> {
  return tryFirestoreOrApi(
    () => FS.toggleServiceActiveFS(id),
    async () => {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao alternar status do serviço');
      return res.json();
    }
  );
}

// ---------------- BARBERS ----------------
export async function fetchBarbers(all = false): Promise<Barber[]> {
  return tryFirestoreOrApi(
    () => FS.getBarbersFS(all),
    async () => {
      const res = await fetch(`/api/barbers${all ? '?all=true' : ''}`);
      if (!res.ok) throw new Error('Erro ao carregar barbeiros');
      return res.json();
    }
  );
}

export async function createBarber(data: Partial<Barber>): Promise<Barber> {
  return tryFirestoreOrApi(
    () => FS.createBarberFS(data),
    async () => {
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
  );
}

export async function updateBarber(id: string, data: Partial<Barber>): Promise<Barber> {
  return tryFirestoreOrApi(
    () => FS.updateBarberFS(id, data),
    async () => {
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
  );
}

// ---------------- SCHEDULES & TIME OFF ----------------
export async function fetchBarberSchedules(barberId: string): Promise<BarberSchedule[]> {
  return tryFirestoreOrApi(
    () => FS.getBarberSchedulesFS(barberId),
    async () => {
      const res = await fetch(`/api/barbers/${barberId}/schedules`);
      if (!res.ok) throw new Error('Erro ao carregar horários do barbeiro');
      return res.json();
    }
  );
}

export async function saveBarberSchedules(barberId: string, schedules: BarberSchedule[]): Promise<void> {
  return tryFirestoreOrApi(
    () => FS.saveBarberSchedulesFS(barberId, schedules),
    async () => {
      const res = await fetch(`/api/barbers/${barberId}/schedules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules }),
      });
      if (!res.ok) throw new Error('Erro ao salvar horários de atendimento');
    }
  );
}

export async function fetchBarberTimeOff(barberId: string): Promise<BarberTimeOff[]> {
  return tryFirestoreOrApi(
    () => FS.getBarberTimeOffFS(barberId),
    async () => {
      const res = await fetch(`/api/barbers/${barberId}/time-off`);
      if (!res.ok) throw new Error('Erro ao carregar folgas e bloqueios');
      return res.json();
    }
  );
}

export async function addBarberTimeOff(barberId: string, data: Partial<BarberTimeOff>): Promise<BarberTimeOff> {
  return tryFirestoreOrApi(
    () => FS.addBarberTimeOffFS(barberId, data),
    async () => {
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
  );
}

export async function deleteBarberTimeOff(id: string): Promise<void> {
  return tryFirestoreOrApi(
    () => FS.deleteBarberTimeOffFS(id),
    async () => {
      const res = await fetch(`/api/time-off/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir bloqueio');
    }
  );
}

// ---------------- AVAILABILITY ----------------
export async function fetchAvailability(serviceId: string, date: string, barberId?: string): Promise<{
  slots: AvailabilitySlot[];
  service: Service;
  barber?: Barber | null;
}> {
  return tryFirestoreOrApi(
    () => FS.getAvailabilityFS(serviceId, date, barberId),
    async () => {
      const params = new URLSearchParams({ serviceId, date });
      if (barberId) params.append('barberId', barberId);

      const res = await fetch(`/api/availability?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao consultar horários disponíveis');
      }
      return res.json();
    }
  );
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
  return tryFirestoreOrApi(
    () => FS.createAppointmentFS(payload),
    async () => {
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
  );
}

export async function fetchAppointmentByCode(code: string): Promise<Appointment> {
  return tryFirestoreOrApi(
    () => FS.getAppointmentByCodeFS(code),
    async () => {
      const res = await fetch(`/api/appointments/code/${encodeURIComponent(code)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Agendamento não encontrado');
      }
      return res.json();
    }
  );
}

export async function cancelAppointmentByCode(code: string): Promise<void> {
  return tryFirestoreOrApi(
    () => FS.cancelAppointmentByCodeFS(code),
    async () => {
      const res = await fetch(`/api/appointments/code/${encodeURIComponent(code)}/cancel`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao cancelar agendamento');
      }
    }
  );
}

export async function fetchCustomerAppointments(params: {
  phone?: string;
  codes?: string[];
}): Promise<Appointment[]> {
  return tryFirestoreOrApi(
    () => FS.getCustomerAppointmentsFS(params),
    async () => {
      const queryParams = new URLSearchParams();
      if (params.phone) queryParams.set('phone', params.phone);
      if (params.codes && params.codes.length > 0) queryParams.set('codes', params.codes.join(','));

      const res = await fetch(`/api/appointments/customer?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error('Erro ao carregar agendamentos do cliente');
      }
      return res.json();
    }
  );
}

export async function fetchAppointments(filters?: {
  barberId?: string;
  date?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Appointment[]> {
  return tryFirestoreOrApi(
    () => FS.getAppointmentsFS(filters),
    async () => {
      const params = new URLSearchParams();
      if (filters?.barberId) params.append('barberId', filters.barberId);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const token = typeof window !== 'undefined' ? localStorage.getItem('liberdade_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/appointments?${params.toString()}`, { headers });
      if (!res.ok) throw new Error('Erro ao listar agendamentos');
      return res.json();
    }
  );
}

export function subscribeToAppointments(
  filters: { barberId?: string; date?: string; status?: string } | undefined,
  callback: (appointments: Appointment[]) => void,
  onError?: (err: any) => void
): () => void {
  return FS.subscribeToAppointmentsFS(filters, callback, onError);
}

export async function updateAppointmentStatus(id: string, status: string): Promise<void> {
  return tryFirestoreOrApi(
    () => FS.updateAppointmentStatusFS(id, status),
    async () => {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar status do agendamento');
    }
  );
}

export async function fetchAdminMetrics(): Promise<any> {
  return tryFirestoreOrApi(
    () => FS.getAdminMetricsFS(),
    async () => {
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) throw new Error('Erro ao carregar métricas administrativas');
      return res.json();
    }
  );
}

export async function checkNeedsOwnerSetup(): Promise<boolean> {
  return tryFirestoreOrApi(
    () => FS.checkNeedsOwnerSetupFS(),
    async () => {
      const res = await fetch('/api/auth/needs-owner-setup');
      if (!res.ok) return false;
      const data = await res.json().catch(() => ({}));
      return data.needsSetup === true;
    }
  );
}

export async function setupInitialOwner(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ user: UserProfile; token: string }> {
  return tryFirestoreOrApi(
    () => FS.setupInitialOwnerFS(data),
    async () => {
      const res = await fetch('/api/auth/setup-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao configurar proprietário inicial');
      }
      return res.json();
    }
  );
}

export async function login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
  return tryFirestoreOrApi(
    () => FS.loginFS(email, password),
    async () => {
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
  );
}

export async function loginWithGoogle(): Promise<{ user: UserProfile; token: string }> {
  return FS.loginWithGoogleFS();
}

export async function fetchShopSettings(): Promise<ShopSettings> {
  try {
    return await tryFirestoreOrApi(
      () => FS.getShopSettingsFS(),
      async () => {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Erro ao carregar configurações da barbearia');
        return res.json();
      }
    );
  } catch (err) {
    console.warn('Notice loading shop settings, using default/cached:', err);
    return await FS.getShopSettingsFS();
  }
}

export async function updateShopSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
  try {
    return await tryFirestoreOrApi(
      () => FS.updateShopSettingsFS(settings),
      async () => {
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
    );
  } catch (err) {
    console.warn('Notice updating shop settings via API, falling back to Firestore service:', err);
    return await FS.updateShopSettingsFS(settings);
  }
}

// ---------------- INDIVIDUAL BARBER REVENUE ----------------
export async function fetchBarberRevenue(barberId: string, period = 'all'): Promise<BarberRevenueMetrics> {
  return tryFirestoreOrApi(
    () => FS.getBarberRevenueFS(barberId, period),
    async () => {
      const res = await fetch(`/api/barbers/${barberId}/revenue?period=${period}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao carregar faturamento do barbeiro');
      }
      return res.json();
    }
  );
}

// ---------------- OWNER APP AREA ----------------
export async function fetchOwnerOverview(): Promise<OwnerOverviewMetrics> {
  try {
    return await tryFirestoreOrApi(
      () => FS.getOwnerOverviewFS(),
      async () => {
        const res = await fetch('/api/owner/overview');
        if (!res.ok) throw new Error('Erro ao carregar visão geral do dono');
        return res.json();
      }
    );
  } catch (err) {
    console.warn('Notice loading owner overview, generating resilient metrics:', err);
    return await FS.getOwnerOverviewFS();
  }
}

export async function fetchOwnerAccounts(): Promise<OwnerAccount[]> {
  try {
    return await tryFirestoreOrApi(
      () => FS.getOwnerAccountsFS(),
      async () => {
        const res = await fetch('/api/owner/accounts');
        if (!res.ok) throw new Error('Erro ao listar contas de proprietário');
        const data = await res.json();
        return data.accounts || [];
      }
    );
  } catch (err) {
    console.warn('Notice loading owner accounts, using resilient list:', err);
    return await FS.getOwnerAccountsFS();
  }
}

export async function updateOwnerCredentials(data: {
  currentEmail: string;
  currentPassword: string;
  newEmail: string;
  newPassword: string;
}): Promise<{ success: boolean; user: UserProfile; message?: string }> {
  return tryFirestoreOrApi(
    () => FS.updateOwnerCredentialsFS(data),
    async () => {
      const res = await fetch('/api/owner/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao atualizar credenciais do proprietário');
      }
      return res.json();
    }
  );
}

export async function fetchOwnerAdmins(): Promise<AdminAccount[]> {
  return tryFirestoreOrApi(
    () => FS.getOwnerAdminsFS(),
    async () => {
      const res = await fetch('/api/owner/admins');
      if (!res.ok) throw new Error('Erro ao listar administradores');
      return res.json();
    }
  );
}

export async function createAdminAccount(data: { name: string; email: string; password: string; phone?: string }): Promise<AdminAccount> {
  return tryFirestoreOrApi(
    () => FS.createAdminAccountFS(data),
    async () => {
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
  );
}

export async function updateAdminAccount(id: string, data: Partial<AdminAccount> & { password?: string }): Promise<AdminAccount> {
  return tryFirestoreOrApi(
    () => FS.updateAdminAccountFS(id, data),
    async () => {
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
  );
}

export async function deleteAdminAccount(id: string): Promise<void> {
  return tryFirestoreOrApi(
    () => FS.deleteAdminAccountFS(id),
    async () => {
      const res = await fetch(`/api/owner/admins/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao excluir administrador');
    }
  );
}

// ---------------- ADMIN MANAGING BARBER LOGINS ----------------
export async function fetchAdminBarberAccounts(): Promise<BarberAccount[]> {
  try {
    return await tryFirestoreOrApi(
      () => FS.getAdminBarberAccountsFS(),
      async () => {
        const res = await fetch('/api/admin/barber-accounts');
        if (!res.ok) throw new Error('Erro ao listar contas de barbeiros');
        return res.json();
      }
    );
  } catch (err) {
    console.warn('Notice loading admin barber accounts, returning resilient list:', err);
    return await FS.getAdminBarberAccountsFS();
  }
}

export async function createBarberAccount(data: {
  barber_id: string;
  email: string;
  password: string;
  commission_rate: number;
  name?: string;
  phone?: string;
}): Promise<{ success: boolean; user: UserProfile; message: string }> {
  return tryFirestoreOrApi(
    () => FS.createBarberAccountFS(data),
    async () => {
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
  );
}

export async function updateBarberAccount(id: string, data: Partial<BarberAccount> & { password?: string }): Promise<{ success: boolean; user: UserProfile }> {
  return tryFirestoreOrApi(
    () => FS.updateBarberAccountFS(id, data),
    async () => {
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
  );
}

export async function deleteBarberAccount(id: string): Promise<void> {
  return tryFirestoreOrApi(
    () => FS.deleteBarberAccountFS(id),
    async () => {
      const res = await fetch(`/api/admin/barber-accounts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao excluir conta de barbeiro');
    }
  );
}
