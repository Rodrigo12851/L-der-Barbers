import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  Crown, 
  Shield, 
  Scissors,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { InstallAppModal } from './InstallAppModal';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface RoleAppDownloadCardProps {
  role: 'owner' | 'admin' | 'barber';
  title?: string;
  subtitle?: string;
  customPath?: string;
  className?: string;
}

export const RoleAppDownloadCard: React.FC<RoleAppDownloadCardProps> = ({
  role,
  title,
  subtitle,
  customPath,
  className = ''
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  const path = customPath || (role === 'owner' ? '/proprietario' : role === 'admin' ? '/admin' : '/barbeiro');
  const roleUrl = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;

  const defaultTitles = {
    owner: 'Aplicativo do Dono do App (Proprietário)',
    admin: 'Aplicativo do Administrador da Barbearia',
    barber: 'Aplicativo Pessoal do Barbeiro'
  };

  const defaultSubtitles = {
    owner: 'Acesse e gerencie seus administradores, faturamento e barbearias direto do app no seu celular.',
    admin: 'Acesse o painel completo: cadastre barbeiros, comissões, serviços e gerencie agendamentos no seu celular.',
    barber: 'Sua agenda em tempo real, novos agendamentos e extrato de comissões direto na tela do seu celular.'
  };

  const cardTitle = title || defaultTitles[role];
  const cardSubtitle = subtitle || defaultSubtitles[role];

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(roleUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = roleUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `💈 *Líder Barbers — ${cardTitle}*\n\nAbra este link no navegador do seu celular para acessar e instalar o aplicativo com todas as suas funções:\n\n🔗 ${roleUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <div className={`rounded-2xl border border-[#d4af37]/35 bg-gradient-to-r from-[#141722] via-[#1a1e2d] to-[#141722] p-4 sm:p-5 shadow-xl relative overflow-hidden ${className}`}>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Icon & Info */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-md ${
              role === 'owner'
                ? 'bg-gradient-to-br from-[#d4af37]/25 to-[#aa8222]/15 border-[#d4af37]/50 text-[#f5d77f]'
                : role === 'admin'
                ? 'bg-gradient-to-br from-blue-500/25 to-blue-700/15 border-blue-500/40 text-blue-400'
                : 'bg-gradient-to-br from-emerald-500/25 to-emerald-700/15 border-emerald-500/40 text-emerald-400'
            }`}>
              {role === 'owner' ? (
                <Crown className="w-6 h-6" />
              ) : role === 'admin' ? (
                <Shield className="w-6 h-6" />
              ) : (
                <Scissors className="w-6 h-6 -rotate-45" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white font-cinzel">
                  {cardTitle}
                </h3>
                <span className="rounded-md bg-[#d4af37]/20 border border-[#d4af37]/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#f5d77f] flex items-center gap-1">
                  <Smartphone className="w-2.5 h-2.5" />
                  Instale no Celular
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
                {cardSubtitle}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Direct URL Preview */}
            <div className="hidden lg:flex items-center bg-[#0d0e14] border border-[#272c3d] rounded-xl px-3 py-2 text-xs text-[#f5d77f] font-mono max-w-xs truncate">
              {roleUrl}
            </div>

            {/* Install Button */}
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 active:scale-95 shadow-lg shadow-[#d4af37]/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Instalar Aplicativo</span>
            </button>

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                copied
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-[#161822] border-[#2c3243] text-neutral-200 hover:text-white hover:border-[#d4af37]/40'
              }`}
              title="Copiar link direto para abrir no navegador do celular"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
              <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
              title="Enviar link pelo WhatsApp para abrir no celular"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>
          </div>

        </div>

      </div>

      <InstallAppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={cardTitle}
        roleDescription={cardSubtitle}
        targetUrl={roleUrl}
      />
    </>
  );
};
