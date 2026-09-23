import { Appointment } from '../types';

const STORAGE_KEYS = {
  PHONE: 'lider_customer_phone',
  NAME: 'lider_customer_name',
  CODES: 'lider_customer_codes',
  LAST_APPT: 'lider_customer_last_appt',
};

export interface StoredCustomerData {
  phone: string;
  name: string;
  codes: string[];
}

export function getStoredCustomerData(): StoredCustomerData {
  if (typeof window === 'undefined') {
    return { phone: '', name: '', codes: [] };
  }

  try {
    const phone = localStorage.getItem(STORAGE_KEYS.PHONE) || '';
    const name = localStorage.getItem(STORAGE_KEYS.NAME) || '';
    const rawCodes = localStorage.getItem(STORAGE_KEYS.CODES);
    let codes: string[] = [];

    if (rawCodes) {
      codes = JSON.parse(rawCodes);
      if (!Array.isArray(codes)) codes = [];
    }

    return { phone, name, codes };
  } catch (e) {
    console.warn('Error reading stored customer data:', e);
    return { phone: '', name: '', codes: [] };
  }
}

export function saveCustomerBooking(data: {
  code: string;
  phone: string;
  name?: string;
  appointment?: Appointment;
}) {
  if (typeof window === 'undefined') return;

  try {
    if (data.phone) {
      localStorage.setItem(STORAGE_KEYS.PHONE, data.phone.trim());
    }
    if (data.name) {
      localStorage.setItem(STORAGE_KEYS.NAME, data.name.trim());
    }

    if (data.code) {
      const cleanCode = data.code.trim().toUpperCase();
      const rawCodes = localStorage.getItem(STORAGE_KEYS.CODES);
      let codes: string[] = [];
      if (rawCodes) {
        try {
          codes = JSON.parse(rawCodes);
        } catch (e) {
          codes = [];
        }
      }

      if (!codes.includes(cleanCode)) {
        codes.unshift(cleanCode); // newest first
        localStorage.setItem(STORAGE_KEYS.CODES, JSON.stringify(codes.slice(0, 30)));
      }
    }

    if (data.appointment) {
      localStorage.setItem(STORAGE_KEYS.LAST_APPT, JSON.stringify(data.appointment));
    }
  } catch (e) {
    console.warn('Error saving customer booking to storage:', e);
  }
}

export function clearStoredCustomerData() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.PHONE);
    localStorage.removeItem(STORAGE_KEYS.NAME);
    localStorage.removeItem(STORAGE_KEYS.CODES);
    localStorage.removeItem(STORAGE_KEYS.LAST_APPT);
  } catch (e) {
    console.warn('Error clearing stored customer data:', e);
  }
}

export function formatPhoneBR(val: string): string {
  const raw = (val || '').replace(/\D/g, '');
  if (!raw) return '';
  if (raw.length <= 2) return `(${raw}`;
  if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
  return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
}

export function saveCustomerProfile(data: { name?: string; phone?: string }) {
  if (typeof window === 'undefined') return;
  try {
    if (data.name && data.name.trim()) {
      localStorage.setItem(STORAGE_KEYS.NAME, data.name.trim());
    }
    if (data.phone && data.phone.trim()) {
      const formatted = formatPhoneBR(data.phone.trim());
      localStorage.setItem(STORAGE_KEYS.PHONE, formatted);
    }
  } catch (e) {
    console.warn('Error saving customer profile to storage:', e);
  }
}

export function cleanPhoneNumber(val: string): string {
  return (val || '').replace(/\D/g, '');
}

export function maskPhoneNumber(val: string): string {
  const digits = (val || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length >= 11) {
    const ddd = digits.slice(0, 2);
    const firstDigit = digits.slice(2, 3);
    const last4 = digits.slice(-4);
    return `(${ddd}) ${firstDigit}****-${last4}`;
  }
  if (digits.length >= 10) {
    const ddd = digits.slice(0, 2);
    const last4 = digits.slice(-4);
    return `(${ddd}) ****-${last4}`;
  }
  if (digits.length >= 4) {
    return `***-` + digits.slice(-4);
  }
  return '***';
}
