import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useSettings } from '../context/SettingsContext';
import { Service, Barber } from '../types';
import { fetchServices, fetchBarbers } from '../lib/api';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { 
  Scissors, 
  Calendar, 
  Clock, 
  Star, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Coffee,
  Beer
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();
  const { settings } = useSettings();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [srvs, brbs] = await Promise.all([fetchServices(), fetchBarbers()]);
        setServices(srvs);
        setBarbers(brbs);
      } catch (e) {
        console.error('Error loading homepage data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#232733] bg-[#0c0d11] pt-5 pb-7 sm:py-16 lg:py-20">
        {/* Subtle background ambient gold glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#d4af37]/10 blur-[130px] rounded-full" />
        <div className="pointer-events-none absolute -bottom-40 right-10 w-[400px] h-[400px] bg-[#d4af37]/5 blur-[120px] rounded-full" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Heading & Call to Action */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-5 lg:space-y-6 text-left">
              <h1 className="font-cinzel text-[25px] xs:text-[27px] sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] sm:leading-[1.1]">
                <span className="block whitespace-nowrap text-slate-900 dark:text-white">
                  A ARTE DO CORTE,
                </span>
                <span className="block bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 dark:from-[#f5d77f] dark:via-[#d4af37] dark:to-[#aa8222] bg-clip-text text-transparent">
                  A PRECISÃO DA NAVALHA.
                </span>
              </h1>

              <p className="max-w-xl text-sm sm:text-base lg:text-lg text-slate-600 dark:text-gray-300 font-normal leading-relaxed">
                A <strong className="text-slate-900 dark:text-white font-bold">{settings.name || 'Líder Barbers'}</strong> une a clássica barbearia vintage ao conforto moderno. Escolha o serviço, selecione seu barbeiro e agende seu horário em menos de 1 minuto.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5 pt-0.5 sm:pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/agendar')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] px-6 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-[#0d0e11] shadow-xl shadow-[#d4af37]/25 hover:brightness-110 active:scale-95 transition cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar Atendimento</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/servicos')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 dark:border-[#2e3344] dark:bg-[#14161f] dark:text-white dark:hover:text-white dark:hover:border-[#d4af37]/50 px-5 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                >
                  <span>Ver Serviços & Preços</span>
                  <ArrowRight className="w-4 h-4 text-amber-700 dark:text-[#d4af37]" />
                </button>
              </div>

            </div>

            {/* Right Column: Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl border border-[#d4af37]/35 bg-white dark:bg-[#14161f] p-2.5 sm:p-3 shadow-xl">
                <div className="relative aspect-[4/3] sm:aspect-[4/5] max-h-[350px] sm:max-h-none overflow-hidden rounded-xl bg-neutral-900">
                  <img
                    src={settings.hero_image_url || '/logo.png'}
                    alt={`${settings.name || 'Líder Barbers'} ambiente clássico`}
                    className="h-full w-full object-cover brightness-90 contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e11] via-transparent to-black/30" />
                  
                  {/* Floating badge inside image */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 rounded-xl border border-slate-200/80 bg-white/95 text-slate-900 shadow-xl dark:border-[#d4af37]/40 dark:bg-[#12141c]/90 dark:text-white p-3 sm:p-3.5 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-[#f5d77f] font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-600 dark:fill-[#d4af37] dark:text-[#d4af37]" />
                          <span>Experiência {settings.name || 'Líder Barbers'}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">Toalha Quente & Ozonioterapia</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/agendar')}
                        className="rounded-lg bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 shadow-md transition cursor-pointer"
                      >
                        Reservar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PWA Install Banner */}
      <PWAInstallButton variant="banner" />

      {/* Featured Services */}
      <section className="py-8 sm:py-16 lg:py-20 border-b border-[#232733] bg-[#0d0e11]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#d4af37] font-cinzel">
              Nossos Atendimentos
            </span>
            <h2 className="mt-1 sm:mt-2 text-2xl sm:text-3xl lg:text-4xl font-black text-white font-cinzel tracking-tight">
              SERVIÇOS DE ASSINATURA
            </h2>
            <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm text-neutral-400">
              Cada serviço é executado com navalhas esterilizadas descartáveis, produtos de alta fixação e consultoria visagista.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.slice(0, 6).map((service) => (
              <div
                key={service.id}
                className="group relative rounded-2xl border border-[#222634] bg-[#13151d] p-6 hover:border-[#d4af37]/60 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-xl hover:shadow-[#d4af37]/5"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#1a1d28] border border-[#d4af37]/30 flex items-center justify-center group-hover:scale-105 group-hover:border-[#d4af37] transition">
                      <Scissors className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-white font-cinzel">
                        R$ {Number(service?.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="block text-[11px] text-neutral-400">
                        {service.duration_minutes} minutos
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#f5d77f] transition">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-xs text-neutral-400 leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#1e222f] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Duração: {service.duration_minutes}m</span>
                  </div>
                  <button
                    onClick={() => navigate(`/agendar?service=${service.id}`)}
                    className="flex items-center gap-1.5 rounded-lg bg-[#1c202d] border border-[#d4af37]/40 px-3 py-1.5 text-xs font-bold text-[#f5d77f] hover:bg-[#d4af37] hover:text-[#0d0e11] transition cursor-pointer"
                  >
                    <span>Agendar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 sm:mt-10 text-center">
            <button
              onClick={() => navigate('/servicos')}
              className="inline-flex items-center gap-2 rounded-xl border border-[#2e3344] bg-[#151722] px-5 py-2.5 sm:px-6 sm:py-3 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:border-[#d4af37] transition cursor-pointer"
            >
              <span>Ver catálogo completo de serviços</span>
              <ArrowRight className="w-4 h-4 text-[#d4af37]" />
            </button>
          </div>

        </div>
      </section>

      {/* Team Preview */}
      <section className="py-8 sm:py-16 lg:py-20 border-b border-[#232733] bg-[#0a0b0e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#d4af37] font-cinzel">
              Mestres da Bancada
            </span>
            <h2 className="mt-1 sm:mt-2 text-2xl sm:text-3xl lg:text-4xl font-black text-white font-cinzel tracking-tight">
              CONHEÇA NOSSOS BARBEIROS
            </h2>
            <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm text-neutral-400">
              Profissionais premiados, experientes e dedicados ao caimento perfeito para cada cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className="rounded-2xl border border-[#222634] bg-[#12141c] overflow-hidden group hover:border-[#d4af37]/60 transition-all duration-300 flex flex-col justify-between shadow-md"
              >
                <div className="relative aspect-[4/4] overflow-hidden bg-neutral-900">
                  <img
                    src={barber.photo_url}
                    alt={barber.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500 brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12141c] via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-[#0d0e11]/85 border border-[#d4af37]/40 px-2 py-1 text-xs font-bold text-[#f5d77f] backdrop-blur-sm">
                    <Star className="w-3.5 h-3.5 fill-[#d4af37] text-[#d4af37]" />
                    <span>{barber.rating || 5.0}</span>
                  </div>
                </div>

                <div className="p-5 sm:p-6 text-left flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white font-cinzel">
                      {barber.name}
                    </h3>
                    <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider">
                      {barber.nickname}
                    </span>
                    <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                      {barber.bio}
                    </p>

                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {barber.specialties.map((spec, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-[#272c3d] bg-[#171a25] px-2 py-0.5 text-[11px] font-medium text-neutral-300"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#1c202d]">
                    <button
                      onClick={() => navigate(`/agendar?barbeiro=${encodeURIComponent(barber.name)}`)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] py-2.5 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 active:scale-95 transition shadow-md cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Agendar com {(barber.nickname || barber.name || 'Barbeiro').split(' ')[0]}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Simple CTA Bar */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] dark:from-[#11131a] dark:to-[#0a0b0e] border-b border-[#e2e8f0] dark:border-[#232733] text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h3 className="font-cinzel text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 dark:text-white">
            PRONTO PARA RENOVAR SEU VISUAL?
          </h3>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
            Verifique agora os horários disponíveis em tempo real com confirmação imediata.
          </p>
          <button
            type="button"
            onClick={() => navigate('/agendar')}
            className="mt-4 sm:mt-6 inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] px-7 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 shadow-lg shadow-[#d4af37]/20 transition cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Fazer Agendamento Online</span>
          </button>
        </div>
      </section>

    </div>
  );
};
