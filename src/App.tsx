import React, { useEffect } from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { BarbersPage } from './pages/BarbersPage';
import { BookingFlow } from './pages/BookingFlow';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { AuthPage } from './pages/AuthPage';
import { BarberDashboard } from './pages/BarberDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';

const AppContent: React.FC = () => {
  const { currentRoute, path } = useRouter();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [path]);

  // Register service worker if supported
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
          .catch((err) => console.log('PWA Service Worker registration failed:', err));
      });
    }
  }, []);

  const renderCurrentPage = () => {
    switch (currentRoute) {
      case 'home':
        return <HomePage />;
      case 'services':
        return <ServicesPage />;
      case 'barbers':
        return <BarbersPage />;
      case 'booking':
        return <BookingFlow />;
      case 'booking_detail':
        return <BookingConfirmationPage />;
      case 'auth':
        return <AuthPage />;
      case 'barber_dashboard':
        return <BarberDashboard />;
      case 'admin_dashboard':
        return <AdminDashboard />;
      case 'owner_dashboard':
        return <OwnerDashboard />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0e11] text-neutral-100 selection:bg-[#d4af37] selection:text-[#0d0e11]">
      <Header />
      <main className="flex-1">
        {renderCurrentPage()}
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
