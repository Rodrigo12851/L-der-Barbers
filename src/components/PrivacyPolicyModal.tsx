import React from 'react';
import { ShieldCheck, X, Lock, CheckCircle2, UserCheck, Trash2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useSettings();

  if (!isOpen) return null;

  const shopName = settings.name || 'Líder Barbers';
  const shopPhone = settings.phone || '(11) 98765-4321';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#d4af37]/40 bg-[#12141c] text-neutral-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232733] px-6 py-4 bg-[#161822]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-cinzel tracking-wide">
                POLÍTICA DE PRIVACIDADE & LGPD
              </h2>
              <span className="text-[11px] text-[#f5d77f]">
                Conformidade com a Lei Federal nº 13.709/2018 (LGPD)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:text-white hover:bg-[#202433] transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed custom-scrollbar">
          
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-200">
              Na <strong>{shopName}</strong>, a proteção da sua privacidade é prioridade absoluta. Seus dados pessoais são coletados e armazenados com máxima segurança criptográfica e utilizados estritamente para a realização e gestão dos seus atendimentos.
            </p>
          </div>

          <section className="space-y-1.5">
            <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
              1. Quais Dados Coletamos
            </h3>
            <p>
              Ao realizar um agendamento na barbearia, coletamos exclusivamente os dados necessários para identificá-lo presencialmente e confirmar seu horário:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-400">
              <li><strong>Nome Completo / Como prefere ser chamado:</strong> para identificação na recepção e pela equipe de barbeiros.</li>
              <li><strong>WhatsApp / Telefone de Contato:</strong> para envio do comprovante, lembretes de horário e aviso em caso de imprevistos.</li>
              <li><strong>Observações de Atendimento (opcional):</strong> preferências de corte, química ou sensibilidade capilar.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
              2. Finalidade e Base Legal do Tratamento
            </h3>
            <p>
              O tratamento dos dados apoia-se no Art. 7º, incisos I e V da LGPD (Consentimento e Execução de Contrato e Procedimentos Preliminares). Os dados destinam-se exclusivamente a:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-400">
              <li>Garantir a vaga e o horário escolhido com o barbeiro selecionado.</li>
              <li>Gerar o código único de confirmação do voucher.</li>
              <li>Permitir ao cliente consultar e repetir agendamentos com 1 toque na tela "Meus Agendamentos".</li>
              <li><strong>Jamais</strong> comercializamos, compartilhamos ou alugamos suas informações para terceiros.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
              3. Armazenamento e Medidas de Segurança
            </h3>
            <p>
              Adotamos práticas rigorosas de segurança da informação (Art. 46 da LGPD):
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-400">
              <li>Tráfego 100% criptografado através de protocolo HTTPS / TLS.</li>
              <li>Banco de dados em nuvem Google Cloud Firestore com isolamento e criptografia de ponta a ponta.</li>
              <li>Acesso operacional estritamente restrito e autenticado para a equipe da barbearia.</li>
              <li>Consultas públicas filtradas especificamente por telefone/código, sem vazamento da base geral para clientes.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#d4af37]" />
              4. Seus Direitos como Titular (Art. 18 da LGPD)
            </h3>
            <p>
              Você possui total controle sobre seus dados a qualquer momento:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-400">
              <li><strong>Acesso e Confirmação:</strong> consultar seus agendamentos ativos e passados via WhatsApp ou código da reserva.</li>
              <li><strong>Direito ao Esquecimento e Exclusão:</strong> você pode limpar imediatamente todos os dados salvos em seu dispositivo clicando em "Limpar Meus Dados" na aba de agendamentos.</li>
              <li><strong>Cancelamento de Reserva:</strong> cancelar seu horário gratuitamente a qualquer momento direto pelo voucher.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
              5. Canal de Atendimento do Encarregado (DPO)
            </h3>
            <p>
              Para solicitar exclusão definitiva do histórico do sistema ou esclarecer qualquer dúvida sobre o tratamento de dados pessoais, entre em contato diretamente com o responsável da barbearia pelo telefone/WhatsApp <strong>{shopPhone}</strong>.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-[#232733] px-6 py-4 bg-[#161822] flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Atualizado em conformidade com a LGPD • {shopName}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#d4af37] px-5 py-2 text-xs font-bold text-[#0d0e11] hover:bg-[#e5c158] transition cursor-pointer"
          >
            Entendi e Concordo
          </button>
        </div>

      </div>
    </div>
  );
};
