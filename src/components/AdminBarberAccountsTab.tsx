import React, { useState, useEffect } from 'react';
import { BarberAccount, Barber } from '../types';
import { 
  fetchAdminBarberAccounts, 
  createBarberAccount, 
  updateBarberAccount, 
  deleteBarberAccount,
  fetchBarbers,
  createBarber
} from '../lib/api';
import { 
  Key, 
  UserCheck, 
  UserX, 
  Edit3, 
  Trash2, 
  Scissors, 
  Percent, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Plus, 
  AlertCircle, 
  CheckCircle2,
  Shield,
  UserPlus,
  Copy,
  Check,
  Share2,
  Smartphone,
  ExternalLink,
  Link2
} from 'lucide-react';

export const AdminBarberAccountsTab: React.FC = () => {
  const [accounts, setAccounts] = useState<BarberAccount[]>([]);
  const [allBarbers, setAllBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isCreatingNewBarberProfile, setIsCreatingNewBarberProfile] = useState(true);
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [commissionRate, setCommissionRate] = useState(50);
  const [accountName, setAccountName] = useState('');
  const [accountNickname, setAccountNickname] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [accs, brbs] = await Promise.all([
        fetchAdminBarberAccounts(),
        fetchBarbers(true),
      ]);
      setAccounts(accs);
      setAllBarbers(brbs);
    } catch (err: any) {
      console.error('Error loading barber accounts:', err);
      showToast('Erro ao carregar acessos dos barbeiros.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCopyLink = async (url: string, key: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedKey(key);
      showToast(`${label} copiado!`);
      setTimeout(() => setCopiedKey(null), 3000);
    } catch {
      showToast(`Link: ${url}`);
    }
  };

  const handleShareBarberApp = (acc: BarberAccount) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const appUrl = `${origin}/barbeiro`;
    const barberName = acc.nickname || acc.barber_name?.split(' ')[0] || 'Barbeiro';
    const text = encodeURIComponent(
      `💈 *Líder Barbers — Acesso do Barbeiro*\n\nOlá ${barberName}! Seu acesso ao portal e aplicativo foi configurado.\n\n📲 *Abra no seu celular para baixar o app e acessar sua agenda:*\n${appUrl}\n\n🔑 *Seu Login:* ${acc.email}\n(Utilize a senha cadastrada para entrar)`
    );
    const phone = acc.phone ? acc.phone.replace(/\D/g, '') : '';
    const waUrl = phone ? `https://wa.me/55${phone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
    window.open(waUrl, '_blank');
  };

  const handleShareBarberClientLink = (acc: BarberAccount) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const clientUrl = `${origin}/agendar?barbeiro=${acc.barber_id}`;
    const barberName = acc.nickname || acc.barber_name?.split(' ')[0] || 'Barbeiro';
    const text = encodeURIComponent(
      `💈 *Agendamento Exclusivo — ${barberName} | Líder Barbers*\n\nReserve seu horário diretamente comigo pelo link abaixo:\n🔗 ${clientUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Open modal to create a new barber from scratch
  const handleOpenCreateNewBarber = () => {
    setFormError(null);
    setShowPassword(false);
    setEditingUserId(null);
    setIsCreatingNewBarberProfile(true);
    setSelectedBarberId('');
    setAccountName('');
    setAccountNickname('');
    setAccountEmail('');
    setAccountPhone('');
    setCommissionRate(50);
    setAccountPassword('');
    setModalOpen(true);
  };

  // Open modal for an existing barber item
  const handleOpenAccountModal = (barber: BarberAccount | Barber) => {
    setFormError(null);
    setShowPassword(false);
    setIsCreatingNewBarberProfile(false);

    if ('barber_id' in barber) {
      // It's a BarberAccount
      setSelectedBarberId(barber.barber_id);
      setAccountName(barber.barber_name || barber.name || '');
      setAccountNickname(barber.nickname || '');
      setAccountEmail(barber.email || '');
      setAccountPhone(barber.phone || '');
      setCommissionRate(barber.commission_rate || 50);
      setEditingUserId(barber.user_id || null);
      setAccountPassword('');
    } else {
      // It's a Barber
      setSelectedBarberId(barber.id);
      setAccountName(barber.name || '');
      setAccountNickname(barber.nickname || '');
      setAccountEmail(barber.email || '');
      setAccountPhone(barber.phone || '');
      setCommissionRate(50);
      setEditingUserId(null);
      setAccountPassword('');
    }
    setModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountName.trim() && isCreatingNewBarberProfile) {
      setFormError('Informe o nome do barbeiro.');
      return;
    }

    if (!accountEmail.trim()) {
      setFormError('Informe o e-mail de login do barbeiro.');
      return;
    }

    if (!editingUserId && !accountPassword.trim()) {
      setFormError('Informe uma senha inicial para o barbeiro.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingUserId) {
        // Updating existing login
        const payload: any = {
          email: accountEmail.trim(),
          name: accountName.trim(),
          phone: accountPhone.trim(),
          commission_rate: Number(commissionRate) || 50,
        };
        if (accountPassword.trim()) {
          payload.password = accountPassword.trim();
        }
        await updateBarberAccount(editingUserId, payload);
        showToast('Acesso do barbeiro atualizado com sucesso!');
      } else if (isCreatingNewBarberProfile) {
        // 1. Create Barber profile first
        const newBarber = await createBarber({
          name: accountName.trim(),
          nickname: accountNickname.trim() || accountName.trim().split(' ')[0],
          email: accountEmail.trim(),
          phone: accountPhone.trim(),
          specialties: ['Corte Clássico', 'Barboterapia'],
          active: true,
        });

        // 2. Create login account for this new barber
        await createBarberAccount({
          barber_id: newBarber.id,
          email: accountEmail.trim(),
          password: accountPassword.trim(),
          name: accountName.trim(),
          phone: accountPhone.trim(),
          commission_rate: Number(commissionRate) || 50,
        });
        showToast(`Barbeiro ${accountName} cadastrado com sucesso!`);
      } else {
        // Link to existing barber
        if (!selectedBarberId) {
          setFormError('Selecione um barbeiro existente.');
          setSubmitting(false);
          return;
        }

        await createBarberAccount({
          barber_id: selectedBarberId,
          email: accountEmail.trim(),
          password: accountPassword.trim(),
          name: accountName.trim(),
          phone: accountPhone.trim(),
          commission_rate: Number(commissionRate) || 50,
        });
        showToast('Login de barbeiro criado com sucesso!');
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar cadastro do barbeiro.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (account: BarberAccount) => {
    if (!account.user_id) return;
    try {
      await updateBarberAccount(account.user_id, { active: !account.active });
      showToast(`Acesso do barbeiro ${!account.active ? 'ativado' : 'desativado'} com sucesso!`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar status.', 'error');
    }
  };

  const handleDeleteAccount = async (account: BarberAccount) => {
    if (!account.user_id) return;
    if (!window.confirm(`Tem certeza que deseja revogar o login de ${account.barber_name || account.name || 'este barbeiro'}?`)) {
      return;
    }
    try {
      await deleteBarberAccount(account.user_id);
      showToast('Acesso do barbeiro revogado.');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao revogar acesso.', 'error');
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#141722] border border-[#232838] p-3.5 sm:p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-sm sm:text-base font-bold text-white font-cinzel">
              Cadastro de Barbeiros & Acessos
            </h2>
            <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
              Admin
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Cadastre novos barbeiros com login, senha e comissão para que eles acessem a própria agenda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-[#2c3246] bg-[#1a1d2c] px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#d4af37] ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={handleOpenCreateNewBarber}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#0d0e11] hover:brightness-110 shadow-lg shadow-[#d4af37]/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#0d0e11]" />
            <span>+ Cadastrar Novo Barbeiro</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent mx-auto" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#232838] bg-[#12141c]/50 p-8 text-center space-y-3">
          <Scissors className="w-8 h-8 text-neutral-600 mx-auto opacity-50" />
          <p className="text-xs text-neutral-300 font-semibold">Nenhum barbeiro cadastrado no momento.</p>
          <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
            Clique no botão acima para cadastrar o primeiro barbeiro com seu nome, login, senha e porcentagem de comissão.
          </p>
          <button
            onClick={handleOpenCreateNewBarber}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#0d0e11] hover:brightness-110 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Primeiro Barbeiro</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accounts.map((acc) => (
            <div
              key={acc.barber_id}
              className="rounded-xl border border-[#212636] bg-[#13151f] p-3.5 sm:p-4 space-y-3 hover:border-[#d4af37]/40 transition group"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1a1d29] border border-[#2f3547] flex items-center justify-center text-[#d4af37] shrink-0 font-black font-cinzel text-sm">
                    {acc.barber_name?.charAt(0) || 'B'}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#f5d77f] transition">
                      {acc.barber_name}
                    </h4>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {acc.nickname ? `"${acc.nickname}"` : 'Barbeiro'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {acc.has_account ? (
                    acc.active !== false ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        <UserCheck className="w-3 h-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                        <UserX className="w-3 h-3" />
                        Inativo
                      </span>
                    )
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      Sem Login
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 pt-1 text-xs text-neutral-300">
                {acc.has_account ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="text-neutral-400 text-[11px]">Login:</span>
                      <strong className="text-white font-mono text-[11px] truncate">{acc.email}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <Percent className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                      <span className="text-neutral-400 text-[11px]">Comissão:</span>
                      <strong className="text-[#f5d77f] font-bold">{acc.commission_rate || 50}% do corte</strong>
                    </div>

                    {acc.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span className="text-neutral-400 text-[11px]">Contato:</span>
                        <span className="text-neutral-300 text-[11px]">{acc.phone}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-amber-400/90 italic">
                    Este barbeiro existe na vitrine mas ainda não possui login de acesso próprio.
                  </p>
                )}
              </div>

              {/* Links Exclusivos do Barbeiro (App & Clientes) */}
              <div className="rounded-xl border border-[#232838] bg-[#0c0d14] p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#1b1f2e] pb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#f5d77f] flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-[#d4af37]" />
                    Links deste Barbeiro
                  </span>
                  <span className="text-[9px] text-neutral-400">App da Equipe & Clientes</span>
                </div>

                {/* 1. Link do App do Barbeiro */}
                <div className="rounded-lg bg-[#141724] border border-[#202538] p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="w-3 h-3 text-emerald-400" />
                      1. App do Barbeiro (Área Dele / Baixar App)
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                      /barbeiro
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    O barbeiro abre este link no celular para entrar na área dele e instalar o app na tela inicial.
                  </p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(`${window.location.origin}/barbeiro`, `app-${acc.barber_id}`, 'Link do App do Barbeiro')}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-[#1c2032] border border-[#2c334d] text-[11px] font-bold text-neutral-200 hover:text-white hover:border-[#d4af37] transition cursor-pointer"
                    >
                      {copiedKey === `app-${acc.barber_id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-neutral-400" />
                          <span>Copiar Link do App</span>
                        </>
                      )}
                    </button>

                    {acc.has_account && (
                      <button
                        type="button"
                        onClick={() => handleShareBarberApp(acc)}
                        className="flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 hover:bg-emerald-600/30 transition cursor-pointer"
                        title="Enviar acesso completo via WhatsApp para o barbeiro"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Link Exclusivo para Clientes */}
                <div className="rounded-lg bg-[#141724] border border-[#d4af37]/30 p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#f5d77f] flex items-center gap-1.5">
                      <Scissors className="w-3 h-3 text-[#d4af37]" />
                      2. Link para Clientes (Cai Direto com Ele)
                    </span>
                    <span className="text-[9px] font-mono text-[#f5d77f] bg-[#d4af37]/15 border border-[#d4af37]/40 px-1.5 py-0.2 rounded">
                      Pré-selecionado
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    O barbeiro repassa aos clientes. Ao clicar, ele já vem selecionado e o cliente escolhe o horário!
                  </p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(`${window.location.origin}/agendar?barbeiro=${acc.barber_id}`, `client-${acc.barber_id}`, 'Link de Clientes do Barbeiro')}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-[#1c2032] border border-[#2c334d] text-[11px] font-bold text-neutral-200 hover:text-white hover:border-[#d4af37] transition cursor-pointer"
                    >
                      {copiedKey === `client-${acc.barber_id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#d4af37]" />
                          <span>Copiar Link de Clientes</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareBarberClientLink(acc)}
                      className="flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 hover:bg-emerald-600/30 transition cursor-pointer"
                      title="Compartilhar agendamento no WhatsApp"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>

                    <a
                      href={`/agendar?barbeiro=${acc.barber_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-[#181a26] border border-[#292e42] text-[11px] font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
                      title="Testar link de agendamento"
                    >
                      <ExternalLink className="w-3 h-3 text-[#d4af37]" />
                      <span>Testar</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#1e2332]">
                {acc.has_account ? (
                  <>
                    <button
                      onClick={() => handleOpenAccountModal(acc)}
                      className="flex items-center gap-1 rounded-lg border border-[#2b3145] bg-[#181a26] px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:text-white hover:border-[#d4af37] transition cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-[#d4af37]" />
                      <span>Alterar Senha / Comissão</span>
                    </button>

                    <button
                      onClick={() => handleToggleStatus(acc)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                        acc.active !== false
                          ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                          : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      {acc.active !== false ? 'Desativar' : 'Ativar'}
                    </button>

                    <button
                      onClick={() => handleDeleteAccount(acc)}
                      className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                      title="Excluir login de acesso"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenAccountModal(acc)}
                    className="flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-1 text-[11px] font-bold text-[#0d0e11] hover:brightness-110 transition cursor-pointer"
                  >
                    <Key className="w-3 h-3" />
                    <span>Criar Login deste Barbeiro</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT BARBER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl border border-[#282e40] bg-[#13151f] p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212636] pb-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-sm sm:text-base font-bold text-white font-cinzel">
                  {editingUserId 
                    ? 'Editar Acesso do Barbeiro' 
                    : isCreatingNewBarberProfile 
                    ? 'Cadastrar Novo Barbeiro' 
                    : 'Criar Login para Barbeiro'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white text-sm cursor-pointer"
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

            <form onSubmit={handleSaveAccount} className="space-y-3">
              
              {/* If creating new, show toggle or fields */}
              {!editingUserId && allBarbers.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#171924] border border-[#2b3145]">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewBarberProfile(true)}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      isCreatingNewBarberProfile
                        ? 'bg-[#d4af37] text-[#0d0e11]'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    + Novo Barbeiro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewBarberProfile(false);
                      if (!selectedBarberId && allBarbers[0]) {
                        setSelectedBarberId(allBarbers[0].id);
                        setAccountName(allBarbers[0].name);
                        setAccountNickname(allBarbers[0].nickname || '');
                        if (allBarbers[0].email) setAccountEmail(allBarbers[0].email);
                        if (allBarbers[0].phone) setAccountPhone(allBarbers[0].phone);
                      }
                    }}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      !isCreatingNewBarberProfile
                        ? 'bg-[#d4af37] text-[#0d0e11]'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Vincular Existente
                  </button>
                </div>
              )}

              {/* Nome do Barbeiro */}
              {isCreatingNewBarberProfile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="ex: Lucas da Silva"
                      required
                      className="w-full rounded-xl border border-[#2b3145] bg-[#181a26] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                      Apelido no App
                    </label>
                    <input
                      type="text"
                      value={accountNickname}
                      onChange={(e) => setAccountNickname(e.target.value)}
                      placeholder="ex: Lucas Fade"
                      className="w-full rounded-xl border border-[#2b3145] bg-[#181a26] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Selecionar Barbeiro
                  </label>
                  <select
                    value={selectedBarberId}
                    onChange={(e) => {
                      setSelectedBarberId(e.target.value);
                      const brb = allBarbers.find(b => b.id === e.target.value);
                      if (brb) {
                        setAccountName(brb.name);
                        setAccountNickname(brb.nickname || '');
                        if (brb.email) setAccountEmail(brb.email);
                        if (brb.phone) setAccountPhone(brb.phone);
                      }
                    }}
                    disabled={!!editingUserId}
                    className="w-full rounded-xl border border-[#2b3145] bg-[#181a26] px-3 py-2 text-xs text-white focus:border-[#d4af37] focus:outline-none"
                  >
                    {allBarbers.map((b) => (
                      <option key={b.id} value={b.id} className="bg-[#13151f] text-white">
                        {b.name} ({b.nickname})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Email de Login */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  E-mail de Acesso (Login do Barbeiro)
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  placeholder="ex: lucas@liderbarbers.com.br"
                  required
                  className="w-full rounded-xl border border-[#2b3145] bg-[#181a26] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              {/* Senha */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                    {editingUserId ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial de Acesso'}
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
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder={editingUserId ? '••••••••' : 'Crie a senha do barbeiro'}
                    required={!editingUserId}
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

              {/* Comissão & Telefone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Comissão (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      required
                      className="w-full rounded-xl border border-[#2b3145] bg-[#181a26] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-[#d4af37]">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={accountPhone}
                    onChange={(e) => setAccountPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full rounded-xl border border-[#2b3145] bg-[#181a26] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
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
                  {submitting ? 'Salvando...' : editingUserId ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
