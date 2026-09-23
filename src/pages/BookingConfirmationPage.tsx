import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useSettings } from '../context/SettingsContext';
import { Appointment } from '../types';
import { fetchAppointmentByCode, cancelAppointmentByCode } from '../lib/api';
import { saveCustomerBooking } from '../lib/customerStorage';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  MapPin, 
  Share2, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  QrCode,
  Search,
  History,
  ArrowRight
} from 'lucide-react';

export const BookingConfirmationPage: React.FC = () => {
  const { params, navigate } = useRouter();
  const { settings } = useSettings();
  const rawCode = params.codigo;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCodeInput, setSearchCodeInput] = useState(rawCode || '');

  // Cancel dialog
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (rawCode && rawCode !== 'busca') {
      loadAppointment(rawCode);
    } else {
      setLoading(false);
    }
  }, [rawCode]);

  const loadAppointment = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAppointmentByCode(code);
      setAppointment(data);
      if (data && data.code) {
        saveCustomerBooking({
          code: data.code,
          phone: data.customer_phone || '',
          name: data.customer_name || '',
          appointment: data,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Agendamento não encontrado com o código fornecido.');
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCodeInput.trim()) return;
    navigate(`/agendamento/${searchCodeInput.trim().toUpperCase()}`);
  };

  const handleCancelAppointment = async () => {
    if (!appointment) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelAppointmentByCode(appointment.code);
      setCancelSuccess(true);
      setShowCancelModal(false);
      showToast('Agendamento cancelado com sucesso.');
      // Reload appointment to reflect cancelled status
      await loadAppointment(appointment.code);
    } catch (err: any) {
      setCancelError(err.message || 'Erro ao cancelar agendamento');
    } finally {
      setCancelling(false);
    }
  };

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
            <span>Cliente Ausente</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e11] py-10 sm:py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        
        {/* If no code or searching */}
        {(!rawCode || rawCode === 'busca') && !appointment && (
          <div className="rounded-2xl border border-[#232733] bg-[#12141c] p-6 sm:p-8 text-center space-y-5">
            <Search className="w-10 h-10 text-[#d4af37] mx-auto" />
            <h2 className="text-2xl font-black text-white font-cinzel">Consultar Agendamento</h2>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Digite o código de 7 dígitos gerado no momento da sua reserva (ex: LIB-4091).
            </p>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-xs mx-auto">
              <input
                type="text"
                placeholder="LIB-XXXX"
                value={searchCodeInput}
                onChange={(e) => setSearchCodeInput(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-[#2b3040] bg-[#161822] px-4 py-2.5 text-center font-mono font-bold text-sm text-white focus:border-[#d4af37] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#d4af37] px-4 py-2.5 text-xs font-bold text-[#0d0e11] hover:brightness-110"
              >
                Buscar
              </button>
            </form>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
            <p className="text-xs text-neutral-400">Localizando agendamento...</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-4">
            <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white font-cinzel">Agendamento Não Encontrado</h3>
            <p className="text-xs text-rose-200">{error}</p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/agendar')}
                className="rounded-xl bg-[#d4af37] px-5 py-2.5 text-xs font-bold text-[#0d0e11]"
              >
                Novo Agendamento
              </button>
              <button
                onClick={() => navigate('/agendamento/busca')}
                className="rounded-xl border border-[#2e3344] px-4 py-2.5 text-xs font-semibold text-neutral-300"
              >
                Tentar Outro Código
              </button>
            </div>
          </div>
        )}

        {/* Successful / Found Appointment Voucher */}
        {appointment && !loading && (
          <div className="space-y-6">
            
            {/* Top Success Banner */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-cinzel">
                AGENDAMENTO CONFIRMADO
              </h1>
              <p className="text-xs text-neutral-400">
                Seu horário está reservado com exclusividade na {settings.name || 'Líder Barbers'}.
              </p>
            </div>

            {/* Voucher Card */}
            <div className="relative rounded-3xl border border-[#d4af37]/45 bg-gradient-to-b from-[#151722] to-[#101118] p-6 sm:p-8 shadow-2xl overflow-hidden">
              
              {/* Gold watermark accent */}
              <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 bg-[#d4af37]/10 rounded-full blur-2xl" />

              {/* Header inside ticket */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#242838] gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#d4af37] font-cinzel">
                    Código de Identificação
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                      {appointment.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(appointment.code);
                          showToast('Código copiado para a área de transferência!');
                        } catch (e) {
                          showToast(`Código: ${appointment.code}`);
                        }
                      }}
                      className="rounded-md border border-[#2d3243] bg-[#1a1c27] px-2 py-1 text-[11px] text-neutral-300 hover:text-white cursor-pointer"
                      title="Copiar código"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div>
                  {getStatusBadge(appointment.status)}
                </div>
              </div>

              {/* Ticket Details Grid */}
              <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-5 border-b border-[#242838] text-xs">
                
                {/* Service */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1b1e2a] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                    <Scissors className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Serviço:</span>
                    <span className="font-bold text-white text-sm block">
                      {appointment.service?.name || 'Serviço'}
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      {appointment.service?.duration_minutes} min • R$ {Number(appointment?.price || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Barber */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1b1e2a] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Mestre Barbeiro:</span>
                    <span className="font-bold text-white text-sm block">
                      {appointment.barber?.name || `${settings.name || 'Líder Barbers'}`}
                    </span>
                    <span className="text-[#d4af37] text-[11px] font-semibold">
                      {appointment.barber?.nickname}
                    </span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1b1e2a] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Data do Atendimento:</span>
                    <span className="font-bold text-white text-sm block">
                      {(appointment.date || '').split('-').reverse().join('/')}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1b1e2a] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Horário:</span>
                    <span className="font-bold text-white text-sm block">
                      {appointment.start_time} às {appointment.end_time}
                    </span>
                  </div>
                </div>

              </div>

              {/* Customer summary */}
              <div className="pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-3">
                <div>
                  <span className="text-neutral-400">Agendado para: </span>
                  <strong className="text-white">{appointment.customer_name}</strong>
                  <span className="text-neutral-400 ml-2">({appointment.customer_phone})</span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400">Total no balcão: </span>
                  <span className="text-lg font-black text-[#f5d77f] font-cinzel">
                    R$ {Number(appointment?.price || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Location Bar */}
              <div className="mt-6 rounded-xl border border-[#272c3d] bg-[#0c0d12] p-3.5 text-xs text-neutral-300 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">{settings.name || 'Líder Barbers'} — Unidade Central</strong>
                  <span>{settings.address || 'Av. Paulista, 1000'} — Estacionamento cortesia para clientes com reserva.</span>
                </div>
              </div>

              {/* Footer Actions inside voucher */}
              <div className="mt-6 pt-4 border-t border-[#242838] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Meu Agendamento na ${settings.name || 'Líder Barbers'}`,
                        text: `Agendamento ${appointment.code} em ${appointment.date} às ${appointment.start_time}`,
                        url: window.location.href,
                      }).catch(() => {});
                    } else {
                      try {
                        navigator.clipboard.writeText(window.location.href);
                        showToast('Link do agendamento copiado!');
                      } catch (e) {
                        showToast('Link pronto para compartilhamento!');
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-[#2d3243] bg-[#171924] px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Compartilhar Reserva</span>
                </button>

                {appointment.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelError(null);
                      setShowCancelModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Preciso cancelar este agendamento</span>
                  </button>
                )}
              </div>

            </div>

            {/* Quick Access to Customer History & Appointments */}
            <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#171924] via-[#151722] to-[#12141c] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-10 h-10 rounded-xl bg-[#1c1f2e] border border-[#d4af37]/40 flex items-center justify-center shrink-0 text-[#d4af37]">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white font-cinzel">Meus Agendamentos & Histórico</h4>
                  <p className="text-xs text-neutral-400">
                    Acompanhe todos os seus horários marcados e cortes anteriores na barbearia.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/meus-agendamentos')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1f2230] border border-[#d4af37]/50 px-4 py-2.5 text-xs font-bold text-[#f5d77f] hover:bg-[#d4af37] hover:text-[#0d0e11] transition shadow-md shrink-0 cursor-pointer"
              >
                <span>Ver Todos os Meus Horários</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Back or new booking */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 rounded-xl border border-[#2e3344] bg-[#14161f] px-4 py-2.5 text-xs font-bold text-neutral-300 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Início</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/meus-agendamentos')}
                className="flex items-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#161924] px-4 py-2.5 text-xs font-bold text-[#f5d77f] hover:border-[#d4af37] cursor-pointer"
              >
                <History className="w-4 h-4 text-[#d4af37]" />
                <span>Histórico & Agendados</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/agendar')}
                className="flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 shadow-md cursor-pointer"
              >
                <span>Novo Agendamento</span>
              </button>
            </div>

          </div>
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
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/40 bg-[#161822] p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-cinzel">Cancelar Agendamento?</h3>
                <span className="text-xs text-rose-300">Esta ação liberará o horário para outros clientes</span>
              </div>
            </div>

            {cancelError && (
              <div className="rounded-lg bg-rose-500/15 border border-rose-500/30 p-2.5 text-xs text-rose-300">
                {cancelError}
              </div>
            )}

            <p className="text-xs text-neutral-300 leading-relaxed">
              Tem certeza que deseja cancelar o agendamento <strong className="text-white">{appointment?.code}</strong>?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
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

    </div>
  );
};
