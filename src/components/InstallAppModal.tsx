import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  Check, 
  Share2, 
  PlusSquare, 
  ExternalLink, 
  Copy, 
  Sparkles,
  Monitor,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  roleDescription?: string;
  targetUrl?: string;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  title = 'Instalar Aplicativo Líder Barbers',
  roleDescription = 'Tenha acesso rápido direto da tela de início do seu celular com todas as suas funções.',
  targetUrl
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>(
    isIOS ? 'ios' : 'android'
  );

  if (!isOpen) return null;

  const currentUrl = targetUrl || window.location.href;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = currentUrl;
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

  const handleNativeInstall = async () => {
    if (isInstallable) {
      await install();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl border border-[#d4af37]/40 bg-[#12141c] p-5 sm:p-6 shadow-2xl relative overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-[#d4af37]/15 rounded-full blur-[70px]" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#232734]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#d4af37]/25 to-[#aa8222]/10 border border-[#d4af37]/50 flex items-center justify-center text-[#f5d77f] shadow-inner shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f5d77f] font-cinzel">
                Aplicativo PWA
              </span>
              <h3 className="text-sm sm:text-base font-black text-white font-cinzel leading-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-[#2d3345] bg-[#171a25] flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#d4af37] transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 mt-3 leading-relaxed">
          {roleDescription}
        </p>

        {/* 1-Tap native install button (if browser supports beforeinstallprompt) */}
        {isInstallable && (
          <div className="mt-4 p-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Instalação Automática Disponível!
              </span>
              <span className="text-[10px] uppercase font-black text-emerald-400">1 Toque</span>
            </div>
            <button
              type="button"
              onClick={handleNativeInstall}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Instalar Aplicativo Agora</span>
            </button>
          </div>
        )}

        {/* Device Tabs */}
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#0e1017] border border-[#232838] text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'android'
                  ? 'bg-[#1e2333] text-[#f5d77f] border border-[#d4af37]/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Android / Chrome</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'ios'
                  ? 'bg-[#1e2333] text-[#f5d77f] border border-[#d4af37]/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>iPhone (Safari)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('desktop')}
              className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'desktop'
                  ? 'bg-[#1e2333] text-[#f5d77f] border border-[#d4af37]/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Computador</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-3 p-3.5 rounded-2xl border border-[#232838] bg-[#161824] space-y-2.5 text-xs text-neutral-300">
            {activeTab === 'ios' && (
              <ol className="space-y-2">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[10px] font-bold text-[#f5d77f]">
                    1
                  </span>
                  <span>
                    Abra este link no navegador <strong className="text-white">Safari</strong> do seu iPhone.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[10px] font-bold text-[#f5d77f]">
                    2
                  </span>
                  <span>
                    Toque no botão <strong className="text-white">Compartilhar</strong> (ícone do quadrado com a seta para cima na barra inferior).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[10px] font-bold text-[#f5d77f]">
                    3
                  </span>
                  <span>
                    Role para baixo e selecione <strong className="text-white">"Adicionar à Tela de Início"</strong> e confirme em "Adicionar".
                  </span>
                </li>
              </ol>
            )}

            {activeTab === 'android' && (
              <ol className="space-y-2">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[10px] font-bold text-[#f5d77f]">
                    1
                  </span>
                  <span>
                    Abra este link no navegador <strong className="text-white">Google Chrome</strong> do seu celular.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[10px] font-bold text-[#f5d77f]">
                    2
                  </span>
                  <span>
                    Toque nos <strong className="text-white">3 pontinhos (⋮)</strong> no canto superior direito do Chrome.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[10px] font-bold text-[#f5d77f]">
                    3
                  </span>
                  <span>
                    Selecione <strong className="text-white">"Instalar aplicativo"</strong> ou <strong className="text-white">"Adicionar à tela inicial"</strong>.
                  </span>
                </li>
              </ol>
            )}

            {activeTab === 'desktop' && (
              <ol className="space-y-2">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[10px] font-bold text-[#f5d77f]">
                    1
                  </span>
                  <span>
                    No Google Chrome ou Edge, clique no ícone de <strong className="text-white">Instalar</strong> que aparece na barra de endereço ao lado da estrela.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[10px] font-bold text-[#f5d77f]">
                    2
                  </span>
                  <span>
                    Clique em <strong className="text-white">"Instalar"</strong>. O sistema abrirá em uma janela própria como um software desktop.
                  </span>
                </li>
              </ol>
            )}
          </div>
        </div>

        {/* Copy Link to open on mobile browser */}
        <div className="mt-4 pt-3 border-t border-[#232838] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">
              Link de Acesso do seu Aplicativo:
            </span>
            <span className="text-[10px] text-[#f5d77f]">Abra no navegador do celular</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#0d0e14] border border-[#272c3d] rounded-xl px-3 py-1.5 text-xs text-neutral-200 font-mono truncate">
              {currentUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-500 text-black'
                  : 'bg-[#1e2333] border border-[#d4af37]/40 text-[#f5d77f] hover:bg-[#d4af37]/20'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] text-[#0d0e11] font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer text-center"
          >
            Entendido, Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
