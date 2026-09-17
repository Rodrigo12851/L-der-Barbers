import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Appointment, BarberSchedule, BarberTimeOff, Barber } from '../types';
import { 
  fetchAppointments, 
  updateAppointmentStatus, 
  fetchBarberSchedules, 
  saveBarberSchedules, 
  fetchBarberTimeOff, 
  addBarberTimeOff, 
  deleteBarberTimeOff,
  fetchBarbers
} from '../lib/api';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  AlertCircle,
  Phone, 
  Scissors, 
  Settings, 
  User, 
  CalendarOff, 
  Plus, 
  Trash2, 
  Save,
  Filter,
  RefreshCw,
  LogOut,
  ShieldAlert,
  DollarSign,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  Share2
} from 'lucide-react';
import { BarberRevenueTab } from '../components/BarberRevenueTab';
import { RoleAppDownloadCard } from '../components/RoleAppDownloadCard';
import { DedicatedRolePortalLogin } from '../components/DedicatedRolePortalLogin';

export const BarberDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'agenda' | 'faturamento' | 'horarios' | 'folgas'>('agenda');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedules, setSchedules] = useState<BarberSchedule[]>([]);
  const [timeOffs, setTimeOffs] = useState<BarberTimeOff[]>([]);
  const [allBarbers, setAllBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [dateFilter, setDateFilter] = useState<'hoje' | 'amanha' | 'semana' | 'todos'>('hoje');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Derive active barber ID for client link
  const currentBarberId = selectedBarberId || user?.barber_id || user?.id || '';
  const clientLink = `${window.location.origin}/agendar?barbeiro=${currentBarberId}`;

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
    const barber = allBarbers.find(b => b.id === currentBarberId) || user;
    const barberName = (barber as any)?.nickname || barber?.name || 'Barbeiro';
    const text = encodeURIComponent(
      `💈 *Agendamento Exclusivo — ${barberName} | Líder Barbers*\n\nReserve seu horário diretamente comigo pelo link abaixo:\n🔗 ${clientLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // New time off modal/form
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [offDate, setOffDate] = useState('');
  const [offReason, setOffReason] = useState('');
  const [offFullDay, setOffFullDay] = useState(true);
  const [offStartTime, setOffStartTime] = useState('14:00');
  const [offEndTime, setOffEndTime] = useState('16:00');

  // Inline toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Today and Tomorrow strings
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  useEffect(() => {
    // Session is checked inline in render
  }, [user, authLoading]);

  // Determine current barberId
  useEffect(() => {
    if (user) {
      const bId = user.barber_id || (user.role === 'admin' ? 'barber-1' : '');
      setSelectedBarberId(bId);
      if (user.role === 'admin') {
        fetchBarbers().then(setAllBarbers).catch(console.error);
      }
    }
  }, [user]);

  // Load appointments, schedules, and time offs whenever selectedBarberId changes
  const loadBarberData = async () => {
    if (!selectedBarberId) return;
    setLoading(true);
    try {
      const [apts, scheds, offs] = await Promise.all([
        fetchAppointments({ barberId: selectedBarberId }),
        fetchBarberSchedules(selectedBarberId),
        fetchBarberTimeOff(selectedBarberId),
      ]);
      setAppointments(apts);
      setSchedules(scheds);
      setTimeOffs(offs);
    } catch (e) {
      console.error('Error loading barber dashboard data', e);
      showToast('Erro ao carregar dados do barbeiro.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBarberId) {
      loadBarberData();
    }
  }, [selectedBarberId]);

  // Update appointment status handler
  const handleStatusChange = async (aptId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(aptId, newStatus);
      setAppointments(prev =>
        prev.map(a => (a.id === aptId ? { ...a, status: newStatus as any } : a))
      );
      showToast('Status do agendamento atualizado com sucesso!');
    } catch (e) {
      showToast('Erro ao atualizar status do agendamento.', 'error');
    }
  };

  // Schedule change handler
  const handleScheduleToggle = (index: number) => {
    const updated = [...schedules];
    updated[index].active = !updated[index].active;
    setSchedules(updated);
  };

  const handleScheduleFieldChange = (index: number, field: keyof BarberSchedule, value: string) => {
    const updated = [...schedules];
    (updated[index] as any)[field] = value;
    setSchedules(updated);
  };

  const handleSaveSchedules = async () => {
    if (!selectedBarberId) return;
    try {
      await saveBarberSchedules(selectedBarberId, schedules);
      showToast('Horários de atendimento salvos com sucesso!');
    } catch (e) {
      showToast('Erro ao salvar horários de atendimento.', 'error');
    }
  };

  // Add Time Off handler
  const handleAddTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offDate || !selectedBarberId) return;
    try {
      const created = await addBarberTimeOff(selectedBarberId, {
        date: offDate,
        reason: offReason || 'Bloqueio de agenda',
        full_day: offFullDay,
        start_time: offFullDay ? undefined : offStartTime,
        end_time: offFullDay ? undefined : offEndTime,
      });
      setTimeOffs(prev => [...prev, created]);
      setShowTimeOffModal(false);
      setOffDate('');
      setOffReason('');
      showToast('Bloqueio registrado com sucesso!');
    } catch (e) {
      showToast('Erro ao adicionar bloqueio.', 'error');
    }
  };

  const handleDeleteTimeOff = async (id: string) => {
    try {
      await deleteBarberTimeOff(id);
      setTimeOffs(prev => prev.filter(o => o.id !== id));
      showToast('Bloqueio removido com sucesso!');
    } catch (e) {
      showToast('Erro ao excluir bloqueio.', 'error');
    }
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;

    if (dateFilter === 'hoje') {
      return a.date === todayStr;
    }
    if (dateFilter === 'amanha') {
      return a.date === tomorrowStr;
    }
    if (dateFilter === 'semana') {
      // within next 7 days
      const d = new Date(a.date);
      const now = new Date();
      const diffDays = (d.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays >= -1 && diffDays <= 7;
    }
    return true;
  });

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0e11] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
      </div>
    );
  }

  // If not logged in, render the dedicated Barber Portal login screen with App Download
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d0e11]">
        <DedicatedRolePortalLogin role="barber" onLoginSuccess={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e11] py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Profile & Header Bar */}
        <div className="rounded-3xl border border-[#232733] bg-[#12141c] p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#181a24] border-2 border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0 overflow-hidden">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#d4af37]/20 border border-[#d4af37]/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#f5d77f]">
                  Painel do Barbeiro
                </span>
                {user.role === 'admin' && (
                  <span className="rounded-md bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                    Modo Admin
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-cinzel mt-1">
                {user.name}
              </h1>
              <p className="text-xs text-neutral-400">
                Gerencie sua agenda de atendimentos, expedientes e bloqueios de folga.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Botão Copiar meu link de cliente */}
            <button
              onClick={handleCopyClientLink}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition cursor-pointer shadow-md ${
                copiedLink
                  ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] text-[#0d0e11] hover:brightness-110 shadow-[#d4af37]/20'
              }`}
              title="Copiar link exclusivo de agendamento para clientes"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar meu link de cliente'}</span>
            </button>

            {/* If Admin, allow selecting which barber to view */}
            {user.role === 'admin' && allBarbers.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#171924] border border-[#292f3f] rounded-xl px-3 py-1.5 text-xs text-neutral-200">
                <span className="text-neutral-400 text-[11px]">Ver Barbeiro:</span>
                <select
                  value={selectedBarberId}
                  onChange={(e) => setSelectedBarberId(e.target.value)}
                  className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
                >
                  {allBarbers.map(b => (
                    <option key={b.id} value={b.id} className="bg-[#12141c] text-white">
                      {b.nickname}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={loadBarberData}
              className="flex items-center gap-1.5 rounded-xl border border-[#2c3243] bg-[#161822] px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#d4af37] ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* SECTION: BAIXAR APLICATIVO DO BARBEIRO NO CELULAR */}
        <RoleAppDownloadCard role="barber" />

        {/* Card: Link Exclusivo do Barbeiro */}
        <div className="rounded-2xl border border-[#d4af37]/35 bg-gradient-to-r from-[#141722] via-[#1a1e2d] to-[#141722] p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white font-cinzel">
                  Seu Link Exclusivo de Cliente
                </span>
                <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                  Link Direto
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Envie aos seus clientes pelo WhatsApp ou Instagram. Ao acessar, você já estará pré-selecionado na agenda para atendimento direto.
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
              onClick={() => navigate(`/agendar?barbeiro=${currentBarberId}`)}
              className="flex items-center gap-1.5 rounded-xl border border-[#2c3243] bg-[#161822] px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
              title="Testar agendamento com este link"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Testar</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#232733] gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'agenda'
                ? 'border-[#d4af37] bg-[#161822] text-[#f5d77f]'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#13151c]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Agenda</span>
            <span className="rounded-full bg-[#202433] px-1.5 py-0.2 text-[10px] text-white">
              {appointments.filter(a => a.status === 'confirmed').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('faturamento')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'faturamento'
                ? 'border-[#d4af37] bg-[#161822] text-[#f5d77f]'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#13151c]'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Meu Faturamento</span>
          </button>

          <button
            onClick={() => setActiveTab('horarios')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'horarios'
                ? 'border-[#d4af37] bg-[#161822] text-[#f5d77f]'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#13151c]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Expediente</span>
          </button>

          <button
            onClick={() => setActiveTab('folgas')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'folgas'
                ? 'border-[#d4af37] bg-[#161822] text-[#f5d77f]'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#13151c]'
            }`}
          >
            <CalendarOff className="w-3.5 h-3.5" />
            <span>Folgas & Bloqueios</span>
            <span className="rounded-full bg-[#202433] px-1.5 py-0.2 text-[10px] text-white">
              {timeOffs.length}
            </span>
          </button>
        </div>

        {/* TAB: FATURAMENTO INDIVIDUAL */}
        {activeTab === 'faturamento' && (
          <BarberRevenueTab 
            barberId={selectedBarberId} 
            barberName={allBarbers.find(b => b.id === selectedBarberId)?.name} 
          />
        )}

        {/* TAB 1: AGENDA */}
        {activeTab === 'agenda' && (
          <div className="space-y-4">
            
            {/* Filters Bar */}
            <div className="rounded-2xl border border-[#232733] bg-[#12141c] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <span className="text-xs text-neutral-400 mr-2 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Período:</span>
                </span>
                {(['hoje', 'amanha', 'semana', 'todos'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setDateFilter(period)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition whitespace-nowrap ${
                      dateFilter === period
                        ? 'bg-[#d4af37] text-[#0d0e11]'
                        : 'bg-[#181a24] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {period === 'hoje' ? 'Hoje' : period === 'amanha' ? 'Amanhã' : period === 'semana' ? 'Esta Semana' : 'Todos'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-neutral-400 text-right">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-[#2b3040] bg-[#161822] px-3 py-1.5 text-xs text-white focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="all">Todos os Status</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="completed">Concluídos</option>
                  <option value="no_show">Ausentes</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>
            </div>

            {/* Appointment Cards List */}
            {filteredAppointments.length === 0 ? (
              <div className="rounded-2xl border border-[#232733] bg-[#12141c] p-12 text-center space-y-2">
                <Calendar className="w-8 h-8 text-neutral-600 mx-auto" />
                <h3 className="text-sm font-bold text-neutral-300">Nenhum agendamento encontrado</h3>
                <p className="text-xs text-neutral-500">
                  Não há agendamentos para o filtro selecionado no momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="rounded-2xl border border-[#222634] bg-[#13151e] p-3.5 space-y-2.5 hover:border-[#d4af37]/40 transition shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#1a1d28] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-[#f5d77f]">
                              {apt.code}
                            </span>
                            <span className="text-white font-mono text-xs font-bold">
                              • {apt.start_time}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white truncate">{apt.customer_name}</h3>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
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
                    </div>

                    <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-[#181b26] border border-[#202534]">
                      <div className="truncate mr-2">
                        <span className="text-neutral-300 font-semibold">{apt.service?.name}</span>
                        <span className="text-[10px] text-neutral-500 ml-1.5">({(apt.date || '').split('-').reverse().slice(0, 2).join('/')})</span>
                      </div>
                      <span className="text-xs font-black text-[#f5d77f] shrink-0">
                        R$ {Number(apt?.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-0.5">
                      <div className="flex items-center gap-2">
                        {apt.customer_phone && (
                          <a 
                            href={`https://wa.me/55${apt.customer_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20"
                          >
                            <Phone className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <span className="text-[10px] text-neutral-400">{apt.customer_phone}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        {apt.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'completed')}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                            title="Marcar como concluído"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Concluir</span>
                          </button>
                        )}

                        {apt.status !== 'no_show' && apt.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'no_show')}
                            className="flex items-center gap-1 rounded-lg bg-amber-600/20 border border-amber-500/40 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-600 hover:text-white transition cursor-pointer"
                            title="Marcar ausência"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span className="hidden sm:inline">Ausente</span>
                          </button>
                        )}

                        {apt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'cancelled')}
                            className="flex items-center gap-1 rounded-lg bg-rose-600/20 border border-rose-500/40 px-2 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                            title="Cancelar agendamento"
                          >
                            <XCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">Cancelar</span>
                          </button>
                        )}

                        {apt.status !== 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'confirmed')}
                            className="rounded-lg border border-[#2e3344] px-2 py-1 text-[10px] font-semibold text-neutral-300 hover:text-white cursor-pointer"
                          >
                            Reabrir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: EXPEDIENTE SEMANAL */}
        {activeTab === 'horarios' && (
          <div className="rounded-3xl border border-[#232733] bg-[#12141c] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#212431]">
              <div>
                <h2 className="text-lg font-bold text-white font-cinzel">Horários de Trabalho Semanais</h2>
                <p className="text-xs text-neutral-400">
                  Defina o expediente por dia da semana e seu intervalo para almoço/pausa.
                </p>
              </div>
              <button
                onClick={handleSaveSchedules}
                className="flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-2.5 text-xs font-bold text-[#0d0e11] hover:brightness-110 shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>

            <div className="divide-y divide-[#1e222f]">
              {schedules.map((sched, idx) => (
                <div key={sched.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-48">
                    <input
                      type="checkbox"
                      checked={sched.active}
                      onChange={() => handleScheduleToggle(idx)}
                      className="w-4 h-4 rounded border-neutral-700 text-[#d4af37] focus:ring-[#d4af37]"
                    />
                    <div>
                      <strong className={`text-sm ${sched.active ? 'text-white' : 'text-neutral-500'}`}>
                        {dayNames[sched.day_of_week]}
                      </strong>
                      <span className="block text-[11px] text-neutral-500">
                        {sched.active ? 'Atendimento ativo' : 'Folga / Fechado'}
                      </span>
                    </div>
                  </div>

                  {sched.active ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-1">
                      <div>
                        <label className="block text-neutral-400 mb-1">Início do Expediente:</label>
                        <input
                          type="time"
                          value={sched.start_time}
                          onChange={(e) => handleScheduleFieldChange(idx, 'start_time', e.target.value)}
                          className="rounded-lg border border-[#2b3040] bg-[#171924] px-3 py-1.5 text-white text-xs w-full focus:border-[#d4af37]"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-400 mb-1">Fim do Expediente:</label>
                        <input
                          type="time"
                          value={sched.end_time}
                          onChange={(e) => handleScheduleFieldChange(idx, 'end_time', e.target.value)}
                          className="rounded-lg border border-[#2b3040] bg-[#171924] px-3 py-1.5 text-white text-xs w-full focus:border-[#d4af37]"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-400 mb-1">Início Almoço/Pausa:</label>
                        <input
                          type="time"
                          value={sched.break_start || '12:00'}
                          onChange={(e) => handleScheduleFieldChange(idx, 'break_start', e.target.value)}
                          className="rounded-lg border border-[#2b3040] bg-[#171924] px-3 py-1.5 text-white text-xs w-full focus:border-[#d4af37]"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-400 mb-1">Fim Almoço/Pausa:</label>
                        <input
                          type="time"
                          value={sched.break_end || '13:00'}
                          onChange={(e) => handleScheduleFieldChange(idx, 'break_end', e.target.value)}
                          className="rounded-lg border border-[#2b3040] bg-[#171924] px-3 py-1.5 text-white text-xs w-full focus:border-[#d4af37]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 italic flex-1">
                      Nenhum agendamento será permitido neste dia da semana.
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#212431] flex justify-end">
              <button
                onClick={handleSaveSchedules}
                className="flex items-center gap-2 rounded-xl bg-[#d4af37] px-6 py-2.5 text-xs font-bold text-[#0d0e11] hover:brightness-110 shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Todos os Horários</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: FOLGAS & BLOQUEIOS */}
        {activeTab === 'folgas' && (
          <div className="rounded-3xl border border-[#232733] bg-[#12141c] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#212431]">
              <div>
                <h2 className="text-lg font-bold text-white font-cinzel">Folgas & Bloqueios Específicos</h2>
                <p className="text-xs text-neutral-400">
                  Bloqueie datas pontuais (férias, cursos, consultas) para impedir novos agendamentos nessas datas.
                </p>
              </div>
              <button
                onClick={() => setShowTimeOffModal(true)}
                className="flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#0d0e11] hover:brightness-110 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Bloqueio</span>
              </button>
            </div>

            {timeOffs.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                Nenhum bloqueio ou folga cadastrado no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {timeOffs.map((off) => (
                  <div
                    key={off.id}
                    className="rounded-2xl border border-[#242938] bg-[#161824] p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-white">
                          {(off.date || '').split('-').reverse().join('/')}
                        </span>
                        <span className="rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                          {off.full_day ? 'Dia Todo' : `${off.start_time} - ${off.end_time}`}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-neutral-300 font-medium">
                        {off.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteTimeOff(off.id)}
                      className="self-end flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition pt-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* NEW TIME OFF MODAL */}
      {showTimeOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#292e3e] bg-[#14161f] p-6 shadow-2xl text-left space-y-4">
            <h3 className="text-base font-bold text-white font-cinzel">Cadastrar Bloqueio de Agenda</h3>
            
            <form onSubmit={handleAddTimeOff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Data do Bloqueio *</label>
                <input
                  type="date"
                  required
                  value={offDate}
                  onChange={(e) => setOffDate(e.target.value)}
                  className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Motivo / Descrição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Treinamento, Consulta, Folga..."
                  value={offReason}
                  onChange={(e) => setOffReason(e.target.value)}
                  className="w-full rounded-xl border border-[#2b3040] bg-[#191c28] px-3.5 py-2 text-xs text-white focus:border-[#d4af37]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fullDayCheck"
                  checked={offFullDay}
                  onChange={(e) => setOffFullDay(e.target.checked)}
                  className="w-4 h-4 rounded text-[#d4af37] focus:ring-[#d4af37]"
                />
                <label htmlFor="fullDayCheck" className="text-xs text-neutral-300 font-semibold cursor-pointer">
                  Bloquear o dia inteiro
                </label>
              </div>

              {!offFullDay && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Hora Início:</label>
                    <input
                      type="time"
                      value={offStartTime}
                      onChange={(e) => setOffStartTime(e.target.value)}
                      className="w-full rounded-lg border border-[#2b3040] bg-[#191c28] px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Hora Fim:</label>
                    <input
                      type="time"
                      value={offEndTime}
                      onChange={(e) => setOffEndTime(e.target.value)}
                      className="w-full rounded-lg border border-[#2b3040] bg-[#191c28] px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTimeOffModal(false)}
                  className="w-1/2 rounded-xl border border-[#2e3344] py-2.5 text-xs font-semibold text-neutral-300 hover:bg-[#1a1d27]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-[#d4af37] py-2.5 text-xs font-bold text-[#0d0e11] hover:brightness-110 shadow-md"
                >
                  Salvar Bloqueio
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
