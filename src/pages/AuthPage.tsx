import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { 
  Scissors, 
  Shield, 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  Crown,
  CheckCircle2,
  Smartphone,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { InstallAppModal } from '../components/InstallAppModal';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const AuthPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, login } = useAuth();
  const { settings } = useSettings();
  const { isInstallable, install } = usePWAInstall();

  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin' | 'barber'>('owner');
  const [email, setEmail] = useState('dono@liderbarbers.com.br');
  const [password, setPassword] = useState('dono');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [copiedRoleLink, setCopiedRoleLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'admin') {
      setSelectedRole('admin');
      setEmail('admin@liderbarbers.com.br');
      setPassword('admin');
    } else if (roleParam === 'barber') {
      setSelectedRole('barber');
      setEmail('marcos@liberdade.com.br');
      setPassword('barber');
    } else if (roleParam === 'owner') {
      setSelectedRole('owner');
      setEmail('dono@liderbarbers.com.br');
      setPassword('dono');
    }
  }, []);

  const handleRoleSelect = (role: 'owner' | 'admin' | 'barber') => {
    setSelectedRole(role);
    setError(null);
    if (role === 'owner') {
      setEmail('dono@liderbarbers.com.br');
      setPassword('dono');
    } else if (role === 'admin') {
      setEmail('admin@liderbarbers.com.br');
      setPassword('admin');
    } else {
      setEmail('marcos@liberdade.com.br');
      setPassword('barber');
    }
  };

  // If already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-[#0d0e11] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-[#232733] bg-[#12141c] p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-[#171a25] border border-[#d4af37]/40 flex items-center justify-center mx-auto text-[#d4af37]">
            {user.role === 'owner' ? (
              <Crown className="w-6 h-6" />
            ) : user.role === 'admin' ? (
              <Shield className="w-6 h-6" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white font-cinzel">Você já está conectado</h2>
          <p className="text-xs text-neutral-300">
            Logado como <strong className="text-white">{user.name}</strong> (
            {user.role === 'owner'
              ? '👑 Dono do Aplicativo'
              : user.role === 'admin'
              ? '🛡️ Administrador'
              : '✂️ Barbeiro'}
            ).
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() =>
                navigate(
                  user.role === 'owner'
                    ? '/proprietario'
                    : user.role === 'admin'
                    ? '/admin'
                    : '/barbeiro'
                )
              }
              className="w-full rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] py-2.5 text-xs font-bold text-[#0d0e11] hover:brightness-110 cursor-pointer"
            >
              {user.role === 'owner'
                ? 'Ir para Área do Dono (Cadastrar Admin)'
                : user.role === 'admin'
                ? 'Ir para Painel Admin (Cadastrar Barbeiros)'
                : 'Ir para Minha Agenda de Barbeiro'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full rounded-xl border border-[#2e3344] py-2.5 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, informe o e-mail e senha.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      setTimeout(() => {
        const saved = localStorage.getItem('liberdade_user');
        if (saved) {
          const u = JSON.parse(saved);
          if (u.role === 'owner') navigate('/proprietario');
          else if (u.role === 'admin') navigate('/admin');
          else navigate('/barbeiro');
        } else {
          navigate('/proprietario');
        }
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string, targetRole: 'owner' | 'admin' | 'barber') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setSelectedRole(targetRole);
    setLoading(true);
    setError(null);
    try {
      await login(demoEmail, demoPass);
      setTimeout(() => {
        const saved = localStorage.getItem('liberdade_user');
        if (saved) {
          const u = JSON.parse(saved);
          if (u.role === 'owner') navigate('/proprietario');
          else if (u.role === 'admin') navigate('/admin');
          else navigate('/barbeiro');
        }
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login rápido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e11] flex flex-col justify-center py-8 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-[120px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 relative">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#181a25] border border-[#d4af37]/40 shadow-inner">
          <Crown className="h-6 w-6 text-[#d4af37]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-tight">
          ACESSO À GESTÃO
        </h1>
        <p className="text-xs text-neutral-400 max-w-sm mx-auto">
          Escolha o perfil para entrar: Dono do App, Administrador da Barbearia ou Barbeiro.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative">
        <div className="rounded-3xl border border-[#252a38] bg-[#12141c] p-5 sm:p-7 shadow-2xl space-y-5">
          
          {/* Role selector tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#0e1017] border border-[#212534]">
            <button
              type="button"
              onClick={() => handleRoleSelect('owner')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition cursor-pointer ${
                selectedRole === 'owner'
                  ? 'bg-[#1e2232] text-[#f5d77f] border border-[#d4af37]/50 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Crown className="w-4 h-4 mb-0.5 text-[#d4af37]" />
              <span className="text-[11px] font-bold">1. Dono do App</span>
              <span className="text-[9px] text-neutral-400">Cadastra Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-[#1e2232] text-blue-300 border border-blue-500/50 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 mb-0.5 text-blue-400" />
              <span className="text-[11px] font-bold">2. Administrador</span>
              <span className="text-[9px] text-neutral-400">Cadastra Barbeiros</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('barber')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition cursor-pointer ${
                selectedRole === 'barber'
                  ? 'bg-[#1e2232] text-emerald-300 border border-emerald-500/50 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Scissors className="w-4 h-4 mb-0.5 text-emerald-400" />
              <span className="text-[11px] font-bold">3. Barbeiro</span>
              <span className="text-[9px] text-neutral-400">Minha Agenda</span>
            </button>
          </div>

          {/* Role explanation banner */}
          <div className="rounded-xl border border-[#232838] bg-[#161824] p-3 text-xs">
            {selectedRole === 'owner' && (
              <div className="flex items-start gap-2">
                <Crown className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <p className="text-neutral-300">
                  <strong className="text-[#f5d77f]">Área do Proprietário:</strong> Aqui você cadastra e gerencia as contas dos <strong className="text-white">Administradores</strong> da barbearia e acompanha o faturamento geral.
                </p>
              </div>
            )}
            {selectedRole === 'admin' && (
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-neutral-300">
                  <strong className="text-blue-300">Painel do Administrador:</strong> O admin cadastrado pelo dono acessa aqui para <strong className="text-white">cadastrar os barbeiros</strong>, definir comissões, gerenciar serviços e a agenda.
                </p>
              </div>
            )}
            {selectedRole === 'barber' && (
              <div className="flex items-start gap-2">
                <Scissors className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-neutral-300">
                  <strong className="text-emerald-300">Portal do Barbeiro:</strong> Acesso individual para o profissional visualizar sua agenda do dia, clientes agendados e comissões recebidas.
                </p>
              </div>
            )}
          </div>

          {/* Direct App Install / Copy link banner */}
          <div className="rounded-xl border border-[#d4af37]/30 bg-[#141724] p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Instalar Aplicativo no Celular</p>
                <p className="text-[10px] text-neutral-400">Acesse com 1 toque direto da tela inicial</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isInstallable) {
                  install();
                } else {
                  setInstallModalOpen(true);
                }
              }}
              className="flex items-center gap-1 rounded-lg bg-[#d4af37] px-3 py-1.5 text-xs font-black text-[#0d0e11] hover:brightness-110 shrink-0 cursor-pointer transition shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar App</span>
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                E-mail de Login
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: dono@liderbarbers.com.br"
                  required
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
                  placeholder="••••••••"
                  required
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
                  <span>
                    {selectedRole === 'owner'
                      ? 'Entrar como Dono do App'
                      : selectedRole === 'admin'
                      ? 'Entrar como Administrador'
                      : 'Entrar como Barbeiro'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Buttons (1 Click) */}
          <div className="pt-4 border-t border-[#212534] space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs text-[#f5d77f] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Acesso Rápido em 1 Toque:</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Botão Dono */}
              <button
                type="button"
                onClick={() => handleQuickLogin('dono@liderbarbers.com.br', 'dono', 'owner')}
                className="flex items-center justify-between rounded-xl border border-[#d4af37]/40 bg-[#171924] px-3.5 py-2 text-left text-xs hover:border-[#d4af37] transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-[#d4af37]" />
                  <div>
                    <span className="font-bold text-white block group-hover:text-[#f5d77f]">
                      Entrar como Dono do Aplicativo
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      dono@liderbarbers.com.br • Cadastrar Administradores
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#f5d77f] opacity-0 group-hover:opacity-100 transition">Entrar →</span>
              </button>

              {/* Botão Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@liderbarbers.com.br', 'admin', 'admin')}
                className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-[#161924] px-3.5 py-2 text-left text-xs hover:border-blue-400 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="font-bold text-white block group-hover:text-blue-300">
                      Entrar como Administrador da Barbearia
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      admin@liderbarbers.com.br • Cadastrar Barbeiros
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-300 opacity-0 group-hover:opacity-100 transition">Entrar →</span>
              </button>

              {/* Botão Barbeiro */}
              <button
                type="button"
                onClick={() => handleQuickLogin('marcos@liberdade.com.br', 'barber', 'barber')}
                className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-[#161924] px-3.5 py-2 text-left text-xs hover:border-emerald-400 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Scissors className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white block group-hover:text-emerald-300">
                      Entrar como Barbeiro (Mestre Valente)
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      marcos@liberdade.com.br • Ver Agenda & Comissões
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 opacity-0 group-hover:opacity-100 transition">Entrar →</span>
              </button>
            </div>
          </div>

        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-neutral-400 hover:text-white transition cursor-pointer"
          >
            ← Voltar para a página de agendamentos
          </button>
        </div>
      </div>

      {/* PWA Install Instructions Modal */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        roleName={selectedRole === 'owner' ? 'Proprietário' : selectedRole === 'admin' ? 'Administrador' : 'Barbeiro'}
      />
    </div>
  );
};
