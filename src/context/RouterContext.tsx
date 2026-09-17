import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type RouteName =
  | 'home'
  | 'services'
  | 'barbers'
  | 'booking'
  | 'booking_detail'
  | 'auth'
  | 'barber_dashboard'
  | 'admin_dashboard'
  | 'owner_dashboard';

interface RouterContextType {
  path: string;
  pathname: string;
  currentRoute: RouteName;
  navigate: (to: string) => void;
  params: Record<string, string>;
  searchParams: URLSearchParams;
}

export const getRouteFromPath = (fullPath: string): RouteName => {
  let cleanPath = (fullPath.split('?')[0] || '/').toLowerCase().trim();

  // If path contains hash like /#/proprietario or #/proprietario
  if (cleanPath.includes('#')) {
    const hashPart = cleanPath.split('#')[1] || '';
    if (hashPart.startsWith('/')) {
      cleanPath = hashPart;
    } else if (hashPart) {
      cleanPath = '/' + hashPart;
    } else {
      cleanPath = cleanPath.split('#')[0] || '/';
    }
  }

  // Strip trailing slash if not root
  if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }

  if (cleanPath === '/' || cleanPath === '') {
    return 'home';
  }
  if (cleanPath === '/servicos' || cleanPath === '/services') {
    return 'services';
  }
  if (cleanPath === '/equipe' || cleanPath === '/barbeiros' || cleanPath === '/barbers') {
    return 'barbers';
  }
  if (cleanPath === '/agendar' || cleanPath === '/booking') {
    return 'booking';
  }
  if (cleanPath.startsWith('/agendamento') || cleanPath.startsWith('/voucher')) {
    return 'booking_detail';
  }
  if (cleanPath === '/auth' || cleanPath === '/login' || cleanPath === '/entrar') {
    return 'auth';
  }
  if (cleanPath === '/barbeiro' || cleanPath === '/barber' || cleanPath === '/portal-barbeiro' || cleanPath === '/app-barbeiro') {
    return 'barber_dashboard';
  }
  if (cleanPath === '/admin' || cleanPath === '/painel' || cleanPath === '/portal-admin' || cleanPath === '/app-admin') {
    return 'admin_dashboard';
  }
  if (cleanPath === '/proprietario' || cleanPath === '/owner' || cleanPath === '/dono' || cleanPath === '/portal-dono' || cleanPath === '/app-dono') {
    return 'owner_dashboard';
  }

  return 'home';
};

const RouterContext = createContext<RouterContextType>({
  path: '/',
  pathname: '/',
  currentRoute: 'home',
  navigate: () => {},
  params: {},
  searchParams: new URLSearchParams(),
});

export const useRouter = () => useContext(RouterContext);

const getResolvedPath = (): string => {
  if (typeof window === 'undefined') return '/';

  // 1. Check if there is a hash route like /#/proprietario or #proprietario
  const hash = window.location.hash;
  if (hash) {
    if (hash.startsWith('#/')) {
      return hash.slice(1);
    }
    if (hash.startsWith('#') && hash.length > 1) {
      return '/' + hash.slice(1);
    }
  }

  // 2. Check query param redirect fallback ?p=/proprietario or ?p=proprietario
  const search = window.location.search;
  if (search) {
    const sp = new URLSearchParams(search);
    let redirectParam = sp.get('p') || sp.get('r');
    if (redirectParam) {
      if (!redirectParam.startsWith('/')) {
        redirectParam = '/' + redirectParam;
      }
      try {
        window.history.replaceState({}, '', redirectParam);
      } catch (e) {
        // ignore
      }
      return redirectParam;
    }
  }

  // 3. Default standard pathname + search
  return window.location.pathname + window.location.search || '/';
};

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(getResolvedPath);

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(getResolvedPath());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (to: string) => {
    if (to === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    try {
      window.history.pushState({}, '', to);
    } catch (e) {
      console.warn('History pushState error in iframe:', e);
    }
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pathname = useMemo(() => {
    return (path.split('?')[0].split('#')[0] || '/').toLowerCase().trim();
  }, [path]);

  const searchParams = useMemo(() => {
    const queryPart = path.includes('?') ? path.slice(path.indexOf('?')) : '';
    return new URLSearchParams(queryPart);
  }, [path]);

  const currentRoute = useMemo(() => {
    return getRouteFromPath(pathname);
  }, [pathname]);

  // Extract params like /agendamento/:codigo
  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (pathname.startsWith('/agendamento/')) {
      const code = pathname.replace('/agendamento/', '').replace(/\/$/, '').trim();
      if (code) p.codigo = code.toUpperCase();
    } else if (pathname.startsWith('/voucher/')) {
      const code = pathname.replace('/voucher/', '').replace(/\/$/, '').trim();
      if (code) p.codigo = code.toUpperCase();
    }
    return p;
  }, [pathname]);

  return (
    <RouterContext.Provider value={{ path, pathname, currentRoute, navigate, params, searchParams }}>
      {children}
    </RouterContext.Provider>
  );
};

