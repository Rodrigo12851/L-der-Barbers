import React, { useState, useEffect } from 'react';
import { BarberRevenueMetrics } from '../types';
import { fetchBarberRevenue } from '../lib/api';
import { 
  DollarSign, 
  TrendingUp, 
  Scissors, 
  Calendar, 
  Clock, 
  Phone, 
  CheckCircle2, 
  Percent, 
  RefreshCw, 
  ChevronRight,
  Sparkles,
  Wallet
} from 'lucide-react';

interface BarberRevenueTabProps {
  barberId: string;
  barberName?: string;
}

export const BarberRevenueTab: React.FC<BarberRevenueTabProps> = ({ barberId, barberName }) => {
  const [period, setPeriod] = useState<'hoje' | 'ontem' | 'semana' | 'mes' | 'all'>('hoje');
  const [metrics, setMetrics] = useState<BarberRevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (selectedPeriod = period) => {
    if (!barberId) return;
    setLoading(true);
    try {
      const data = await fetchBarberRevenue(barberId, selectedPeriod);
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching barber revenue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [barberId, period]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(period);
  };

  const periodOptions: { key: 'hoje' | 'ontem' | 'semana' | 'mes' | 'all'; label: string }[] = [
    { key: 'hoje', label: 'Hoje' },
    { key: 'ontem', label: 'Ontem' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes', label: 'Este Mês' },
    { key: 'all', label: 'Geral' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Bar with Period Filter - Ultra Compact for Mobile */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#141722] border border-[#232838] p-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {periodOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                period === opt.key
                  ? 'bg-[#d4af37] text-[#0d0e11] shadow-md shadow-[#d4af37]/20'
                  : 'bg-[#1a1e2c] text-neutral-300 hover:text-white hover:bg-[#202538]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-[#2b3145] bg-[#1a1e2c] px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white hover:border-[#d4af37]/50 transition cursor-pointer"
          title="Atualizar faturamento"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#d4af37]' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {loading && !metrics ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Main KPI Stats - High Density for Mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Net Earnings - Barber's Take-Home */}
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-[#d4af37]/40 bg-gradient-to-b from-[#1c1d28] to-[#13151f] p-3.5 relative overflow-hidden shadow-lg shadow-[#d4af37]/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  Seu Faturamento (Líquido)
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xs text-[#d4af37] font-bold">R$</span>
                <span className="text-2xl sm:text-3xl font-black text-white font-cinzel tracking-tight">
                  {(metrics?.netEarnings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Valor líquido apurado dos atendimentos
              </p>
            </div>

            {/* Gross Revenue */}
            <div className="rounded-2xl border border-[#24293a] bg-[#141722] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
                  Total Atendido
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xs text-neutral-400 font-semibold">R$</span>
                <span className="text-xl sm:text-2xl font-black text-white font-cinzel">
                  {(metrics?.grossRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Faturamento bruto gerado
              </p>
            </div>

            {/* Completed Cuts */}
            <div className="rounded-2xl border border-[#24293a] bg-[#141722] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                  Cortes Feitos
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-white font-cinzel">
                  {metrics?.completedCount || 0}
                </span>
                <span className="text-xs text-neutral-400">atendimentos</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Serviços concluídos no período
              </p>
            </div>

            {/* Average Ticket */}
            <div className="rounded-2xl border border-[#24293a] bg-[#141722] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                  Ticket Médio
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xs text-neutral-400 font-semibold">R$</span>
                <span className="text-xl sm:text-2xl font-black text-white font-cinzel">
                  {(metrics?.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Média por atendimento
              </p>
            </div>
          </div>

          {/* Detailed Cut List - Ultra Compact for Mobile Screens */}
          <div className="rounded-2xl border border-[#24293a] bg-[#131520] p-3.5 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Histórico de Atendimentos no Período
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-neutral-400">
                {metrics?.completedAppointments?.length || 0} registro(s)
              </span>
            </div>

            {(!metrics?.completedAppointments || metrics.completedAppointments.length === 0) ? (
              <div className="rounded-xl border border-dashed border-[#262c3e] bg-[#171a25]/50 py-8 text-center">
                <Scissors className="w-8 h-8 text-neutral-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-neutral-400">Nenhum atendimento concluído encontrado para este período.</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Finalize agendamentos na aba Agenda para contabilizar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.completedAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-xl border border-[#202534] bg-[#161924] p-2.5 sm:p-3 hover:border-[#d4af37]/40 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1c202d] border border-[#2b3245] text-white">
                        <Clock className="w-4 h-4 text-[#d4af37]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {apt.customer_name}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {apt.start_time} • {(apt.date || '').split('-').reverse().slice(0, 2).join('/')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-300 truncate">
                          <span className="text-neutral-300 font-medium">
                            {apt.service?.name || 'Serviço'}
                          </span>
                          {apt.customer_phone && (
                            <a
                              href={`https://wa.me/55${apt.customer_phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className="text-xs font-black text-[#f5d77f]">
                        + R$ {apt.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Bruto: R$ {(apt.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
