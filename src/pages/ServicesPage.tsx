import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { Service } from '../types';
import { fetchServices } from '../lib/api';
import { Scissors, Clock, ArrowRight, Sparkles, Check } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { navigate } = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: 'todos', label: 'Todos os Serviços' },
    { id: 'cabelo', label: 'Cortes & Cabelo' },
    { id: 'barba', label: 'Barboterapia & Barba' },
    { id: 'combo', label: 'Combos Especiais' },
    { id: 'tratamento', label: 'Acabamentos & Cor' },
  ];

  const filteredServices = services.filter((s) => {
    if (selectedCategory === 'todos') return true;
    return s.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#0d0e11] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37] font-cinzel">
            Tabela Oficial de Atendimentos
          </span>
          <h1 className="mt-2 text-3xl sm:text-5xl font-black text-white font-cinzel tracking-tight">
            SERVIÇOS & INVESTIMENTO
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-400">
            Valores transparentes, pontualidade e excelência técnica. Escolha o serviço ideal para você e agende seu horário.
          </p>

          {/* Categories Pill Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[#d4af37] text-[#0d0e11] shadow-lg shadow-[#d4af37]/20'
                    : 'bg-[#151822] text-neutral-300 border border-[#252a38] hover:border-[#d4af37]/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services List Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="group relative rounded-2xl border border-[#222634] bg-[#12141c] p-6 hover:border-[#d4af37]/60 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1a1d28] border border-[#d4af37]/30 flex items-center justify-center group-hover:border-[#d4af37] transition">
                      <Scissors className="w-6 h-6 text-[#d4af37]" />
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white font-cinzel">
                        R$ {Number(service?.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                      <div className="flex items-center justify-end gap-1 text-[11px] text-neutral-400 mt-0.5">
                        <Clock className="w-3 h-3 text-[#d4af37]" />
                        <span>{service.duration_minutes} min</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#f5d77f] transition">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                    {service.description}
                  </p>

                  <ul className="mt-4 space-y-1.5 text-xs text-neutral-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Produtos masculinos premium</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Lavagem & finalização inclusas</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-[#1c202d]">
                  <button
                    onClick={() => navigate(`/agendar?service=${service.id}`)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] py-2.5 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 active:scale-95 transition shadow-md"
                  >
                    <span>Agendar este serviço</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
