import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { Service, Barber, AvailabilitySlot } from '../types';
import { fetchServices, fetchBarbers, fetchAvailability, createAppointment } from '../lib/api';
import { 
  Scissors, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  AlertCircle, 
  ArrowLeft, 
  ShieldCheck,
  Sparkles,
  Phone,
  FileText,
  Zap
} from 'lucide-react';

function normalizeString(val: string): string {
  return (val || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function findBarberByQuery(barbers: Barber[], queryParam: string | null): Barber | null {
  if (!queryParam) return null;
  let cleanParam = queryParam.trim();
  try {
    cleanParam = decodeURIComponent(cleanParam);
  } catch (e) {
    // fallback to raw
  }
  cleanParam = cleanParam.replace(/\+/g, ' ').trim();
  const normParam = normalizeString(cleanParam);
  if (!normParam) return null;

  return (
    barbers.find((b) => {
      const bId = b.id.toLowerCase();
      const bNameNorm = normalizeString(b.name);
      const bNickNorm = b.nickname ? normalizeString(b.nickname) : '';
      const bFirstNameNorm = normalizeString((b.name || '').split(' ')[0]);

      // 1. Full name match (accent and case insensitive) e.g. "André Santana" matches "andre santana"
      if (bNameNorm === normParam) return true;

      // 2. Nickname match e.g. "Mestre Valente" or "Diego Navalha"
      if (bNickNorm && bNickNorm === normParam) return true;

      // 3. ID match (e.g. barber-3, barber-1) for complete backwards compatibility
      if (bId === normParam || b.id === cleanParam || (b as any).user_id === cleanParam) return true;

      // 4. First name match (e.g. "André" or "Diego")
      if (bFirstNameNorm && bFirstNameNorm === normParam) return true;

      // 5. Partial / Substring match if >= 3 characters (e.g. "André Santana" contains "Santana" or "André")
      if (normParam.length >= 3 && (bNameNorm.includes(normParam) || normParam.includes(bNameNorm))) return true;

      // 6. Admin fallback
      if (normParam.includes('admin') && (bId.includes('admin') || bNameNorm.includes('admin') || bNickNorm.includes('admin'))) return true;

      return false;
    }) || null
  );
}

export const BookingFlow: React.FC = () => {
  const { navigate, searchParams, path } = useRouter();

  // Master Data
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [exclusiveBarber, setExclusiveBarber] = useState<Barber | null>(null);

  // Booking Selection State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any'); // 'any' or barber id
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Customer Input State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [showNotes, setShowNotes] = useState<boolean>(false);

  // Flow Step: 'service' (Step 1) or 'schedule' (Step 2: date, time, customer & confirm)
  const [step, setStep] = useState<'service' | 'schedule'>('service');

  // Slots State
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  // Submission & Conflict State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [conflictMessage, setConflictMessage] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Next 14 days generator
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const isSunday = d.getDay() === 0;
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayOfWeek: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        dayOfMonth: d.getDate(),
        month: d.toLocaleDateString('pt-BR', { month: 'short' }),
        isToday: i === 0,
        isTomorrow: i === 1,
        isSunday,
      });
    }
    return days;
  };

  const nextDays = getNextDays();

  // Load initial services and barbers
  useEffect(() => {
    async function init() {
      try {
        const [srvs, brbs] = await Promise.all([fetchServices(), fetchBarbers()]);
        setServices(srvs);
        setBarbers(brbs);

        // Default date: today or tomorrow if sunday
        const defaultDate = nextDays[0].isSunday ? nextDays[1].dateStr : nextDays[0].dateStr;
        setSelectedDate(defaultDate);

        // Check if service or barber came in URL query
        const srvParam = searchParams.get('service') || searchParams.get('servico');
        const brbParam = searchParams.get('barbeiro') || searchParams.get('barber');

        const directBrb = findBarberByQuery(brbs, brbParam);
        if (directBrb) {
          setSelectedBarberId(directBrb.id);
          setExclusiveBarber(directBrb);
        }

        if (srvParam) {
          const foundSrv = srvs.find((s) => s.id === srvParam);
          if (foundSrv) {
            setSelectedService(foundSrv);
            // Auto advance directly to schedule step
            setStep('schedule');
          }
        }
      } catch (err) {
        console.error('Error loading booking data', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    init();
  }, []);

  // Reactive detection of barber parameter (e.g. ?barbeiro=André Santana or ?barbeiro=barber-3)
  useEffect(() => {
    if (barbers.length === 0) return;
    const brbParam = searchParams.get('barbeiro') || searchParams.get('barber');
    if (brbParam) {
      const directBrb = findBarberByQuery(barbers, brbParam);
      if (directBrb && (!exclusiveBarber || exclusiveBarber.id !== directBrb.id)) {
        setSelectedBarberId(directBrb.id);
        setExclusiveBarber(directBrb);
      }
    }
  }, [barbers, searchParams]);

  // Fetch real-time available slots whenever service, barber, or date changes
  const loadSlots = async (serviceId: string, date: string, barberId: string) => {
    if (!serviceId || !date) return;
    setLoadingSlots(true);
    setSlotError(null);
    setSelectedTime('');

    try {
      const res = await fetchAvailability(serviceId, date, barberId);
      setAvailableSlots(res.slots || []);
      if (!res.slots || res.slots.length === 0) {
        setSlotError('Nenhum horário disponível para esta data e profissional. Selecione outro dia.');
      }
    } catch (err: any) {
      setSlotError(err.message || 'Erro ao carregar horários disponíveis.');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedService && selectedDate && step === 'schedule') {
      loadSlots(selectedService.id, selectedDate, selectedBarberId);
    }
  }, [selectedService?.id, selectedBarberId, selectedDate, step]);

  // Fast 1-click Service Selection
  const handleSelectService = (srv: Service) => {
    setSelectedService(srv);
    setStep('schedule');
    // Preload slots immediately
    loadSlots(srv.id, selectedDate || nextDays[0].dateStr, selectedBarberId);
  };

  // Phone input mask (BR format: (XX) XXXXX-XXXX)
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    let masked = raw;
    if (raw.length > 2) masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length > 7) masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
    setCustomerPhone(masked);
  };

  // Submit appointment with Anti-Duplicate protection
  const handleConfirmBooking = async () => {
    if (!selectedService) {
      setSubmitError('Por favor, selecione um serviço.');
      setStep('service');
      return;
    }
    if (!selectedTime) {
      setSubmitError('Por favor, toque em um dos horários disponíveis acima.');
      return;
    }
    if (!customerName.trim() || customerName.trim().length < 2) {
      setSubmitError('Por favor, digite seu nome completo.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setSubmitError('Por favor, digite um telefone ou WhatsApp válido com DDD.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const apt = await createAppointment({
        service_id: selectedService.id,
        barber_id: selectedBarberId === 'any' ? undefined : selectedBarberId,
        date: selectedDate,
        start_time: selectedTime,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        notes: customerNotes.trim() || undefined,
      });

      // Successful booking -> navigate to voucher confirmation page!
      navigate(`/agendamento/${apt.code}`);
    } catch (err: any) {
      console.error('Booking submission error:', err);
      if (err.status === 409 || err.code === 'CONFLITO_HORARIO') {
        // Concurrency conflict caught!
        setConflictMessage(err.message || 'Este horário acabou de ser preenchido por outro cliente.');
        setConflictModalOpen(true);
        if (selectedService) {
          loadSlots(selectedService.id, selectedDate, selectedBarberId);
        }
      } else {
        setSubmitError(err.message || 'Ocorreu um erro ao registrar seu agendamento. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#0d0e11] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent mx-auto" />
          <p className="text-xs text-neutral-400">Carregando horários da Líder Barbers...</p>
        </div>
      </div>
    );
  }

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  return (
    <div className="min-h-screen bg-[#0d0e11] py-4 sm:py-8">
      <div className="mx-auto max-w-2xl px-3 sm:px-6">
        
        {/* Clean Header */}
        <div className="text-center mb-3 sm:mb-5">
          <h1 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-tight">
            RESERVE SEU HORÁRIO
          </h1>
        </div>

        {/* VIP Direct Booking Banner when accessed via exclusive link */}
        {exclusiveBarber && (
          <div className="mb-4 rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#171924] via-[#1d2130] to-[#141620] p-3.5 sm:p-4 shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={exclusiveBarber.photo_url}
                  alt={exclusiveBarber.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-[#d4af37] shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0d0e11]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-[#d4af37]/20 border border-[#d4af37]/50 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-[#f5d77f]">
                    Link Exclusivo
                  </span>
                  <span className="text-[10px] text-neutral-400">Atendimento Direto</span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-white font-cinzel leading-tight mt-0.5">
                  {exclusiveBarber.nickname || exclusiveBarber.name}
                </h2>
                <p className="text-[11px] text-neutral-300">
                  {exclusiveBarber.bio || 'Profissional especialista pronto para seu atendimento.'}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Pré-selecionado
              </span>
              <span className="text-[10px] text-neutral-400">Etapa de barbeiro pulada</span>
            </div>
          </div>
        )}

        {/* STEP 1: CHOOSE SERVICE (1 TAP TO ADVANCE) */}
        {step === 'service' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                1. Toque para escolher o serviço:
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {services.map((srv) => (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => handleSelectService(srv)}
                  className="group flex items-center justify-between rounded-xl border border-[#232733] bg-[#12141c] p-3.5 text-left transition hover:border-[#d4af37] hover:bg-[#181a24] active:scale-[0.98] cursor-pointer shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1a1d28] border border-[#2b3040] flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-[#0d0e11] transition shrink-0">
                      <Scissors className="w-5 h-5 -rotate-45" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#f5d77f] transition leading-snug">
                        {srv.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {srv.duration_minutes} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span className="block text-sm font-black text-[#f5d77f]">
                      R$ {Number(srv?.price || 0).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded">
                      Escolher →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SCHEDULE & INSTANT CONFIRMATION (ALL IN ONE SCREEN!) */}
        {step === 'schedule' && selectedService && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Top Bar: Selected Service Summary with Change Button */}
            <div className="rounded-xl border border-[#d4af37]/40 bg-[#171923] p-3 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shrink-0">
                  <Scissors className="w-4 h-4 -rotate-45" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#d4af37]">Serviço Selecionado</span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-[11px] text-neutral-400">{selectedService.duration_minutes} min</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                    {selectedService.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-black text-[#f5d77f]">
                  R$ {Number(selectedService?.price || 0).toFixed(2).replace('.', ',')}
                </span>
                <button
                  type="button"
                  onClick={() => setStep('service')}
                  className="rounded-lg border border-[#31374a] bg-[#12141c] px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:text-white hover:border-[#d4af37] transition cursor-pointer"
                >
                  Trocar
                </button>
              </div>
            </div>

            {/* Sub-Card 1: Choose Date (Horizontal 1-tap scroll) */}
            <div className="rounded-xl border border-[#232733] bg-[#12141c] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Escolha o Dia:</span>
                </span>
                <span className="text-[11px] text-neutral-400">
                  {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }) : ''}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                {nextDays.map((d) => {
                  const isSelected = selectedDate === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      disabled={d.isSunday}
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`flex flex-col items-center justify-center rounded-xl p-2 min-w-[62px] shrink-0 border transition cursor-pointer ${
                        isSelected
                          ? 'border-[#d4af37] bg-[#d4af37] text-[#0d0e11] font-black shadow-md'
                          : d.isSunday
                          ? 'border-[#1e222e] bg-[#0f1015] text-neutral-600 opacity-40 cursor-not-allowed'
                          : 'border-[#232733] bg-[#171923] text-neutral-300 hover:border-[#d4af37]/60 hover:text-white'
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-[#0d0e11]' : 'text-neutral-400'}`}>
                        {d.isToday ? 'Hoje' : d.isTomorrow ? 'Amanhã' : d.dayOfWeek}
                      </span>
                      <span className="text-base font-black leading-tight">
                        {d.dayOfMonth}
                      </span>
                      <span className={`text-[9px] uppercase ${isSelected ? 'text-[#0d0e11]' : 'text-neutral-500'}`}>
                        {d.month}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Card 2: Profissional (Pré-selecionado pelo link exclusivo ou escolha manual) */}
            <div className="rounded-xl border border-[#232733] bg-[#12141c] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Profissional:</span>
                </span>
                <span className="text-[11px] font-bold text-[#f5d77f]">
                  {exclusiveBarber ? '✓ Pré-selecionado pelo Link' : (selectedBarberId === 'any' ? 'Qualquer disponível' : selectedBarber?.nickname || selectedBarber?.name)}
                </span>
              </div>

              {exclusiveBarber ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#d4af37]/50 bg-gradient-to-r from-[#171923] to-[#12141c] p-2.5 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={exclusiveBarber.photo_url}
                      alt={exclusiveBarber.name}
                      className="w-10 h-10 rounded-xl object-cover border-2 border-[#d4af37] shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-white">
                          {exclusiveBarber.nickname || exclusiveBarber.name}
                        </h4>
                        <span className="rounded bg-[#d4af37]/20 border border-[#d4af37]/40 px-1.5 py-0.2 text-[9px] font-black uppercase text-[#f5d77f]">
                          Exclusivo
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" /> Barbeiro definido pelo link de agendamento
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setExclusiveBarber(null);
                      setSelectedBarberId('any');
                    }}
                    className="rounded-lg border border-[#2d3244] bg-[#10121a] px-2.5 py-1 text-[11px] font-semibold text-neutral-400 hover:text-white hover:border-[#d4af37] transition cursor-pointer shrink-0"
                    title="Trocar para outro barbeiro"
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {/* Fast Any Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedBarberId('any')}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border text-xs font-semibold shrink-0 transition cursor-pointer ${
                      selectedBarberId === 'any'
                        ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#f5d77f] font-bold'
                        : 'border-[#232733] bg-[#171923] text-neutral-300 hover:border-[#d4af37]/40'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Qualquer Barbeiro (Mais Rápido)</span>
                  </button>

                  {/* Specific Barbers */}
                  {barbers.filter(b => b.active).map((b) => {
                    const isSelected = selectedBarberId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBarberId(b.id)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border text-xs font-semibold shrink-0 transition cursor-pointer ${
                          isSelected
                            ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#f5d77f] font-bold'
                            : 'border-[#232733] bg-[#171923] text-neutral-300 hover:border-[#d4af37]/40'
                        }`}
                      >
                        <img
                          src={b.photo_url}
                          alt={b.name}
                          className="w-5 h-5 rounded-full object-cover border border-[#d4af37]/40"
                        />
                        <span>{b.nickname || b.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-Card 3: Available Time Slots */}
            <div className="rounded-xl border border-[#232733] bg-[#12141c] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Escolha o Horário:</span>
                </span>
                {selectedTime && (
                  <span className="rounded-md bg-[#d4af37] px-2 py-0.5 text-[11px] font-black text-[#0d0e11]">
                    {selectedTime} Selecionado ✓
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <div className="py-6 text-center space-y-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent mx-auto" />
                  <p className="text-[11px] text-neutral-400">Verificando horários em tempo real...</p>
                </div>
              ) : slotError ? (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-center">
                  <p className="text-xs text-amber-300">{slotError}</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="rounded-lg bg-[#161822] border border-[#262a39] p-4 text-center">
                  <p className="text-xs text-neutral-400">Nenhum horário livre nesta data. Tente selecionar outro dia acima.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={`rounded-xl py-2 px-1 text-center font-bold text-xs transition border cursor-pointer ${
                          isSelected
                            ? 'border-[#d4af37] bg-[#d4af37] text-[#0d0e11] shadow-md shadow-[#d4af37]/30 scale-[1.03]'
                            : 'border-[#232733] bg-[#171923] text-neutral-200 hover:border-[#d4af37]/50 hover:bg-[#1f2230]'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-Card 4: Quick Customer Contact (Just 2 Fields) */}
            <div className="rounded-xl border border-[#232733] bg-[#12141c] p-3.5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Seus Dados para o Voucher:</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Seu Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full rounded-xl border border-[#282d3d] bg-[#171923] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Seu WhatsApp / Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full rounded-xl border border-[#282d3d] bg-[#171923] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              {!showNotes ? (
                <button
                  type="button"
                  onClick={() => setShowNotes(true)}
                  className="text-[11px] text-[#d4af37] hover:underline cursor-pointer"
                >
                  + Adicionar observação especial (opcional)
                </button>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Observação (opcional)
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Ex: Prefiro tesoura no topo, barba alinhada..."
                    className="w-full rounded-xl border border-[#282d3d] bg-[#171923] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Submit Error Message */}
            {submitError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Instant Confirmation Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmBooking}
                className={`w-full rounded-xl py-3.5 px-6 font-black uppercase tracking-wider text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  !selectedTime
                    ? 'bg-[#1f2230] text-neutral-400 border border-[#2e3344]'
                    : 'bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] text-[#0d0e11] hover:brightness-110 active:scale-[0.98] shadow-[#d4af37]/25'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-[#0d0e11] border-t-transparent" />
                    <span>Confirmando com a barbearia...</span>
                  </>
                ) : !selectedTime ? (
                  <span>Selecione um horário acima para confirmar</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar Agendamento • R$ {Number(selectedService?.price || 0).toFixed(2).replace('.', ',')}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-neutral-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sem taxa de cancelamento • Pagamento no local</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ANTI-DUPLICATE CONFLICT MODAL */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-[#161822] p-6 shadow-2xl text-left space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-cinzel">Horário Indisponível</h3>
                <span className="text-xs text-amber-300 font-semibold">Reserva simultânea detectada</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {conflictMessage}
            </p>

            <p className="text-[11px] text-neutral-400">
              Nosso sistema impede reservas duplicadas em tempo real. Atualizamos os horários livres para você escolher um novo slot com tranquilidade.
            </p>

            <button
              type="button"
              onClick={() => {
                setConflictModalOpen(false);
              }}
              className="w-full rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] py-3 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 transition text-center cursor-pointer"
            >
              Escolher Outro Horário
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
