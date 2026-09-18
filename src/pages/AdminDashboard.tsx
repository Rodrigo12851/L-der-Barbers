import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { AdminSettingsTab } from '../components/AdminSettingsTab';
import { Appointment, Service, Barber } from '../types';
import { 
  fetchAppointments, 
  updateAppointmentStatus, 
  fetchServices, 
  createService, 
  updateService, 
  toggleServiceActive,
  fetchBarbers,
  createBarber,
  updateBarber,
  fetchAdminMetrics,
  subscribeToAppointments
} from '../lib/api';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Users, 
  Scissors, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  AlertCircle,
  Filter, 
  Clock, 
  Shield, 
  LogOut,
  RefreshCw,
  Search,
  Check,
  Image as ImageIcon,
  Upload,
  Camera,
  Key,
  Crown,
  Copy,
  ExternalLink,
  Share2
} from 'lucide-react';
import { AdminBarberAccountsTab } from '../components/AdminBarberAccountsTab';
import { RoleAppDownloadCard } from '../components/RoleAppDownloadCard';
import { DedicatedRolePortalLogin } from '../components/DedicatedRolePortalLogin';

export const AdminDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();

  // Tabs
  const [activeTab, setActiveTab] = useState<'metricas' | 'agendamentos' | 'servicos' | 'barbeiros' | 'acessos' | 'identidade'>('metricas');

  // Data
  const [metrics, setMetrics] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Link exclusivo do Admin/Barbeiro
  const adminBarberId = user?.barber_id || user?.id || 'admin';
  const adminBarber = barbers.find(b => b.id === adminBarberId) || user;
  const adminBarberName = adminBarber?.name || (adminBarber as any)?.nickname || user?.name || 'Administrador';
  const clientLink = `${window.location.origin}/agendar?barbeiro=${adminBarberName}`;

  const handleCopyClientLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(clientLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = clientLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      showToast('Link exclusivo de cliente copiado para a área de transferência!');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      showToast(`Link de agendamento: ${clientLink}`);
    }
  };

  const handleShareClientLinkWhatsApp = () => {
    const text = encodeURIComponent(
      `💈 *Agendamento Exclusivo — ${adminBarberName} | Líder Barbers*\n\nReserve seu horário diretamente com ${adminBarberName} pelo link abaixo:\n🔗 ${clientLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Filters for appointments
  const [filterBarber, setFilterBarber] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Service Modal State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [srvName, setSrvName] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPrice, setSrvPrice] = useState('50');
  const [srvDuration, setSrvDuration] = useState('45');
  const [srvCategory, setSrvCategory] = useState<'cabelo' | 'barba' | 'combo' | 'tratamento'>('cabelo');

  // Barber Modal State
  const [barberModalOpen, setBarberModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [brbName, setBrbName] = useState('');
  const [brbNickname, setBrbNickname] = useState('');
  const [brbBio, setBrbBio] = useState('');
  const [brbPhoto, setBrbPhoto] = useState('');
  const [brbSpecialties, setBrbSpecialties] = useState('');
  const [brbPhone, setBrbPhone] = useState('');
  const [brbEmail, setBrbEmail] = useState('');

  // Inline toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Protect admin and owner access
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin' && user.role !== 'owner') {
      navigate('/barbeiro');
    }
  }, [user, authLoading]);

  const knownAptIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [met, apts, srvs, brbs] = await Promise.all([
        fetchAdminMetrics(),
        fetchAppointments(),
        fetchServices(true),
        fetchBarbers(true),
      ]);
      setMetrics(met);
      setAppointments(apts);
      setServices(srvs);
      setBarbers(brbs);
      knownAptIdsRef.current = new Set(apts.map(a => a.id));
      isInitialLoadRef.current = false;
    } catch (e) {
      console.error('Error loading admin data', e);
      if (!silent) showToast('Erro ao carregar dados do painel', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'owner') return;

    // 1. Initial Load
    loadAll(false);

    // 2. Real-time Firestore subscription
    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeToAppointments(
        undefined,
        (realtimeApts) => {
          setAppointments(realtimeApts);
          fetchAdminMetrics().then(setMetrics).catch(() => {});
        },
        (err) => {
          console.warn('Realtime subscription notice in Admin:', err);
        }
      );
    } catch (e) {
      console.warn('Could not start admin real-time listener:', e);
    }

    // 3. Resilient Polling every 8 seconds
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAll(true);
      }
    }, 8000);

    // 4. Focus / visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadAll(true);
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (unsub) unsub();
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  // Appointment status update
  const handleAptStatusChange = async (id: string, status: string) => {
    try {
      await updateAppointmentStatus(id, status);
      await loadAll();
      showToast('Status do agendamento atualizado com sucesso!');
    } catch (e) {
      showToast('Erro ao atualizar status', 'error');
    }
  };

  // Service form submit
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await updateService(editingService.id, {
          name: srvName,
          description: srvDesc,
          price: parseFloat(srvPrice),
          duration_minutes: parseInt(srvDuration, 10),
          category: srvCategory,
        });
      } else {
        await createService({
          name: srvName,
          description: srvDesc,
          price: parseFloat(srvPrice),
          duration_minutes: parseInt(srvDuration, 10),
          category: srvCategory,
          active: true,
        });
      }
      setServiceModalOpen(false);
      setEditingService(null);
      await loadAll();
      showToast('Serviço salvo com sucesso!');
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar serviço', 'error');
    }
  };

  const handleOpenEditService = (srv: Service) => {
    setEditingService(srv);
    setSrvName(srv.name);
    setSrvDesc(srv.description);
    setSrvPrice(String(srv.price));
    setSrvDuration(String(srv.duration_minutes));
    setSrvCategory(srv.category || 'cabelo');
    setServiceModalOpen(true);
  };

  const handleToggleService = async (id: string) => {
    try {
      await toggleServiceActive(id);
      await loadAll();
      showToast('Status do serviço alternado!');
    } catch (e) {
      showToast('Erro ao alternar status do serviço', 'error');
    }
  };

  // Barber form submit
  const handleSaveBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const specs = brbSpecialties.split(',').map(s => s.trim()).filter(Boolean);
      if (editingBarber) {
        await updateBarber(editingBarber.id, {
          name: brbName,
          nickname: brbNickname,
          bio: brbBio,
          photo_url: brbPhoto || undefined,
          specialties: specs,
          phone: brbPhone,
          email: brbEmail,
        });
      } else {
        await createBarber({
          name: brbName,
          nickname: brbNickname,
          bio: brbBio,
          photo_url: brbPhoto || undefined,
          specialties: specs,
          phone: brbPhone,
          email: brbEmail,
          active: true,
        });
      }
      setBarberModalOpen(false);
      setEditingBarber(null);
      await loadAll();
      showToast('Barbeiro salvo com sucesso!');
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar barbeiro', 'error');
    }
  };

  const handleOpenEditBarber = (b: Barber) => {
    setEditingBarber(b);
    setBrbName(b.name);
    setBrbNickname(b.nickname);
    setBrbBio(b.bio);
    setBrbPhoto(b.photo_url);
    setBrbSpecialties(b.specialties.join(', '));
    setBrbPhone(b.phone);
    setBrbEmail(b.email);
    setBarberModalOpen(true);
  };

  const handleToggleBarber = async (b: Barber) => {
    try {
      await updateBarber(b.id, { active: !b.active });
      await loadAll();
      showToast('Status do barbeiro atualizado!');
    } catch (e) {
      showToast('Erro ao alternar status do barbeiro', 'error');
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(a => {
    if (filterBarber !== 'all' && a.barber_id !== filterBarber) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = a.customer_name.toLowerCase().includes(term);
      const matchCode = a.code.toLowerCase().includes(term);
      const matchPhone = a.customer_phone.includes(term);
      if (!matchName && !matchCode && !matchPhone) return false;
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0e11] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
      </div>
    );
  }

  // If not logged in, render the dedicated Admin Portal login screen with App Download
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d0e11]">
        <DedicatedRolePortalLogin role="admin" onLoginSuccess={() => loadAll()} />
      </div>
    );
  }

  // If user is not an admin or owner, notice
  if (user.role !== 'admin' && user.role !== 'owner') {
    return (
      <div className="min-h-screen bg-[#0d0e11] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-[#262b3a] bg-[#12141c] p-6 text-center space-y-3">
          <Shield className="w-10 h-10 text-blue-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Acesso Restrito ao Administrador</h2>
          <p className="text-xs text-neutral-400">
            Sua conta atual ({user.name}) tem permissão de Barbeiro.
          </p>
          <button
            onClick={() => navigate('/barbeiro')}
            className="w-full py-2.5 rounded-xl bg-[#d4af37] text-black font-bold text-xs"
          >
            Ir para Meu Painel de Barbeiro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e11] py-4 sm:py-6">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        
        {/* Admin Header - Compact Mobile-First */}
        <div className="rounded-2xl border border-[#232733] bg-[#12141c] p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#181a24] border-2 border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#d4af37]/20 border border-[#d4af37]/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#f5d77f]">
                  Gestão Geral
                </span>
                <span className="text-xs text-neutral-400">{settings.name || 'Líder Barbers'}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white font-cinzel mt-0.5">
                PAINEL ADMINISTRATIVO
              </h1>
              <p className="text-[11px] text-neutral-400">
                Faturamento previsto, agendamentos, acesso dos barbeiros e identidade visual.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão Copiar meu link de cliente */}
            <button
              onClick={handleCopyClientLink}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition cursor-pointer shadow-md ${
                copiedLink
                  ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] text-[#0d0e11] hover:brightness-110 shadow-[#d4af37]/20'
              }`}
              title="Copiar link exclusivo de agendamento do Administrador/Barbeiro"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar meu link de cliente'}</span>
            </button>

            {user.role === 'owner' && (
              <button
                onClick={() => navigate('/proprietario')}
                className="flex items-center gap-1.5 rounded-xl border border-[#d4af37] bg-[#d4af37]/15 px-3 py-1.5 text-xs font-black text-[#f5d77f] hover:bg-[#d4af37]/25 cursor-pointer"
                title="Voltar para a área de proprietário"
              >
                <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Área do Dono</span>
              </button>
            )}

            {/* Realtime Live Indicator */}
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Tempo Real</span>
              <span className="sm:hidden">Ao Vivo</span>
            </div>

            <button
              onClick={() => loadAll(false)}
              className="flex items-center gap-1.5 rounded-xl border border-[#2c3243] bg-[#161822] px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#d4af37] ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={() => navigate('/barbeiro')}
              className="flex items-center gap-1.5 rounded-xl border border-[#2c3243] bg-[#161822] px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
            >
              <span>Ver Como Barbeiro</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* SECTION: BAIXAR APLICATIVO DO ADMINISTRADOR NO CELULAR */}
        <RoleAppDownloadCard role="admin" />

        {/* Card: Link Exclusivo do Administrador / Barbeiro */}
        <div className="rounded-2xl border border-[#d4af37]/35 bg-gradient-to-r from-[#141722] via-[#1a1e2d] to-[#141722] p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white font-cinzel">
                  Link Exclusivo de Cliente (Admin & Barbeiro)
                </span>
                <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                  Agendamento Direto
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Como Administrador, você também é Barbeiro e recebe agendamentos. Clientes que abrirem este link já terão seu perfil pré-selecionado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#0d0e14] border border-[#272c3d] rounded-xl px-3 py-1.5 text-xs text-[#f5d77f] font-mono max-w-xs truncate">
              {clientLink}
            </div>

            <button
              onClick={handleCopyClientLink}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition cursor-pointer shadow-lg ${
                copiedLink 
                  ? 'bg-emerald-500 text-black shadow-emerald-500/30' 
                  : 'bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] text-[#0d0e11] hover:brightness-110 shadow-[#d4af37]/25'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar meu link de cliente'}</span>
            </button>

            <button
              onClick={handleShareClientLinkWhatsApp}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-600/30 cursor-pointer transition shadow-md"
              title="Enviar link para clientes no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => navigate(`/agendar?barbeiro=${encodeURIComponent(adminBarberName)}`)}
              className="flex items-center gap-1.5 rounded-xl border border-[#2c3243] bg-[#161822] px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
              title="Testar agendamento com este link"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Testar</span>
            </button>
          </div>
        </div>

        {/* Banner if viewing as owner */}
        {user.role === 'owner' && (
          <div className="rounded-2xl border border-[#d4af37]/40 bg-[#d4af37]/10 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#f5d77f] shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Você está visualizando o Painel da Barbearia como <span className="text-[#f5d77f]">Dono do Aplicativo</span>
                </p>
                <p className="text-[11px] text-neutral-300">
                  Aqui o seu Administrador gerencia e cadastra os <strong className="text-white">Barbeiros</strong>, serviços e atendimentos.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/proprietario')}
              className="flex items-center gap-1.5 rounded-xl bg-[#d4af37] px-3.5 py-1.5 text-xs font-black text-[#0d0e11] hover:brightness-110 transition cursor-pointer shrink-0"
            >
              <span>← Voltar para Cadastrar Admins</span>
            </button>
          </div>
        )}

        {/* Navigation Tabs - Compact with Horizontal Scroll on Mobile */}
        <div className="flex border-b border-[#232733] gap-1 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('metricas')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'metricas'
                ? 'border-[#d4af37] bg-[#161822] text-[#f5d77f]'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#13151c]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Métricas</span>
          </button>

          <button
            onClick={() => setActiveTab('agendamentos')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'agendamentos'
                ? 'border-[#d4af37] bg-[#161822] text-[#f5d77f]'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#13151c]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agendamentos</span>
            <span className="rounded-full bg-[#202433] px-1.5 py-0.2 text-[10px] text-white">
              {appointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('servicos')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'servicos'
                ? 'border-[#d4af37] bg-[#161822] text-[#f5d77f]'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#13151c]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Serviços</span>
            <span className="rounded-full bg-[#202433] px-1.5 py-0.2 text-[10px] text-white">
              {services.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('acessos')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'acessos'
                ? 'border-[#d4af37] bg-[#161822] text-[#f5d77f]'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#13151c]'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Cadastrar Barbeiros</span>
            <span className="rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 px-1.5 py-0.2 text-[9px] font-extrabold text-[#f5d77f]">
              LOGINS & COMISSÕES
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('barbeiros')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'barbeiros'
                ? 'border-[#d4af37] bg-[#161822] text-[#f5d77f]'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#13151c]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipe & Fotos</span>
            <span className="rounded-full bg-[#202433] px-1.5 py-0.2 text-[10px] text-white">
              {barbers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('identidade')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'identidade'
                ? 'border-[#d4af37] bg-[#161822] text-[#f5d77f]'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#13151c]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Logo & Capa</span>
          </button>
        </div>

        {/* TAB 1: MÉTRICAS & FATURAMENTO */}
        {activeTab === 'metricas' && metrics && (
          <div className="space-y-6">
            
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="rounded-2xl border border-[#272c3c] bg-[#13151e] p-5 space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Faturamento Previsto</span>
                  <DollarSign className="w-4 h-4 text-[#d4af37]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-cinzel">
                  R$ {Number(metrics?.totalForecastRevenue || 0).toFixed(2).replace('.', ',')}
                </div>
                <span className="text-[11px] text-neutral-400 block">
                  Agendamentos ativos (confirmados + concluídos)
                </span>
              </div>

              <div className="rounded-2xl border border-[#272c3c] bg-[#13151e] p-5 space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Faturamento Realizado</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-cinzel">
                  R$ {Number(metrics?.totalRealizedRevenue || 0).toFixed(2).replace('.', ',')}
                </div>
                <span className="text-[11px] text-neutral-400 block">
                  Serviços com status "Concluído"
                </span>
              </div>

              <div className="rounded-2xl border border-[#272c3c] bg-[#13151e] p-5 space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Atendimentos Confirmados</span>
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-cinzel">
                  {metrics?.confirmed ?? 0}
                </div>
                <span className="text-[11px] text-neutral-400 block">
                  Clientes agendados aguardando horário
                </span>
              </div>

              <div className="rounded-2xl border border-[#272c3c] bg-[#13151e] p-5 space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Ausentes / Cancelados</span>
                  <XCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-400 font-cinzel">
                  {metrics?.noShow ?? 0} / {metrics?.cancelled ?? 0}
                </div>
                <span className="text-[11px] text-neutral-400 block">
                  Perdas / desmarcações registradas
                </span>
              </div>

            </div>

            {/* Revenue breakdown by barber */}
            <div className="rounded-3xl border border-[#232733] bg-[#12141c] p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-white font-cinzel">
                Desempenho & Faturamento por Barbeiro
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metrics.barberMetrics?.map((bm: any) => (
                  <div
                    key={bm.barber_id}
                    className="rounded-2xl border border-[#242838] bg-[#161824] p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{bm.name}</h4>
                        <span className="text-xs text-[#d4af37] font-semibold">{bm.nickname}</span>
                      </div>
                      <span className="rounded-full bg-[#202434] px-2.5 py-1 text-xs font-bold text-white">
                        {bm.total_appointments ?? 0} atendimentos
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#202434]">
                      <span className="text-[11px] text-neutral-400 block">Faturamento Estimado:</span>
                      <span className="text-xl font-black text-[#f5d77f] font-cinzel">
                        R$ {Number(bm?.revenue || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: TODOS OS AGENDAMENTOS */}
        {activeTab === 'agendamentos' && (
          <div className="space-y-4">
            
            {/* Filter Bar */}
            <div className="rounded-2xl border border-[#232733] bg-[#12141c] p-4 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, código ou fone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-[#292e3e] bg-[#161822] pl-10 pr-4 py-2 text-xs text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
                <select
                  value={filterBarber}
                  onChange={(e) => setFilterBarber(e.target.value)}
                  className="rounded-xl border border-[#292e3e] bg-[#161822] px-3 py-2 text-xs text-white focus:border-[#d4af37]"
                >
                  <option value="all">Todos os Barbeiros</option>
                  {barbers.map(b => (
                    <option key={b.id} value={b.id}>{b.nickname}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-[#292e3e] bg-[#161822] px-3 py-2 text-xs text-white focus:border-[#d4af37]"
                >
                  <option value="all">Todos os Status</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="completed">Concluídos</option>
                  <option value="no_show">Ausentes</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[#232733] bg-[#12141c] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-[#171924] text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-[#232733]">
                    <tr>
                      <th className="py-3.5 px-4">Código / Cliente</th>
                      <th className="py-3.5 px-4">Data & Horário</th>
                      <th className="py-3.5 px-4">Serviço / Preço</th>
                      <th className="py-3.5 px-4">Barbeiro</th>
                      <th className="py-3.5 px-4">Situação</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e222f]">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-neutral-500">
                          Nenhum agendamento encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-[#161824] transition">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-[#f5d77f] block">
                              {apt.code}
                            </span>
                            <span className="font-bold text-white text-sm block">
                              {apt.customer_name}
                            </span>
                            <span className="text-neutral-400 text-[11px]">
                              {apt.customer_phone}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <strong className="text-white block font-mono">
                              {(apt.date || '').split('-').reverse().join('/')}
                            </strong>
                            <span className="text-neutral-400">
                              {apt.start_time} - {apt.end_time}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <strong className="text-white block">
                              {apt.service?.name}
                            </strong>
                            <span className="text-[#f5d77f] font-bold">
                              R$ {Number(apt?.price || 0).toFixed(2).replace('.', ',')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-neutral-200 block">
                              {apt.barber?.nickname || 'Barbeiro'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              apt.status === 'confirmed'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : apt.status === 'completed'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : apt.status === 'no_show'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}>
                              {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'completed' ? 'Concluído' : apt.status === 'no_show' ? 'Ausente' : 'Cancelado'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <select
                              value={apt.status}
                              onChange={(e) => handleAptStatusChange(apt.id, e.target.value)}
                              className="rounded-lg border border-[#2b3040] bg-[#191c28] px-2 py-1 text-[11px] text-white focus:border-[#d4af37]"
                            >
                              <option value="confirmed">Confirmado</option>
                              <option value="completed">Concluído</option>
                              <option value="no_show">Ausente</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: SERVIÇOS */}
        {activeTab === 'servicos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white font-cinzel">Catálogo de Serviços</h3>
                <p className="text-xs text-neutral-400">Cadastre ou edite preços e durações dos serviços oferecidos.</p>
              </div>
              <button
                onClick={() => {
                  setEditingService(null);
                  setSrvName('');
                  setSrvDesc('');
                  setSrvPrice('50');
                  setSrvDuration('45');
                  setSrvCategory('cabelo');
                  setServiceModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2.5 text-xs font-bold text-[#0d0e11] hover:brightness-110 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Serviço</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition ${
                    srv.active
                      ? 'border-[#242838] bg-[#12141c]'
                      : 'border-[#222530] bg-[#111218] opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${srv.active ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                          {srv.category}
                        </span>
                      </div>
                      <span className="text-xl font-black text-[#f5d77f] font-cinzel">
                        R$ {Number(srv?.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mt-2">{srv.name}</h4>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{srv.description}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-300">
                      <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{srv.duration_minutes} minutos</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#1e222f] flex items-center justify-between">
                    <button
                      onClick={() => handleToggleService(srv.id)}
                      className={`text-xs font-semibold ${
                        srv.active ? 'text-amber-400 hover:underline' : 'text-emerald-400 hover:underline'
                      }`}
                    >
                      {srv.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleOpenEditService(srv)}
                      className="flex items-center gap-1 text-xs font-bold text-white hover:text-[#d4af37]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BARBEIROS */}
        {activeTab === 'barbeiros' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white font-cinzel">Equipe de Barbeiros</h3>
                <p className="text-xs text-neutral-400">Cadastre novos profissionais ou edite fotos e especialidades.</p>
              </div>
              <button
                onClick={() => {
                  setEditingBarber(null);
                  setBrbName('');
                  setBrbNickname('');
                  setBrbBio('');
                  setBrbPhoto('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600');
                  setBrbSpecialties('Corte Clássico, Fade');
                  setBrbPhone('(11) 99999-9999');
                  setBrbEmail('');
                  setBarberModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2.5 text-xs font-bold text-[#0d0e11] hover:brightness-110 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Barbeiro</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {barbers.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-2xl border overflow-hidden flex flex-col justify-between ${
                    b.active
                      ? 'border-[#242838] bg-[#12141c]'
                      : 'border-[#222530] bg-[#111218] opacity-60'
                  }`}
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.photo_url}
                        alt={b.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#d4af37]/40"
                      />
                      <div>
                        <h4 className="text-base font-bold text-white">{b.name}</h4>
                        <span className="text-xs font-bold text-[#d4af37]">{b.nickname}</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400 line-clamp-3">{b.bio}</p>

                    <div className="flex flex-wrap gap-1">
                      {b.specialties.map((sp, i) => (
                        <span key={i} className="rounded bg-[#181a24] border border-[#262b3a] px-2 py-0.5 text-[10px] text-neutral-300">
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#0e1015] border-t border-[#1e222f] flex items-center justify-between">
                    <button
                      onClick={() => handleToggleBarber(b)}
                      className={`text-xs font-semibold ${
                        b.active ? 'text-amber-400 hover:underline' : 'text-emerald-400 hover:underline'
                      }`}
                    >
                      {b.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleOpenEditBarber(b)}
                      className="flex items-center gap-1 text-xs font-bold text-white hover:text-[#d4af37]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Perfil</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: ACESSO DOS BARBEIROS (LOGINS & COMISSÕES) */}
        {activeTab === 'acessos' && (
          <AdminBarberAccountsTab />
        )}

        {/* TAB 5: IDENTIDADE VISUAL & FOTOS */}
        {activeTab === 'identidade' && (
          <AdminSettingsTab onNotify={showToast} />
        )}

      </div>

      {/* SERVICE MODAL */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#292e3e] bg-[#14161f] p-6 shadow-2xl text-left space-y-4">
            <h3 className="text-base font-bold text-white font-cinzel">
              {editingService ? 'Editar Serviço' : 'Novo Atendimento'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  value={srvName}
                  onChange={(e) => setSrvName(e.target.value)}
                  placeholder="Ex: Corte Degradê Premium"
                  className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={srvDesc}
                  onChange={(e) => setSrvDesc(e.target.value)}
                  placeholder="Detalhes do atendimento..."
                  className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(e.target.value)}
                    className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Duração (min) *</label>
                  <input
                    type="number"
                    step="5"
                    required
                    value={srvDuration}
                    onChange={(e) => setSrvDuration(e.target.value)}
                    className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Categoria</label>
                <select
                  value={srvCategory}
                  onChange={(e) => setSrvCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                >
                  <option value="cabelo">Cabelo</option>
                  <option value="barba">Barba</option>
                  <option value="combo">Combo</option>
                  <option value="tratamento">Tratamento / Cor</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="w-1/2 rounded-xl border border-[#2e3344] py-2.5 text-xs font-semibold text-neutral-300 hover:bg-[#1a1d27]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-[#d4af37] py-2.5 text-xs font-bold text-[#0d0e11] hover:brightness-110 shadow-md"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARBER MODAL */}
      {barberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#292e3e] bg-[#14161f] p-6 shadow-2xl text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white font-cinzel">
              {editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}
            </h3>

            <form onSubmit={handleSaveBarber} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={brbName}
                  onChange={(e) => setBrbName(e.target.value)}
                  placeholder="Ex: Lucas Medeiros"
                  className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Apelido / Nome de Bancada</label>
                <input
                  type="text"
                  value={brbNickname}
                  onChange={(e) => setBrbNickname(e.target.value)}
                  placeholder="Ex: Mestre Lucas"
                  className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Biografia Curta</label>
                <textarea
                  rows={2}
                  value={brbBio}
                  onChange={(e) => setBrbBio(e.target.value)}
                  placeholder="Experiência, especialidades..."
                  className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Foto do Barbeiro</label>
                <div className="flex items-center gap-3 mb-2">
                  {brbPhoto ? (
                    <img
                      src={brbPhoto}
                      alt="Prévia"
                      className="w-12 h-12 rounded-xl object-cover border-2 border-[#d4af37]/60 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#191c28] border border-[#2b3040] flex items-center justify-center text-[#d4af37] shrink-0">
                      <Scissors className="w-5 h-5 -rotate-45" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 rounded-xl border border-[#d4af37]/50 bg-[#171a25] px-3 py-2 text-xs font-semibold text-[#f5d77f] hover:bg-[#1d2130] cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Escolher Foto do Computador / Celular</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.type.startsWith('image/')) {
                            showToast('Selecione uma imagem válida', 'error');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setBrbPhoto(ev.target.result as string);
                              showToast('Foto do barbeiro carregada!');
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
                <input
                  type="url"
                  value={brbPhoto.startsWith('data:') ? '(Foto selecionada via arquivo do dispositivo)' : brbPhoto}
                  onChange={(e) => setBrbPhoto(e.target.value)}
                  placeholder="Ou cole o link direto da imagem: https://..."
                  disabled={brbPhoto.startsWith('data:')}
                  className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37] disabled:opacity-75"
                />
                {brbPhoto.startsWith('data:') && (
                  <button
                    type="button"
                    onClick={() => setBrbPhoto('')}
                    className="mt-1 text-[11px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Remover foto carregada
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Especialidades (separadas por vírgula)</label>
                <input
                  type="text"
                  value={brbSpecialties}
                  onChange={(e) => setBrbSpecialties(e.target.value)}
                  placeholder="Ex: Skin Fade, Barba Tradicional, Tesoura"
                  className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={brbPhone}
                    onChange={(e) => setBrbPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={brbEmail}
                    onChange={(e) => setBrbEmail(e.target.value)}
                    placeholder="lucas@liberdade.com.br"
                    className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setBarberModalOpen(false)}
                  className="w-1/2 rounded-xl border border-[#2e3344] py-2.5 text-xs font-semibold text-neutral-300 hover:bg-[#1a1d27]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-[#d4af37] py-2.5 text-xs font-bold text-[#0d0e11] hover:brightness-110 shadow-md"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'error'
              ? 'border-rose-500/40 bg-[#1e1518] text-rose-300'
              : 'border-[#d4af37]/40 bg-[#161822] text-[#f5d77f]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
};
