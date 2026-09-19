import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { AdminAccount, OwnerOverviewMetrics, OwnerAccount } from '../types';
import { 
  fetchOwnerOverview, 
  fetchOwnerAdmins, 
  fetchOwnerAccounts,
  updateOwnerCredentials,
  createAdminAccount, 
  updateAdminAccount, 
  deleteAdminAccount 
} from '../lib/api';
import { 
  Crown, 
  Shield, 
  UserPlus, 
  DollarSign, 
  Users, 
  Scissors, 
  Calendar, 
  Lock, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  LogOut,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Share2,
  Smartphone,
  Download,
  Sparkles,
  KeyRound,
  Check
} from 'lucide-react';
import { RoleAppDownloadCard } from '../components/RoleAppDownloadCard';
import { DedicatedRolePortalLogin } from '../components/DedicatedRolePortalLogin';
import { ThemeToggle } from '../components/ThemeToggle';

export const OwnerDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const { user, logout, isLoading: authLoading, updateUser } = useAuth();

  const [overview, setOverview] = useState<OwnerOverviewMetrics | null>(null);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [ownerAccounts, setOwnerAccounts] = useState<OwnerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal for creating/editing admin
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Owner credentials change state
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [credSubmitting, setCredSubmitting] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [credSuccess, setCredSuccess] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!authLoading && user && user.role !== 'owner') {
      // If logged in with another role
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user?.email) {
      setCurrentEmail(user.email);
      setNewEmail(user.email);
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovResult, admsResult, ownersResult] = await Promise.allSettled([
        fetchOwnerOverview(),
        fetchOwnerAdmins(),
        fetchOwnerAccounts(),
      ]);

      if (ovResult.status === 'fulfilled' && ovResult.value) {
        setOverview(ovResult.value);
      } else {
        const fallbackOv = await fetchOwnerOverview().catch(() => null);
        if (fallbackOv) setOverview(fallbackOv);
      }

      if (admsResult.status === 'fulfilled' && Array.isArray(admsResult.value)) {
        setAdmins(admsResult.value);
      }

      if (ownersResult.status === 'fulfilled' && Array.isArray(ownersResult.value)) {
        setOwnerAccounts(ownersResult.value);
      }
    } catch (err: any) {
      console.warn('Notice loading owner data, fallback applied:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'owner') {
      loadData();
    }
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenCreateModal = () => {
    setEditingAdmin(null);
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminPhone('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (adm: AdminAccount) => {
    setEditingAdmin(adm);
    setAdminName(adm.name);
    setAdminEmail(adm.email);
    setAdminPassword(''); // Leave blank to keep current
    setAdminPhone(adm.phone || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim()) {
      setFormError('Nome e e-mail são obrigatórios.');
      return;
    }

    if (!editingAdmin && !adminPassword.trim()) {
      setFormError('Informe uma senha para o novo administrador.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingAdmin) {
        const payload: any = {
          name: adminName.trim(),
          email: adminEmail.trim(),
          phone: adminPhone.trim(),
        };
        if (adminPassword.trim()) {
          payload.password = adminPassword.trim();
        }
        const updated = await updateAdminAccount(editingAdmin.id, payload);
        setAdmins(prev => prev.map(a => a.id === updated.id ? updated : a));
        showToast('Administrador atualizado com sucesso!');
      } else {
        const created = await createAdminAccount({
          name: adminName.trim(),
          email: adminEmail.trim(),
          password: adminPassword.trim(),
          phone: adminPhone.trim(),
        });
        setAdmins(prev => [created, ...prev]);
        showToast('Novo administrador cadastrado com sucesso!');
      }
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar administrador.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAdminStatus = async (adm: AdminAccount) => {
    try {
      const updated = await updateAdminAccount(adm.id, { active: !adm.active });
      setAdmins(prev => prev.map(a => a.id === updated.id ? updated : a));
      showToast(`Administrador ${updated.active ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (err: any) {
      showToast(err.message || 'Erro ao alterar status do administrador.', 'error');
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o acesso do administrador ${name}?`)) {
      return;
    }
    try {
      await deleteAdminAccount(id);
      setAdmins(prev => prev.filter(a => a.id !== id));
      showToast('Administrador excluído com sucesso!');
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir administrador.', 'error');
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError(null);
    setCredSuccess(null);

    if (!currentEmail.trim() || !currentPassword.trim()) {
      setCredError('Informe o e-mail antigo e a senha antiga cadastrados para autorizar a alteração.');
      return;
    }

    if (!newEmail.trim() || !newPassword.trim()) {
      setCredError('Informe o novo e-mail e a nova senha.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setCredError('A nova senha e a confirmação de nova senha não coincidem.');
      return;
    }

    if (newPassword.length < 4) {
      setCredError('A nova senha deve possuir no mínimo 4 caracteres.');
      return;
    }

    setCredSubmitting(true);
    try {
      const res = await updateOwnerCredentials({
        currentEmail: currentEmail.trim(),
        currentPassword: currentPassword.trim(),
        newEmail: newEmail.trim(),
        newPassword: newPassword.trim(),
      });

      setCredSuccess('Credenciais atualizadas com sucesso! A partir de agora utilize o novo e-mail e a nova senha.');
      showToast('E-mail e senha de proprietário atualizados com sucesso!', 'success');

      if (res.user) {
        updateUser(res.user);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setCurrentEmail(newEmail.trim());

      await loadData();
    } catch (err: any) {
      console.error('Error updating credentials:', err);
      const msg = err.message || 'Erro ao atualizar credenciais.';
      setCredError(msg);
      showToast(msg, 'error');
    } finally {
      setCredSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0e11] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
      </div>
    );
  }

  // If not logged in, render the dedicated Owner Portal login screen with App Download option
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d0e11]">
        <DedicatedRolePortalLogin role="owner" onLoginSuccess={() => loadData()} />
      </div>
    );
  }

  // O único e-mail autorizado com papel de proprietário é rs3043017@gmail.com
  const isOwnerEmail = user.email?.toLowerCase().trim() === 'rs3043017@gmail.com';

  if (isOwnerEmail && user.role !== 'owner') {
    user.role = 'owner';
  } else if (!isOwnerEmail && user.role === 'owner') {
    user.role = 'customer';
  }

  // If user is logged in as someone else (not owner), guide them
  if (user && user.role !== 'owner') {
    return (
      <div className="min-h-screen bg-[#0d0e11] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-[#232733] bg-[#12141c] p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Crown className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white font-cinzel">Acesso Restrito ao Dono</h2>
          <p className="text-xs text-neutral-300">
            Você está conectado como <strong>{user.name}</strong> ({user.role === 'admin' ? 'Administrador' : 'Barbeiro'}).
            Esta área é exclusiva para o Dono / Proprietário do aplicativo.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate(user.role === 'admin' ? '/admin' : '/barbeiro')}
              className="w-full rounded-xl bg-[#d4af37] py-2.5 text-xs font-bold text-[#0d0e11] hover:brightness-110 cursor-pointer"
            >
              Ir para o meu Painel ({user.role === 'admin' ? 'Administrador' : 'Barbeiro'})
            </button>
            <button
              onClick={async () => {
                await logout();
                navigate('/auth');
              }}
              className="w-full rounded-xl border border-[#2e3344] py-2.5 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
            >
              Trocar de Conta (Entrar como Dono)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e11] py-4 sm:py-8">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 space-y-5">
        
        {/* Toast Alert */}
        {toast && (
          <div className={`fixed bottom-5 right-5 z-50 rounded-xl px-4 py-3 text-xs font-bold shadow-2xl flex items-center gap-2 border ${
            toast.type === 'success' 
              ? 'bg-[#15231c] text-emerald-300 border-emerald-500/40' 
              : 'bg-[#261517] text-rose-300 border-rose-500/40'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Compact Header for Mobile & Desktop */}
        <div className="rounded-2xl border border-[#232838] bg-[#12141c] p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#171a25] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37] font-cinzel">
                  Área do Proprietário
                </span>
                <span className="rounded-md bg-[#d4af37]/15 px-1.5 py-0.5 text-[9px] font-black text-[#f5d77f]">
                  Dono do App
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white font-cinzel leading-tight">
                Líder Barbers — Gestão Geral
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/50 bg-[#191c28] px-3 py-2 text-xs font-bold text-[#f5d77f] hover:bg-[#202534] transition cursor-pointer"
              title="Abrir painel da barbearia"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Painel Admin</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex items-center gap-1 rounded-xl border border-[#2b3145] bg-[#161824] px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#d4af37] ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <ThemeToggle variant="icon" className="!h-8 !w-8 sm:!h-9 sm:!w-9 rounded-xl" />

            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* SECTION: BAIXAR APLICATIVO DO DONO & LINKS DE ACESSO EXCLUSIVOS */}
        <RoleAppDownloadCard role="owner" />

        {/* SECTION: CENTRAL DE LINKS & ACESSOS EXCLUSIVOS DA EQUIPE */}
        <div className="rounded-2xl border border-[#232838] bg-[#12141c] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1f2331] pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <h2 className="text-sm sm:text-base font-bold text-white font-cinzel">
                Central de Links de Acesso & Instalação da Rede
              </h2>
            </div>
            <span className="text-[10px] text-neutral-400">
              Links privados para abrir no celular e baixar o app
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Link do Dono */}
            <div className="rounded-xl border border-[#d4af37]/40 bg-[#161824] p-3 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                    1. Seu Link de Dono
                  </span>
                  <span className="text-[9px] font-bold text-[#f5d77f] uppercase bg-[#d4af37]/15 px-1.5 py-0.5 rounded">
                    Proprietário
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Abra no navegador do seu smartphone para instalar o App do Dono.
                </p>
                <div className="mt-2 bg-[#0d0e14] border border-[#252a3a] rounded-lg px-2.5 py-1 text-[11px] text-[#f5d77f] font-mono truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/proprietario` : '/proprietario'}
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/proprietario`);
                    showToast('Link do Dono copiado!');
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[#d4af37]/40 bg-[#1a1d2c] text-xs font-bold text-[#f5d77f] hover:bg-[#d4af37]/20 transition cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </button>
              </div>
            </div>

            {/* Link do Administrador */}
            <div className="rounded-xl border border-blue-500/40 bg-[#161824] p-3 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    2. Link do Administrador
                  </span>
                  <span className="text-[9px] font-bold text-blue-300 uppercase bg-blue-500/15 px-1.5 py-0.5 rounded">
                    Gestão Barbearia
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Envie ao administrador cadastrado para ele baixar o app e cadastrar barbeiros.
                </p>
                <div className="mt-2 bg-[#0d0e14] border border-[#252a3a] rounded-lg px-2.5 py-1 text-[11px] text-blue-300 font-mono truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/admin` : '/admin'}
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/admin`);
                    showToast('Link do Administrador copiado!');
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-blue-500/40 bg-[#171a29] text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `💈 *Líder Barbers — Acesso do Administrador*\n\nAbra este link no navegador do seu celular para acessar e instalar o Painel de Gestão da Barbearia:\n\n🔗 ${window.location.origin}/admin`
                    );
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition cursor-pointer"
                  title="Enviar via WhatsApp"
                >
                  <Share2 className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Link dos Barbeiros */}
            <div className="rounded-xl border border-emerald-500/40 bg-[#161824] p-3 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                    3. Link dos Barbeiros
                  </span>
                  <span className="text-[9px] font-bold text-emerald-300 uppercase bg-emerald-500/15 px-1.5 py-0.5 rounded">
                    Agenda & Comissões
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Envie aos barbeiros para eles baixarem o app e acompanharem a agenda.
                </p>
                <div className="mt-2 bg-[#0d0e14] border border-[#252a3a] rounded-lg px-2.5 py-1 text-[11px] text-emerald-300 font-mono truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/barbeiro` : '/barbeiro'}
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/barbeiro`);
                    showToast('Link dos Barbeiros copiado!');
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-emerald-500/40 bg-[#171d29] text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `💈 *Líder Barbers — Portal do Barbeiro*\n\nAbra este link no navegador do seu celular para acessar e instalar sua Agenda e Painel de Comissões:\n\n🔗 ${window.location.origin}/barbeiro`
                    );
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition cursor-pointer"
                  title="Enviar via WhatsApp"
                >
                  <Share2 className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Master KPIs Overview - Ultra Compact Mobile Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Faturamento Geral */}
          <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-[#1c1d28] to-[#12141c] p-3.5 shadow-lg">
            <span className="text-[11px] font-bold text-[#d4af37] uppercase flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              Faturamento Bruto
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xs font-bold text-[#d4af37]">R$</span>
              <span className="text-xl sm:text-2xl font-black text-white font-cinzel">
                {(overview?.totalGrossRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Receita total realizada no app
            </p>
          </div>

          {/* Logins de Proprietário Ativos */}
          <div className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-b from-[#1f1e28] to-[#12141c] p-3.5 shadow-lg">
            <span className="text-[11px] font-bold text-[#d4af37] uppercase flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
              Logins do Dono
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-white font-cinzel">
                {overview?.totalActiveOwners ?? ownerAccounts.filter(o => o.active !== false).length}
              </span>
              <span className="text-xs text-[#f5d77f] font-bold">ativos</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Acesso total ao sistema
            </p>
          </div>

          {/* Total Administradores */}
          <div className="rounded-2xl border border-[#232838] bg-[#12141c] p-3.5">
            <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Administradores
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-white font-cinzel">
                {admins.length}
              </span>
              <span className="text-xs text-neutral-400">ativos</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Criados por você
            </p>
          </div>

          {/* Total Barbeiros */}
          <div className="rounded-2xl border border-[#232838] bg-[#12141c] p-3.5">
            <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-emerald-400" />
              Barbeiros Cadastrados
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-white font-cinzel">
                {overview?.totalBarbers || 0}
              </span>
              <span className="text-xs text-neutral-400">profissionais</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Gerenciados pelo Admin
            </p>
          </div>

          {/* Atendimentos Concluídos */}
          <div className="rounded-2xl border border-[#232838] bg-[#12141c] p-3.5">
            <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Atendimentos
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-white font-cinzel">
                {overview?.totalCompletedAppointments || 0}
              </span>
              <span className="text-xs text-neutral-400">cortes</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Concluídos com sucesso
            </p>
          </div>
        </div>

        {/* SECTION: CONTAS DE PROPRIETÁRIO ATIVAS & ALTERAÇÃO DE CREDENCIAIS (E-MAIL E SENHA) */}
        <div className="rounded-2xl border border-[#d4af37]/40 bg-[#12141c] p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2331]">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#d4af37]" />
                <h2 className="text-sm sm:text-base font-bold text-white font-cinzel">
                  Logins de Proprietário Ativos & Segurança de Credenciais
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Visualize quantos logins de proprietário estão ativos e altere seu e-mail ou senha confirmando as credenciais antigas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/40 bg-[#191c28] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#f5d77f]">
                <Lock className="w-3 h-3 text-[#d4af37]" />
                Autenticação Estrita
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Coluna 1: Lista e Contagem de Logins Ativos */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                  Logins de Dono Ativos ({ownerAccounts.filter(o => o.active !== false).length})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  {ownerAccounts.filter(o => o.active !== false).length} ativo(s)
                </span>
              </div>

              <p className="text-[11px] text-neutral-400">
                Estas são as contas autorizadas com nível Proprietário. Nenhuma senha com variação ("dona", "dono", etc.) é aceita pelo sistema — somente senhas exatas cadastradas.
              </p>

              <div className="space-y-2">
                {ownerAccounts.length === 0 ? (
                  <div className="rounded-xl border border-[#222736] bg-[#161824] p-3 text-center text-xs text-neutral-400">
                    Carregando contas de proprietário...
                  </div>
                ) : (
                  ownerAccounts.map((owner) => {
                    const isCurrentSession = user?.email && owner.email.toLowerCase() === user.email.toLowerCase();
                    return (
                      <div
                        key={owner.id}
                        className={`rounded-xl border p-3 transition ${
                          isCurrentSession
                            ? 'border-[#d4af37]/50 bg-gradient-to-r from-[#1b1c27] to-[#161824]'
                            : 'border-[#232838] bg-[#161824]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#1a1d2c] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
                              <Crown className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-white truncate">{owner.name}</h4>
                                {isCurrentSession && (
                                  <span className="rounded bg-[#d4af37]/20 border border-[#d4af37]/50 px-1.5 py-0.2 text-[9px] font-black text-[#f5d77f]">
                                    Sua Sessão
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-[#d4af37]" />
                                {owner.email}
                              </p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                            owner.active !== false
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {owner.active !== false ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[#1f2331] flex items-center justify-between text-[10px] text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-neutral-500" />
                            Senha cadastrada ativa
                          </span>
                          <span className="text-neutral-500">
                            {owner.phone || 'Sem telefone'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300/90 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Regra de Acesso:</strong> Se tentar logar com qualquer senha que não seja a cadastrada no banco, o acesso será sumariamente rejeitado.
                </span>
              </div>
            </div>

            {/* Coluna 2: Formulário de Troca Segura de Credenciais */}
            <div className="lg:col-span-7 rounded-xl border border-[#232838] bg-[#161824] p-4 sm:p-5 space-y-4">
              <div className="border-b border-[#212638] pb-3">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#d4af37]" />
                  Alterar E-mail e Senha do Dono
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Para alterar suas credenciais, é <strong>obrigatório informar o e-mail antigo e a senha antiga cadastrados</strong>. Nenhuma variação é aceita.
                </p>
              </div>

              {credError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{credError}</span>
                </div>
              )}

              {credSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{credSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdateCredentials} className="space-y-3.5">
                {/* Passo 1: Credenciais Antigas para Autorização */}
                <div className="rounded-lg border border-[#2c3245] bg-[#11131b] p-3 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    1. Confirmação das Credenciais Antigas (Obrigatório)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        E-mail Antigo (Atual) *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={currentEmail}
                          onChange={(e) => setCurrentEmail(e.target.value)}
                          placeholder="ex: rodrigomotos79@gmail.com"
                          className="w-full rounded-lg border border-[#2b3145] bg-[#171a25] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                        />
                        <Mail className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Senha Antiga (Atual) *
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Digite sua senha atual exata"
                          className="w-full rounded-lg border border-[#2b3145] bg-[#171a25] px-3 py-2 pr-9 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-2.5 top-2 text-neutral-400 hover:text-white transition cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 2: Novas Credenciais */}
                <div className="rounded-lg border border-[#2c3245] bg-[#11131b] p-3 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1">
                    <KeyRound className="w-3 h-3" />
                    2. Definir Novo E-mail e Nova Senha
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Novo E-mail *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Novo e-mail de acesso"
                          className="w-full rounded-lg border border-[#2b3145] bg-[#171a25] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                        />
                        <Mail className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Nova Senha * (mín. 4 dígitos)
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nova senha segura"
                          className="w-full rounded-lg border border-[#2b3145] bg-[#171a25] px-3 py-2 pr-9 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-2 text-neutral-400 hover:text-white transition cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Confirmar Nova Senha *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repita a nova senha exatamente"
                        className="w-full rounded-lg border border-[#2b3145] bg-[#171a25] px-3 py-2 pr-9 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2 text-neutral-400 hover:text-white transition cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="submit"
                    disabled={credSubmitting}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 shadow-lg shadow-[#d4af37]/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {credSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#0d0e11]" />
                        <span>Validando e Atualizando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-[#0d0e11]" />
                        <span>Confirmar e Salvar Novas Credenciais</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* SECTION: GESTÃO DE ADMINISTRADORES */}
        <div className="rounded-2xl border border-[#232838] bg-[#12141c] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2331]">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#d4af37]" />
                <h2 className="text-sm sm:text-base font-bold text-white font-cinzel">
                  Acessos de Administradores da Barbearia
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Crie o login do Admin que terá permissão para gerenciar a barbearia e criar o acesso dos barbeiros.
              </p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 shadow-lg shadow-[#d4af37]/20 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Administrador</span>
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent mx-auto" />
            </div>
          ) : admins.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#232838] bg-[#161924]/50 py-8 text-center">
              <Shield className="w-8 h-8 text-neutral-600 mx-auto mb-2 opacity-60" />
              <p className="text-xs text-neutral-300 font-semibold">Nenhum administrador cadastrado.</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">Clique em "Novo Administrador" acima para criar o primeiro acesso.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {admins.map((adm) => (
                <div
                  key={adm.id}
                  className="rounded-xl border border-[#222736] bg-[#161824] p-3.5 space-y-3 hover:border-[#d4af37]/40 transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#1c202d] border border-[#2b3145] flex items-center justify-center text-[#d4af37] shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white truncate">{adm.name}</h3>
                        <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-neutral-500" />
                          {adm.email}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                      adm.active !== false
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {adm.active !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {adm.phone && (
                    <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#12141c]">
                      <Phone className="w-3 h-3 text-[#d4af37]" />
                      <span>{adm.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#1e2230] flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const link = `${window.location.origin}/admin`;
                        navigator.clipboard.writeText(link);
                        showToast(`Link copiado para ${adm.name}!`);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/20 transition cursor-pointer"
                      title="Copiar link de acesso deste administrador"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const link = `${window.location.origin}/admin`;
                        const text = encodeURIComponent(
                          `Olá ${adm.name}! Aqui está seu link para acessar e baixar o App de Administrador da Líder Barbers:\n\n🔗 ${link}\n\nLogin: ${adm.email}`
                        );
                        window.open(`https://api.whatsapp.com/send?phone=${adm.phone ? adm.phone.replace(/\D/g, '') : ''}&text=${text}`, '_blank');
                      }}
                      className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                      title="Enviar dados por WhatsApp"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(adm)}
                      className="flex items-center gap-1 rounded-lg border border-[#2c3246] bg-[#1a1d2c] px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:text-white hover:border-[#d4af37]/50 transition cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-[#d4af37]" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => handleToggleAdminStatus(adm)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                        adm.active !== false
                          ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                          : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      {adm.active !== false ? 'Desativar' : 'Ativar'}
                    </button>

                    <button
                      onClick={() => handleDeleteAdmin(adm.id, adm.name)}
                      className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                      title="Excluir administrador"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION: RESUMO FINANCEIRO DOS BARBEIROS */}
        {overview?.barberRevenues && overview.barberRevenues.length > 0 && (
          <div className="rounded-2xl border border-[#232838] bg-[#12141c] p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1f2331]">
              <Scissors className="w-4 h-4 text-[#d4af37]" />
              <h2 className="text-sm sm:text-base font-bold text-white font-cinzel">
                Faturamento Individual dos Barbeiros na Rede
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {overview.barberRevenues.map((b) => (
                <div
                  key={b.barber_id}
                  className="rounded-xl border border-[#222736] bg-[#161824] p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{b.nickname || b.name}</span>
                    <span className="text-[10px] text-neutral-400">{b.completed} corte(s)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#12141c]">
                    <span className="text-neutral-400 text-[11px]">Bruto Gerado:</span>
                    <span className="font-bold text-neutral-200">
                      R$ {Number(b?.gross || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#1a1d2a] border border-[#d4af37]/20">
                    <span className="text-[#f5d77f] text-[11px] font-semibold">Comissão Barbeiro:</span>
                    <span className="font-black text-[#f5d77f]">
                      R$ {Number(b?.net || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* CREATE / EDIT ADMIN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl border border-[#282e40] bg-[#13151f] p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212636] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-sm sm:text-base font-bold text-white font-cinzel">
                  {editingAdmin ? 'Editar Administrador' : 'Criar Novo Administrador'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdmin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="ex: Gerente Carlos"
                  required
                  className="w-full rounded-xl border border-[#2b3145] bg-[#181a26] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  E-mail de Login
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="ex: admin2@liderbarbers.com.br"
                  required
                  className="w-full rounded-xl border border-[#2b3145] bg-[#181a26] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                    {editingAdmin ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha de Acesso'}
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
                        <span>Ver</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder={editingAdmin ? '••••••••' : 'Senha segura'}
                    required={!editingAdmin}
                    className="w-full rounded-xl border border-[#2b3145] bg-[#181a26] pl-3 pr-9 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    className="absolute right-2.5 top-2 text-neutral-400 hover:text-[#d4af37] transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Telefone / WhatsApp (Opcional)
                </label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full rounded-xl border border-[#2b3145] bg-[#181a26] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-[#2b3145] bg-[#181a26] py-2 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] py-2 text-xs font-bold text-[#0d0e11] hover:brightness-110 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingAdmin ? 'Atualizar Admin' : 'Criar Administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
