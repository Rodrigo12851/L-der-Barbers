import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShopSettings } from '../types';
import { fetchShopSettings, updateShopSettings as apiUpdateShopSettings } from '../lib/api';

const DEFAULT_SETTINGS: ShopSettings = {
  name: 'Líder Barbers',
  tagline: 'Barbearia Clássica & Moderna',
  logo_url: '',
  hero_image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
  phone: '(11) 98765-4321',
  address: 'Av. Paulista, 1000 — São Paulo, SP'
};

const STORAGE_KEY = 'lider_barbers_settings';

interface SettingsContextType {
  settings: ShopSettings;
  isLoading: boolean;
  updateSettings: (partial: Partial<ShopSettings>) => Promise<ShopSettings>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ShopSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error reading settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSettings = async () => {
    try {
      const data = await fetchShopSettings();
      if (data && data.name) {
        const merged = { ...DEFAULT_SETTINGS, ...data };
        setSettings(merged);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch (e) {
          // ignore quota error
        }
      }
    } catch (err) {
      console.warn('Could not fetch server settings, using cached or default', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateSettings = async (partial: Partial<ShopSettings>): Promise<ShopSettings> => {
    const optimistic = { ...settings, ...partial };
    setSettings(optimistic);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(optimistic));
    } catch (e) {
      // ignore
    }

    try {
      const updated = await apiUpdateShopSettings(partial);
      const merged = { ...DEFAULT_SETTINGS, ...updated };
      setSettings(merged);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch (e) {}
      return merged;
    } catch (err) {
      console.error('Failed to sync settings with server', err);
      return optimistic;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
