import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useSettings } from '../context/SettingsContext';
import { Appointment } from '../types';
import { fetchCustomerAppointments, cancelAppointmentByCode } from '../lib/api';
import { getStoredCustomerData, saveCustomerBooking, clearStoredCustomerData } from '../lib/customerStorage';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Share2, 
  ArrowRight, 
  Search, 
  RotateCcw, 
  Sparkles,
  Phone,
  Copy,
  Check,
  CalendarCheck,
  History,
  Info,
  Plus,
  ShieldCheck,
  Trash2
} from 'lucide-react';

export const MyAppointmentsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { settings } = useSettings();

  const [storedData, setStoredData] = useState(() => getStoredCustomerData());
  const [phoneInput, setPhoneInput] = useState(storedData.phone || '');
  const [codeInput, setCodeInput] = useState('');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState<'auto' | 'phone' | 'code'>('auto');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchBox, setShowSearchBox] = useState(false);

  // Cancel dialog
  const [selectedAppointmentToCancel, setSelectedAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClearMyData = () => {
    if (window.confirm('Deseja excluir seus dados (nome, telefone e códigos de reserva) salvos neste dispositivo? Em conformidade com a LGPD (Lei 13.709/2018), suas preferências e histórico local serão completamente removidos.')) {
      clearStoredCustomerData();
      setStoredData({ phone: '', name: '', codes: [] });
      setPhoneInput('');
      setAppointments([]);
      showToast('Seus dados foram removidos deste dispositivo em conformidade com a LGPD.');
    }
  };

  const loadAppointments = async (phoneToUse?: string, codesToUse?: string[]) => {
    setLoading(true);
    setSearchError(null);
    try {
      const p = phoneToUse !== undefined ? phoneToUse : storedData.phone;
      const c = codesToUse !== undefined ? codesToUse : storedData.codes;

      if (!p && (!c || c.length === 0)) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const results = await fetchCustomerAppointments({ phone: p, codes: c });
      setAppointments(results);
    } catch (err: any) {
      console.error('Error fetching customer appointments:', err);
      setSearchError(err.message || 'Erro ao carregar seus agendamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleSearchByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length < 8) {
      setSearchError('Digite um número de telefone válido com DDD.');
      return;
    }

    // Save as active customer phone
    saveCustomerBooking({ code: '', phone: phoneInput.trim() });
    setStoredData(getStoredCustomerData());
    await loadAppointments(phoneInput.trim());
    showToast('Buscando agendamentos para o telefone informado...');
  };

  const handleSearchByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = codeInput.trim().toUpperCase();
    if (!cleanCode) return;

    saveCustomerBooking({ code: cleanCode, phone: '' });
    const updated = getStoredCustomerData();
    setStoredData(updated);
    await loadAppointments(undefined, updated.codes);
    setCodeInput('');
    showToast(`Buscando código ${cleanCode}...`);
  };

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast(`Código ${code} copiado!`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (e) {
      showToast(`Código: ${code}`);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointmentToCancel) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelAppointmentByCode(selectedAppointmentToCancel.code);
      showToast('Agendamento cancelado com sucesso.');
      setSelectedAppointmentToCancel(null);
      // Reload list
      await loadAppointments();
    } catch (err: any) {
      setCancelError(err.message || 'Erro ao cancelar o agendamento.');
    } finally {
      setCancelling(false);
    }
  };

  // Split appointments into Active (Scheduled) and History (Past/Completed/Cancelled)
  const todayStr = new Date().toISOString().split('T')[0];

  const scheduledAppointments = appointments.filter((apt) => {
    if (apt.status !== 'confirmed') return false;
    // Check if future or today
    return (apt.date || '') >= todayStr;
  });

  const historyAppointments = appointments.filter((apt) => {
    // If not in scheduledAppointments, it belongs to history
    return !scheduledAppointments.some((s) => s.id === apt.id);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmado</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Atendimento Concluído</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-400">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelado</span>
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Ausente</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatDateFriendly = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });
    } catch (e) {
      return dateStr.split('-').reverse().join('/');
    }
  };

  const customerDisplayName = storedData.name || (appointments[0]?.customer_name) || '';

  return (
    <div className="min-h-screen bg-[#0d0e11] py-4 sm:py-8">
      <div className="mx-auto max-w-4xl px-3.5 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">
        
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
            <p className="text-xs text-neutral-400">Carregando seus agendamentos...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* ------------------------------------------------------------- */}
            {/* SEÇÃO 1: HORÁRIO AGENDADO / PRÓXIMO AGENDAMENTO ATIVO         */}
            {/* ------------------------------------------------------------- */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse shrink-0" />
                  <h1 className="text-xs sm:text-sm font-bold text-neutral-300 uppercase tracking-widest font-cinzel truncate">
                    Horário Agendado
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/agendar')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/40 bg-[#161822] hover:bg-[#d4af37] text-[#f5d77f] hover:text-[#0d0e11] px-2.5 py-1 text-xs font-bold transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Agendamento</span>
                </button>
              </div>

              {scheduledAppointments.length === 0 ? (
                <div className="rounded-2xl border border-[#232733] bg-[#12141c]/60 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#181a24] border border-[#2b3040] flex items-center justify-center mx-auto text-neutral-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white font-cinzel">Nenhum Agendamento Futuro</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Você não possui horários agendados para os próximos dias. Que tal garantir seu atendimento agora?
                  </p>
                  <button
                    onClick={() => navigate('/agendar')}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 transition cursor-pointer"
                  >
                    <span>Escolher Dia e Horário</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {scheduledAppointments.map((apt) => {
                    const isToday = apt.date === todayStr;
                    return (
                      <div
                        key={apt.id}
                        className="relative rounded-3xl border border-[#d4af37]/50 bg-gradient-to-b from-[#161824] to-[#101118] p-5 sm:p-7 shadow-2xl overflow-hidden"
                      >
                        {/* Gold accent glow */}
                        <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 bg-[#d4af37]/15 rounded-full blur-2xl" />

                        {/* Top Banner Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#242838] gap-3">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 px-3 py-1 text-xs font-black text-[#f5d77f] uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>{isToday ? 'Horário Agendado para Hoje' : 'Próximo Agendamento'}</span>
                            </span>
                            {getStatusBadge(apt.status)}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-neutral-400">Código:</span>
                            <span className="font-mono font-black text-white text-base tracking-wider">
                              {apt.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(apt.code)}
                              className="p-1 rounded-md border border-[#2b3040] bg-[#181a24] text-neutral-300 hover:text-white cursor-pointer"
                              title="Copiar código"
                            >
                              {copiedCode === apt.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Middle Grid */}
                        <div className="py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-[#242838] text-xs">
                          {/* Date */}
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#181b26] border border-[#d4af37]/30 flex items-center justify-center shrink-0 text-[#d4af37]">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-neutral-400 block text-[11px]">Data:</span>
                              <strong className="text-white text-sm block capitalize">
                                {formatDateFriendly(apt.date)}
                              </strong>
                              <span className="text-neutral-400 text-[11px]">
                                {(apt.date || '').split('-').reverse().join('/')}
                              </span>
                            </div>
                          </div>

                          {/* Time */}
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#181b26] border border-[#d4af37]/30 flex items-center justify-center shrink-0 text-[#d4af37]">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-neutral-400 block text-[11px]">Horário:</span>
                              <strong className="text-white text-sm block">
                                {apt.start_time} às {apt.end_time}
                              </strong>
                              <span className="text-[#f5d77f] text-[11px] font-semibold">
                                {apt.service?.duration_minutes || 30} min de atendimento
                              </span>
                            </div>
                          </div>

                          {/* Barber */}
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#181b26] border border-[#d4af37]/30 flex items-center justify-center shrink-0 text-[#d4af37] overflow-hidden">
                              {apt.barber?.photo_url ? (
                                <img src={apt.barber.photo_url} alt={apt.barber.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <span className="text-neutral-400 block text-[11px]">Mestre Barbeiro:</span>
                              <strong className="text-white text-sm block">
                                {apt.barber?.name || 'Barbeiro da Casa'}
                              </strong>
                              <span className="text-[#d4af37] text-[11px] font-semibold">
                                {apt.barber?.nickname || 'Especialista'}
                              </span>
                            </div>
                          </div>

                          {/* Service & Price */}
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#181b26] border border-[#d4af37]/30 flex items-center justify-center shrink-0 text-[#d4af37]">
                              <Scissors className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-neutral-400 block text-[11px]">Serviço:</span>
                              <strong className="text-white text-sm block">
                                {apt.service?.name || 'Corte'}
                              </strong>
                              <span className="text-base font-black text-[#f5d77f] font-cinzel">
                                R$ {Number(apt.price || 0).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/agendamento/${apt.code}`)}
                              className="flex items-center gap-1.5 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 transition cursor-pointer"
                            >
                              <span>Ver Comprovante</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                const text = encodeURIComponent(
                                  `💈 *Meu Agendamento na Líder Barbers*\n\nData: ${apt.date.split('-').reverse().join('/')}\nHorário: ${apt.start_time}\nProfissional: ${apt.barber?.name || 'Barbeiro'}\nServiço: ${apt.service?.name || 'Atendimento'}\nCódigo: ${apt.code}\n\nComprovante: ${window.location.origin}/agendamento/${apt.code}`
                                );
                                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                              }}
                              className="flex items-center gap-1.5 rounded-xl border border-[#2b3040] bg-[#161822] px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>WhatsApp</span>
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedAppointmentToCancel(apt);
                              setCancelError(null);
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
                          >
                            Cancelar este agendamento
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ------------------------------------------------------------- */}
            {/* SEÇÃO 2: HISTÓRICO DE AGENDAMENTOS ANTERIORES                */}
            {/* ------------------------------------------------------------- */}
            <section className="space-y-4 pt-6 border-t border-[#232733]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-[#d4af37]" />
                  <h2 className="text-xs sm:text-sm font-bold text-neutral-300 font-cinzel tracking-widest uppercase">
                    Histórico de Atendimentos
                  </h2>
                </div>
                {historyAppointments.length > 0 && (
                  <span className="text-[11px] text-neutral-400">
                    {historyAppointments.length} {historyAppointments.length === 1 ? 'atendimento anterior' : 'atendimentos anteriores'}
                  </span>
                )}
              </div>

              {historyAppointments.length === 0 ? (
                <div className="rounded-2xl border border-[#232733] bg-[#12141c]/40 p-6 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-neutral-400 text-xs font-semibold">
                    <Info className="w-4 h-4 text-[#d4af37]" />
                    <span>Nenhum atendimento anterior registrado ainda.</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 max-w-md mx-auto">
                    {scheduledAppointments.length > 0
                      ? 'Este é o seu primeiro agendamento na Líder Barbers! Conforme seus atendimentos forem concluídos, o histórico completo aparecerá aqui.'
                      : 'Faça seu primeiro agendamento para iniciar seu histórico de atendimentos e cortes.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="rounded-2xl border border-[#232733] bg-[#12141c] p-4 sm:p-5 hover:border-[#2f3547] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#181a24] border border-[#2b3040] flex items-center justify-center shrink-0 text-[#d4af37]">
                          <Scissors className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-white text-sm font-bold">
                              {apt.service?.name || 'Serviço Barbearia'}
                            </strong>
                            {getStatusBadge(apt.status)}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                              <span>{(apt.date || '').split('-').reverse().join('/')}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-neutral-500" />
                              <span>{apt.start_time}</span>
                            </span>
                            <span className="flex items-center gap-1 text-neutral-300">
                              <User className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>{apt.barber?.name || 'Barbeiro'}</span>
                            </span>
                            <span className="font-mono text-neutral-400">
                              #{apt.code}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1e2230]">
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 block uppercase">Valor</span>
                          <span className="text-sm font-bold text-[#f5d77f] font-cinzel">
                            R$ {Number(apt.price || 0).toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/agendamento/${apt.code}`)}
                            className="rounded-lg border border-[#2b3040] bg-[#181a24] px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
                            title="Ver detalhes da reserva"
                          >
                            Detalhes
                          </button>

                          <button
                            onClick={() => {
                              const barberParam = apt.barber?.name ? `?barbeiro=${encodeURIComponent(apt.barber.name)}` : '';
                              navigate(`/agendar${barberParam}`);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-[#1a1d29] border border-[#d4af37]/40 px-3 py-1.5 text-xs font-bold text-[#f5d77f] hover:bg-[#d4af37] hover:text-[#0d0e11] transition cursor-pointer"
                            title="Agendar novamente com o mesmo profissional"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Repetir</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Opção discreta para consultar outro número ou código se necessário */}
            <div className="pt-4 pb-2 text-center">
              {!showSearchBox ? (
                <button
                  type="button"
                  onClick={() => setShowSearchBox(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-[#d4af37] transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Consultar agendamentos de outro número ou código</span>
                </button>
              ) : (
                <div className="rounded-2xl border border-[#232733] bg-[#12141c] p-4 text-left max-w-md mx-auto space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300">Consultar agendamento:</span>
                    <button
                      type="button"
                      onClick={() => setShowSearchBox(false)}
                      className="text-[11px] text-neutral-400 hover:text-white cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                  <div className="inline-flex rounded-lg bg-[#181a24] p-1 border border-[#2b3040] w-full">
                    <button
                      type="button"
                      onClick={() => setSearchMode('phone')}
                      className={`w-1/2 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                        searchMode === 'phone' || searchMode === 'auto'
                          ? 'bg-[#d4af37] text-[#0d0e11]'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Telefone / WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchMode('code')}
                      className={`w-1/2 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                        searchMode === 'code'
                          ? 'bg-[#d4af37] text-[#0d0e11]'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Código da Reserva
                    </button>
                  </div>
                  {searchMode === 'code' ? (
                    <form onSubmit={handleSearchByCode} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: LIB-4091"
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                        className="rounded-xl border border-[#2b3040] bg-[#161822] px-3.5 py-2 text-xs font-mono font-bold text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none w-full"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#0d0e11] hover:brightness-110 shrink-0 cursor-pointer"
                      >
                        Buscar
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSearchByPhone} className="flex gap-2">
                      <input
                        type="tel"
                        placeholder="Seu WhatsApp (com DDD)"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="rounded-xl border border-[#2b3040] bg-[#161822] px-3.5 py-2 text-xs font-semibold text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none w-full"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#0d0e11] hover:brightness-110 shrink-0 cursor-pointer"
                      >
                        Consultar
                      </button>
                    </form>
                  )}
                  {searchError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{searchError}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SEÇÃO LGPD: PRIVACIDADE & DIREITOS DO TITULAR                 */}
            {/* ------------------------------------------------------------- */}
            <div className="rounded-2xl border border-[#232734] bg-[#12141c] p-4 text-xs text-neutral-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Privacidade & Direitos do Titular (LGPD)</span>
                  <span className="text-[11px] text-neutral-400">
                    Seus dados são protegidos pela Lei 13.709/2018 e utilizados estritamente para o atendimento.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="rounded-xl border border-[#2e3344] bg-[#1a1d27] px-3 py-2 text-[11px] font-semibold text-neutral-200 hover:text-white hover:bg-[#202433] transition cursor-pointer"
                >
                  Ver Termos LGPD
                </button>
                <button
                  type="button"
                  onClick={handleClearMyData}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
                  title="Exercer direito de exclusão de dados deste dispositivo (Art. 18 LGPD)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Meus Dados</span>
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* FLOATING TOAST BANNER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#d4af37]/40 bg-[#161822] px-4 py-3 text-xs font-bold text-white shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CANCEL MODAL */}
      {selectedAppointmentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/40 bg-[#161822] p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-cinzel">Cancelar Agendamento?</h3>
                <span className="text-xs text-rose-300">O horário será liberado na agenda</span>
              </div>
            </div>

            {cancelError && (
              <div className="rounded-lg bg-rose-500/15 border border-rose-500/30 p-2.5 text-xs text-rose-300">
                {cancelError}
              </div>
            )}

            <p className="text-xs text-neutral-300 leading-relaxed">
              Deseja cancelar o horário de{' '}
              <strong className="text-white">
                {(selectedAppointmentToCancel.date || '').split('-').reverse().join('/')} às {selectedAppointmentToCancel.start_time}
              </strong>{' '}
              (Código: <span className="font-mono text-[#d4af37]">{selectedAppointmentToCancel.code}</span>)?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAppointmentToCancel(null)}
                className="w-1/2 rounded-xl border border-[#2e3344] py-2.5 text-xs font-semibold text-neutral-300 hover:bg-[#1a1d27] cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelAppointment}
                className="w-1/2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 cursor-pointer"
              >
                {cancelling ? 'Cancelando...' : 'Sim, Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LGPD PRIVACY POLICY MODAL */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

    </div>
  );
};
