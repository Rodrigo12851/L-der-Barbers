import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';
import { 
  Scissors, 
  Menu, 
  X, 
  Calendar, 
  User, 
  Shield, 
  LogOut, 
  Crown,
  Home,
  Clock,
  MapPin,
  Phone,
  Key,
  CalendarCheck
} from 'lucide-react';

export const Header: React.FC = () => {
  const { pathname, navigate } = useRouter();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSideMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { label: 'Início', href: '/', icon: Home },
    { label: 'Serviços', href: '/servicos', icon: Scissors },
    { label: 'Equipe', href: '/equipe', icon: User },
    { label: 'Meus Agendamentos', href: '/meus-agendamentos', icon: CalendarCheck },
    { label: 'Agendar Horário', href: '/agendar', icon: Calendar, highlight: true },
  ];

  return (
    <>
      {/* 
        CABEÇALHO PRINCIPAL:
        Acompanha a rolagem da tela (não é fixo).
        O logo, títulos e o menu de 3 traços rolam normalmente junto com a página.
      */}
      <header className="relative w-full border-b border-[#232733] bg-[#0d0e11]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          
          {/* Brand Logo & Name */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 sm:gap-3 text-left group transition focus:outline-none cursor-pointer"
          >
            {settings.logo_url ? (
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#171922] border border-[#d4af37]/50 shadow-inner overflow-hidden group-hover:border-[#d4af37] transition p-1 shrink-0">
                <img
                  src={settings.logo_url}
                  alt={settings.name || 'Líder Barbers'}
                  className="h-full w-full object-contain rounded-lg"
                />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse" />
              </div>
            ) : (
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#171922] border border-[#d4af37]/40 shadow-inner group-hover:border-[#d4af37] transition shrink-0">
                <Scissors className="h-5 w-5 text-[#d4af37] -rotate-45 transition group-hover:scale-110" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse" />
              </div>
            )}
            <div className="min-w-0">
              <span className="block font-cinzel text-base sm:text-lg font-black tracking-wider text-white group-hover:text-[#f5d77f] transition truncate">
                {settings.name || 'LÍDER BARBERS'}
              </span>
              <span className="block text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-[#9ca3af] uppercase truncate">
                {settings.tagline || 'Barbearia Clássica & Moderna'}
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links (Large screens) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              if (link.highlight) {
                return (
                  <button
                    key={link.href}
                    onClick={() => navigate(link.href)}
                    className="ml-2 flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#0d0e11] shadow-lg shadow-[#d4af37]/20 hover:brightness-110 transition active:scale-95 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </button>
                );
              }
              return (
                <button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wider transition cursor-pointer ${
                    isActive
                      ? 'text-[#f5d77f] bg-[#1a1d26] border border-[#d4af37]/30'
                      : 'text-neutral-300 hover:text-white hover:bg-[#161820]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Area - Inclui o Botão de 3 Traços que ACOMPANHA a rolagem da tela */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <PWAInstallButton variant="nav" />
            </div>

            {/* Logged-in badge shortcut (hidden on small mobile to keep clean) */}
            {user && (
              <button
                onClick={() => navigate(user.role === 'owner' ? '/proprietario' : user.role === 'admin' ? '/admin' : '/barbeiro')}
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[#181a24] border border-[#d4af37]/30 px-3 py-2 text-xs text-white hover:border-[#d4af37] transition cursor-pointer"
                title="Ir para o painel"
              >
                {user.role === 'owner' ? (
                  <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                ) : user.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#d4af37]" />
                )}
                <span className="font-semibold text-neutral-200">
                  {user.role === 'owner' ? 'Dono' : user.role === 'admin' ? 'Admin' : 'Barbeiro'}
                </span>
              </button>
            )}

            {/* Theme Toggle (Modo Claro / Modo Escuro) */}
            <ThemeToggle variant="icon" />

            {/* 
              BOTÃO DO MENU DE 3 TRAÇOS:
              Fica dentro do cabeçalho, acompanhando a rolagem normalmente.
            */}
            <button
              type="button"
              onClick={() => setSideMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#2e3344] bg-[#161822] text-white shadow-md hover:border-[#d4af37] hover:text-[#f5d77f] transition active:scale-95 cursor-pointer"
              aria-label="Abrir menu lateral"
              title="Menu"
            >
              <Menu className="w-5 h-5 text-[#d4af37]" />
            </button>
          </div>

        </div>
      </header>

      {/* BACKDROP DO MENU LATERAL */}
      {sideMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          onClick={() => setSideMenuOpen(false)}
        />
      )}

      {/* 
        MENU LATERAL (SLIDE-IN DRAWER DA LATERAL DIREITA)
      */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-[300px] sm:w-[340px] bg-[#101217] border-l border-[#232733] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          sideMenuOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        aria-label="Menu lateral"
      >
        {/* Top Header of Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-[#232733] bg-[#151722]">
          <div className="flex items-center gap-2.5">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.name || 'Líder Barbers'}
                className="h-9 w-9 object-contain rounded-lg border border-[#d4af37]/40 p-0.5 bg-[#0d0e11]"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#181a24] border border-[#d4af37]/40 text-[#d4af37]">
                <Scissors className="h-4 w-4 -rotate-45" />
              </div>
            )}
            <div>
              <span className="block font-cinzel text-xs font-black tracking-wider text-white">
                {settings.name || 'LÍDER BARBERS'}
              </span>
              <span className="block text-[9px] font-semibold tracking-wider text-[#9ca3af] uppercase">
                Barbearia & Gestão
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSideMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2e3344] bg-[#1a1d28] text-neutral-400 hover:text-white hover:border-[#d4af37] transition cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Quick Booking Button */}
          <button
            type="button"
            onClick={() => {
              navigate('/agendar');
              setSideMenuOpen(false);
            }}
            className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] p-3 text-[#0d0e11] font-black uppercase text-xs tracking-wider shadow-lg shadow-[#d4af37]/20 hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0d0e11]" />
              <span>Agendar Horário</span>
            </div>
            <span className="text-[10px] bg-[#0d0e11] text-[#f5d77f] px-2 py-0.5 rounded font-black">
              Online
            </span>
          </button>

          {/* Client Navigation Links */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Navegação
            </span>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const IconComp = link.icon;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => {
                    navigate(link.href);
                    setSideMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-left transition cursor-pointer ${
                    isActive
                      ? 'bg-[#181b26] text-[#f5d77f] border border-[#d4af37]/40'
                      : 'text-neutral-300 hover:bg-[#151720] hover:text-white'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-neutral-400'}`} />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* THEME SELECTION: MODO CLARO OU ESCURO */}
          <div className="pt-3 border-t border-[#232733] space-y-2">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Modo de Exibição
            </span>
            <ThemeToggle variant="segmented" />
          </div>

          {/* ACCESS SECTION: ONLY VISIBLE IF A STAFF USER IS ALREADY LOGGED IN */}
          {user && (
            <div className="pt-3 border-t border-[#232733] space-y-2">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#d4af37]">
                Sua Sessão Ativa
              </span>

              <div className="rounded-xl border border-[#232733] bg-[#141620] p-3 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1c1f2c] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
                    {user.role === 'owner' ? (
                      <Crown className="w-4 h-4" />
                    ) : user.role === 'admin' ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-[#f5d77f] uppercase font-semibold">
                      {user.role === 'owner' ? '👑 Dono do Aplicativo' : user.role === 'admin' ? '🛡️ Administrador' : '✂️ Barbeiro'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigate(user.role === 'owner' ? '/proprietario' : user.role === 'admin' ? '/admin' : '/barbeiro');
                    setSideMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#1a1d29] border border-[#d4af37]/30 py-2 text-xs font-bold text-white hover:border-[#d4af37] transition cursor-pointer"
                >
                  <span>
                    {user.role === 'owner'
                      ? '👑 Acessar Painel do Dono'
                      : user.role === 'admin'
                      ? '🛡️ Acessar Painel do Administrador'
                      : '✂️ Acessar Meu Painel de Barbeiro'}
                  </span>
                </button>

                {user.role === 'owner' && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/admin');
                      setSideMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#12141c] border border-[#2d3345] py-1.5 text-[11px] font-semibold text-neutral-300 hover:text-white hover:border-[#d4af37]/50 transition cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Ver Painel do Administrador</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setSideMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          )}

          {/* Contact & Address */}
          <div className="pt-3 border-t border-[#232733] space-y-1.5 text-[11px] text-neutral-400">
            {settings.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-[#d4af37]" />
                <span>{settings.phone}</span>
              </div>
            )}
            {settings.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3 h-3 text-[#d4af37] shrink-0 mt-0.5" />
                <span className="leading-tight">{settings.address}</span>
              </div>
            )}
          </div>

        </div>
      </aside>
    </>
  );
};
