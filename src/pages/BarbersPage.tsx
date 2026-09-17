import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { Barber } from '../types';
import { fetchBarbers } from '../lib/api';
import { Star, Award, Calendar, Phone, Mail, CheckCircle } from 'lucide-react';

export const BarbersPage: React.FC = () => {
  const { navigate } = useRouter();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBarbers()
      .then(setBarbers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0e11] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37] font-cinzel">
            Profissionais Especialistas
          </span>
          <h1 className="mt-2 text-3xl sm:text-5xl font-black text-white font-cinzel tracking-tight">
            NOSSOS MESTRES BARBEIROS
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-400">
            Nossa equipe é formada por barbeiros dedicados à técnica clássica, visagismo e atendimento de alto padrão.
          </p>
        </div>

        {/* Barbers Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className="rounded-2xl border border-[#222634] bg-[#12141c] overflow-hidden group hover:border-[#d4af37]/60 transition-all duration-300 flex flex-col justify-between shadow-xl"
              >
                <div className="relative aspect-[4/4] overflow-hidden bg-neutral-900">
                  <img
                    src={barber.photo_url}
                    alt={barber.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12141c] via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-[#0d0e11]/85 border border-[#d4af37]/40 px-2.5 py-1 text-xs font-bold text-[#f5d77f] backdrop-blur-sm">
                    <Star className="w-3.5 h-3.5 fill-[#d4af37] text-[#d4af37]" />
                    <span>{barber.rating || 4.9}</span>
                  </div>
                </div>

                <div className="p-6 text-left flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white font-cinzel">
                      {barber.name}
                    </h3>
                    <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider block mt-0.5">
                      {barber.nickname}
                    </span>
                    <p className="mt-3 text-xs text-neutral-300 leading-relaxed">
                      {barber.bio}
                    </p>

                    <div className="mt-4">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                        Especialidades:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {barber.specialties.map((spec, i) => (
                          <span
                            key={i}
                            className="rounded-md border border-[#272c3d] bg-[#171a25] px-2.5 py-1 text-xs font-medium text-neutral-300"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-[#1c202d] space-y-3">
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Atendendo na bancada principal</span>
                    </div>

                    <button
                      onClick={() => navigate(`/agendar?barber=${barber.id}`)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] py-3 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 active:scale-95 transition shadow-lg shadow-[#d4af37]/15"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Agendar Horário com {(barber.nickname || barber.name || 'Barbeiro').split(' ')[0]}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
