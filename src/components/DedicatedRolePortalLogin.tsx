import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { 
  Crown, 
  Shield, 
  Scissors, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Download, 
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Home,
  Eye,
  EyeOff
} from 'lucide-react';
import { InstallAppModal } from './InstallAppModal';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DedicatedRolePortalLoginProps {
  role: 'owner' | 'admin' | 'barber';
  onLoginSuccess?: () => void;
}

export const DedicatedRolePortalLogin: React.FC<DedicatedRolePortalLoginProps> = ({
  role,
  onLoginSuccess
}) => {
  const { navigate } = useRouter();
  const { login, needsOwnerSetup, setupOwner } = useAuth();
  const { settings } = useSettings();
  const { isInstallable, install } = usePWAInstall();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Initial owner setup state
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  useEffect(() => {
    if (role === 'owner' && needsOwnerSetup) {
      setIsSetupMode(true);
    }
  }, [role, needsOwnerSetup]);

  const roleConfigs = {
    owner: {
      name: 'Portal do Dono do Aplicativo',
      badge: 'Acesso Restrito ao Proprietário',
      icon: Crown,
      color: 'from-[#d4af37]/25 to-[#aa8222]/15',
      borderColor: 'border-[#d4af37]/50',
      textColor: 'text-[#f5d77f]',
      iconColor: 'text-[#d4af37]',
      desc: 'Área exclusiva para cadastro de Administradores da Barbearia, controle de faturamento e gestão do sistema.',
      path: '/proprietario',
      installLabel: 'Baixar App do Dono no Celular'
    },
    admin: {
      name: 'Portal do Administrador',
      badge: 'Gestão da Barbearia & Equipe',
      icon: Shield,
      color: 'from-blue-500/25 to-blue-700/15',
      borderColor: 'border-blue-500/50',
      textColor: 'text-blue-300',
      iconColor: 'text-blue-400',
      desc: 'Área exclusiva para gerenciar serviços, cadastro de barbeiros e agenda completa da barbearia.',
      path: '/admin',
      installLabel: 'Baixar App do Administrador no Celular'
    },
    barber: {
      name: 'Portal do Barbeiro',
      badge: 'Minha Agenda & Atendimentos',
      icon: Scissors,
      color: 'from-emerald-500/25 to-emerald-700/15',
      borderColor: 'border-emerald-500/50',
      textColor: 'text-emerald-300',
      iconColor: 'text-emerald-400',
      desc: 'Área exclusiva para o profissional acompanhar sua agenda diária, novos agendamentos e faturamento.',
      path: '/barbeiro',
      installLabel: 'Baixar Meu App de Barbeiro no Celular'
    }
  };

  const config = roleConfigs[role];
  const IconComp = config.icon;
  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}${config.path}` : config.path;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate(config.path);
      }
    } catch (err: any) {
      setError(err.message || 'Falha no login. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim() || !setupEmail.trim() || !setupPassword) {
      setError('Por favor preencha nome, e-mail e senha.');
      return;
    }
    if (setupPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await setupOwner({
        name: setupName,
        email: setupEmail,
        password: setupPassword,
        phone: setupPhone,
      });
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate(config.path);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao configurar o proprietário no sistema.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
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
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setInstallModalOpen(true);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        
        {/* Role Icon */}
        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${config.color} border ${config.borderColor} shadow-xl mx-auto`}>
          <IconComp className={`h-7 w-7 ${config.iconColor}`} />
        </div>

        <div>
          <span className="rounded-full bg-[#181a24] border border-[#2d3243] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-300">
            {config.badge}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white font-cinzel mt-2">
            {config.name}
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            {config.desc}
          </p>
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        
        {/* Banner: Baixar / Instalar App no Celular */}
        <div className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#171a25] via-[#1d2232] to-[#171a25] p-3.5 sm:p-4 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#f5d77f] shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-cinzel">
                Aplicativo para Celular
              </h4>
              <p className="text-[11px] text-neutral-300">
                Instale este portal na tela do seu telefone
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] px-3.5 py-2 text-xs font-black uppercase text-[#0d0e11] hover:brightness-110 active:scale-95 shadow-md shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
        </div>

        {/* Login Box */}
        <div className="rounded-3xl border border-[#232838] bg-[#12141c] p-6 shadow-2xl space-y-4">
          
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {isSetupMode && role === 'owner' ? (
            /* Formulário de Configuração Inicial do Proprietário */
            <form onSubmit={handleSetupSubmit} className="space-y-3.5">
              <div className="rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 p-3 text-xs text-[#f5d77f]">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Crown className="w-4 h-4 text-[#d4af37]" />
                  <span>Configuração Inicial do Proprietário</span>
                </p>
                <p className="text-[11px] text-neutral-300">
                  Crie sua conta mestre com e-mail e senha exclusivos para proteger o acesso e gerenciar administradores.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    required
                    placeholder="Ex: Carlos Silva"
                    className="w-full rounded-xl border border-[#2b3040] bg-[#161822] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  E-mail do Proprietário
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    required
                    placeholder="seu-email@dominio.com"
                    className="w-full rounded-xl border border-[#2b3040] bg-[#161822] pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  WhatsApp / Celular (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={setupPhone}
                    onChange={(e) => setSetupPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl border border-[#2b3040] bg-[#161822] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Criar Senha Forte (mínimo 6 dígitos)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#2b3040] bg-[#161822] pl-10 pr-10 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    className="absolute right-3 top-2 text-neutral-400 hover:text-[#d4af37] transition cursor-pointer p-1"
                  >
                    {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    value={setupConfirmPassword}
                    onChange={(e) => setSetupConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#2b3040] bg-[#161822] pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] py-2.5 sm:py-3 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 active:scale-95 transition shadow-lg shadow-[#d4af37]/20 disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? 'Cadastrando...' : 'Criar Proprietário & Ativar Sistema'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsSetupMode(false)}
                  className="text-xs text-neutral-400 hover:text-[#d4af37] transition cursor-pointer"
                >
                  Já possui conta criada? <span className="underline text-[#f5d77f]">Fazer login</span>
                </button>
              </div>
            </form>
          ) : (
            /* Formulário de Login Seguro Padrão */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu-email@liderbarbers.com.br"
                    className="w-full rounded-xl border border-[#2b3040] bg-[#161822] pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-[#d4af37] transition cursor-pointer"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ocultar</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver senha</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#2b3040] bg-[#161822] pl-10 pr-10 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    className="absolute right-3 top-2 text-neutral-400 hover:text-[#d4af37] transition cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] py-2.5 sm:py-3 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 active:scale-95 transition shadow-lg shadow-[#d4af37]/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  'Conectando...'
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {role === 'owner' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSetupMode(true)}
                    className="text-xs text-neutral-400 hover:text-[#d4af37] transition cursor-pointer"
                  >
                    Primeiro acesso? <span className="underline text-[#f5d77f]">Configurar conta do proprietário</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Direct Link Copier */}
          <div className="pt-3 border-t border-[#212534] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>Link Exclusivo deste Portal:</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[#f5d77f] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
            <div className="bg-[#0b0c10] border border-[#252938] rounded-xl px-3 py-1.5 text-[11px] text-neutral-300 font-mono truncate">
              {currentUrl}
            </div>
          </div>

        </div>

        {/* Back to main client site */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Voltar ao site da barbearia</span>
          </button>
        </div>

      </div>

      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        title={config.name}
        roleDescription={config.desc}
        targetUrl={currentUrl}
      />
    </div>
  );
};
