import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'banner' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  // If already running standalone, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) setInstalledNotice(true);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (!isInstallable && !isIOS && !installedNotice) {
    // Still render a friendly desktop shortcut option if wanted, or subtle icon
    return null;
  }

  if (variant === 'nav') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1.5 text-xs font-semibold text-[#f5d77f] hover:bg-[#d4af37]/20 transition shadow-sm active:scale-95"
          title="Instalar aplicativo Barbearia Liberdade"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Instalar App</span>
        </button>

        {showIOSGuide && <IOSModal onClose={() => setShowIOSGuide(false)} />}
      </>
    );
  }

  if (variant === 'banner') {
    return (
      <section className="bg-[#12141b] border-b border-[#232733] py-3 sm:py-4">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-xl border border-[#d4af37]/30 bg-[#16181f]/95 p-3.5 sm:p-4 shadow-xl backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-left w-full sm:w-auto">
              <div className="w-10 h-10 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Instale o App Líder Barbers</h4>
                <p className="text-xs text-neutral-400">Agende cortes mais rápido direto da tela do seu celular</p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#aa8222] px-4 py-2 text-xs font-bold text-[#0d0e11] hover:brightness-110 transition shadow-md whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isIOS ? 'Como Instalar no iPhone' : 'Instalar Agora'}
            </button>
          </div>
        </div>

        {showIOSGuide && <IOSModal onClose={() => setShowIOSGuide(false)} />}
      </section>
    );
  }

  return null;
};

function IOSModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[#d4af37]/30 bg-[#14161c] p-6 shadow-2xl text-left">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#d4af37]" />
            <h3 className="text-base font-bold text-white font-cinzel">Instalar no iPhone</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ol className="mt-4 space-y-3 text-xs text-neutral-300">
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[11px] font-bold text-[#f5d77f]">
              1
            </span>
            <span>
              Toque no botão <strong className="text-white">Compartilhar</strong> (ícone do quadrado com a seta para cima) na barra do Safari.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[11px] font-bold text-[#f5d77f]">
              2
            </span>
            <span>
              Role para baixo e selecione <strong className="text-white">Adicionar à Tela de Início</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[11px] font-bold text-[#f5d77f]">
              3
            </span>
            <span>
              Toque em <strong className="text-white">Adicionar</strong> no canto superior direito. Pronto!
            </span>
          </li>
        </ol>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-[#d4af37] py-2.5 text-xs font-bold text-[#0d0e11] hover:brightness-110 transition text-center"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
