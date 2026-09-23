import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useSettings } from '../context/SettingsContext';
import { ThemeToggle } from './ThemeToggle';
import { Scissors, MapPin, Phone, Clock, Instagram, ShieldCheck } from 'lucide-react';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();
  const { settings } = useSettings();
  const [showPrivacyModal, setShowPrivacyModal] = React.useState(false);

  return (
    <footer className="w-full border-t border-[#232733] bg-[#090a0d] text-neutral-400 text-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              {settings.logo_url ? (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#161822] border border-[#d4af37]/40 overflow-hidden p-0.5">
                  <img src={settings.logo_url} alt={settings.name} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#161822] border border-[#d4af37]/40">
                  <Scissors className="h-4 w-4 text-[#d4af37] -rotate-45" />
                </div>
              )}
              <span className="font-cinzel text-lg font-black text-white tracking-wider">
                {settings.name || 'LÍDER BARBERS'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Tradição, navalha afiada e excelência em cada detalhe. O refúgio do homem contemporâneo que valoriza sua imagem.
            </p>
            <div className="flex items-center gap-3 pt-2 text-neutral-400">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#141620] border border-[#262b3a] flex items-center justify-center hover:text-[#d4af37] hover:border-[#d4af37] transition"
                aria-label="Instagram da Barbearia"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Atendimento aberto hoje</span>
              </div>
            </div>
          </div>

          {/* Horários */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#f5d77f] font-cinzel">
              Horários de Atendimento
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex justify-between border-b border-[#1b1e2a] pb-1.5">
                <span>Segunda a Sexta</span>
                <span className="text-white font-medium">09:00 - 20:00</span>
              </li>
              <li className="flex justify-between border-b border-[#1b1e2a] pb-1.5">
                <span>Sábado</span>
                <span className="text-white font-medium">08:30 - 19:00</span>
              </li>
              <li className="flex justify-between text-neutral-500">
                <span>Domingo & Feriados</span>
                <span>Fechado</span>
              </li>
            </ul>
          </div>

          {/* Localização & Contato */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#f5d77f] font-cinzel">
              Onde Estamos
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>{settings.address || 'Av. Paulista, 1000 — São Paulo, SP'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>{settings.phone || '(11) 98765-4321'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Estacionamento com manobrista cortesia</span>
              </div>
            </div>
          </div>

          {/* Atalhos Rápidos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#f5d77f] font-cinzel">
              Acesso Rápido
            </h4>
            <div className="flex flex-col space-y-2 text-xs">
              <button
                type="button"
                onClick={() => navigate('/agendar')}
                className="text-left text-neutral-300 hover:text-[#d4af37] transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>→ Agendamento Online</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/meus-agendamentos')}
                className="text-left text-[#f5d77f] hover:text-[#d4af37] transition flex items-center gap-1.5 cursor-pointer font-semibold"
              >
                <span>→ Meus Agendamentos & Histórico</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/servicos')}
                className="text-left text-neutral-300 hover:text-[#d4af37] transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>→ Tabela de Preços & Serviços</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/equipe')}
                className="text-left text-neutral-300 hover:text-[#d4af37] transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>→ Nossos Mestres Barbeiros</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-left text-neutral-400 hover:text-[#d4af37] transition flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Privacidade & LGPD</span>
              </button>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-[#181a24] flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 gap-3">
          <p>
            © {new Date().getFullYear()} {settings.name || 'Líder Barbers'}. Todos os direitos reservados. •{' '}
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-[#d4af37] underline transition cursor-pointer"
            >
              Termos de Privacidade & LGPD
            </button>
          </p>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Tema:</span>
            <ThemeToggle variant="segmented" className="text-[11px]" />
          </div>
          <p className="flex items-center gap-2">
            <span>Desenvolvido com padrão clássico & moderno PWA</span>
          </p>
        </div>
      </div>

      {/* LGPD PRIVACY MODAL */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </footer>
  );
};
