import React, { useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Trash2, 
  Scissors, 
  Sparkles, 
  Store, 
  Phone, 
  MapPin, 
  RefreshCw,
  Eye
} from 'lucide-react';

export const AdminSettingsTab: React.FC<{ onNotify: (msg: string, type?: 'success' | 'error') => void }> = ({ onNotify }) => {
  const { settings, updateSettings, refreshSettings } = useSettings();

  const [name, setName] = useState(settings.name || 'Líder Barbers');
  const [tagline, setTagline] = useState(settings.tagline || 'Barbearia Clássica');
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '');
  const [heroImageUrl, setHeroImageUrl] = useState(settings.hero_image_url || '');
  const [phone, setPhone] = useState(settings.phone || '(11) 98765-4321');
  const [address, setAddress] = useState(settings.address || 'Av. Paulista, 1000 — São Paulo, SP');

  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_url || null);
  const [heroPreview, setHeroPreview] = useState<string | null>(settings.hero_image_url || null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // Helper to process uploaded file to data URL
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setTargetState: (url: string) => void,
    setTargetPreview: (url: string) => void,
    fieldLabel: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify('Por favor selecione um arquivo de imagem válido (PNG, JPG, WEBP, SVG)', 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      onNotify('A imagem deve ter no máximo 15MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setTargetState(dataUrl);
        setTargetPreview(dataUrl);
        onNotify(`${fieldLabel} carregada com sucesso! Clique em "Salvar Alterações" para confirmar.`);
      }
    };
    reader.onerror = () => {
      onNotify('Erro ao processar imagem', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      onNotify('O nome da barbearia é obrigatório', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        name: name.trim(),
        tagline: tagline.trim(),
        logo_url: logoUrl.trim(),
        hero_image_url: heroImageUrl.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      onNotify('Configurações e identidade visual atualizadas com sucesso!');
    } catch (err: any) {
      onNotify('Erro ao salvar alterações: ' + (err.message || 'Erro desconhecido'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetLogo = () => {
    setLogoUrl('');
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
    onNotify('Logo removida. O ícone clássico dourado será utilizado.');
  };

  const handleResetHero = () => {
    const defaultHero = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80';
    setHeroImageUrl(defaultHero);
    setHeroPreview(defaultHero);
    if (heroInputRef.current) heroInputRef.current.value = '';
    onNotify('Foto principal restaurada para a imagem clássica.');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Explanatory */}
      <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#171924] to-[#12141c] p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 px-3 py-0.5 text-[11px] font-bold text-[#f5d77f]">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Personalização da Marca</span>
            </div>
            <h2 className="text-xl font-black text-white font-cinzel tracking-wide">
              IDENTIDADE VISUAL & FOTOS DA BARBEARIA
            </h2>
            <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
              Personalize a logo da sua barbearia para o cabeçalho (marcada em vermelho no topo), troque as fotos do site escolhendo diretamente do seu computador ou celular, e altere nome, telefone e endereço.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#0d0e11] shadow-xl shadow-[#d4af37]/20 hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#0d0e11]" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Logo & Hero Photo (Visual Controls) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card 1: Logo da Barbearia (Highlighted in Red in User Request) */}
          <div className="rounded-2xl border-2 border-[#d4af37]/40 bg-[#12141c] p-6 shadow-xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-[#232733] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#181a25] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37]">
                  <Scissors className="w-4 h-4 -rotate-45" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Logo da Barbearia (Topo / Cabeçalho)
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    Aparece no canto superior esquerdo em todas as telas
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                Ao Vivo
              </span>
            </div>

            {/* Live Preview of Header Logo Component */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Pré-visualização de como aparece no cabeçalho:
              </label>
              <div className="rounded-xl border border-[#272c3d] bg-[#0d0e11] p-4 flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-[#171922] border-2 border-[#d4af37] shadow-inner overflow-hidden p-1">
                    <img
                      src={logoPreview}
                      alt="Logo da Barbearia"
                      className="h-full w-full object-contain rounded-lg"
                    />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse" />
                  </div>
                ) : (
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-[#171922] border-2 border-[#d4af37]/60 shadow-inner">
                    <Scissors className="h-6 w-6 text-[#d4af37] -rotate-45" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse" />
                  </div>
                )}
                <div>
                  <span className="block font-cinzel text-lg font-black tracking-wider text-white">
                    {name || 'LÍDER BARBERS'}
                  </span>
                  <span className="block text-[11px] font-semibold tracking-[0.25em] text-[#9ca3af] uppercase">
                    {tagline || 'Barbearia Clássica'}
                  </span>
                </div>
              </div>
            </div>

            {/* Upload Button */}
            <div className="space-y-3 pt-2">
              <input
                type="file"
                ref={logoInputRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setLogoUrl, setLogoPreview, 'Logo')}
                className="hidden"
                id="logo-file-input"
              />

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#d4af37]/60 bg-[#191d29] px-4 py-3 text-xs font-bold text-[#f5d77f] hover:bg-[#202534] hover:border-[#d4af37] transition cursor-pointer shadow-md"
                >
                  <Upload className="w-4 h-4 text-[#d4af37]" />
                  <span>Escolher Foto da Logo do Computador / Celular</span>
                </button>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-3 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                    title="Remover logo e usar ícone padrão"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remover</span>
                  </button>
                )}
              </div>

              {/* Or manual URL */}
              <div className="pt-2">
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Ou digite o link direto da imagem (URL externa):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={logoUrl.startsWith('data:') ? '(Foto carregada via arquivo do dispositivo)' : logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      setLogoPreview(e.target.value || null);
                    }}
                    placeholder="https://exemplo.com/minha-logo.png"
                    disabled={logoUrl.startsWith('data:')}
                    className="flex-1 rounded-xl border border-[#2b3040] bg-[#161822] px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none disabled:opacity-70"
                  />
                  {logoUrl.startsWith('data:') && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrl('');
                        setLogoPreview(null);
                      }}
                      className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white border border-[#2d3243] rounded-lg bg-[#191c28]"
                    >
                      Alterar para Link
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Foto Principal do Site (Hero Banner) */}
          <div className="rounded-2xl border border-[#2a2f3f] bg-[#12141c] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#232733] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#181a25] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Foto de Destaque da Barbearia (Início)
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    Foto do ambiente ou corte em destaque na página inicial
                  </span>
                </div>
              </div>
            </div>

            {/* Live Preview of Hero Card */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Prévia da foto no site:
              </label>
              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-[#2d3244] bg-neutral-900 shadow-lg">
                <img
                  src={heroPreview || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80'}
                  alt="Foto de Destaque da Barbearia"
                  className="h-full w-full object-cover brightness-90 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e11]/80 via-transparent to-black/20" />
                <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-[#d4af37]/40 bg-[#12141c]/90 p-2.5 backdrop-blur-sm">
                  <span className="text-[11px] font-bold text-[#f5d77f] block">
                    Experiência {name || 'Líder Barbers'}
                  </span>
                  <span className="text-xs text-white font-medium">Toalha Quente & Ozonioterapia</span>
                </div>
              </div>
            </div>

            {/* Hero Upload Button */}
            <div className="space-y-3 pt-2">
              <input
                type="file"
                ref={heroInputRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setHeroImageUrl, setHeroPreview, 'Foto de Destaque')}
                className="hidden"
                id="hero-file-input"
              />

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => heroInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#d4af37]/60 bg-[#191d29] px-4 py-3 text-xs font-bold text-[#f5d77f] hover:bg-[#202534] hover:border-[#d4af37] transition cursor-pointer shadow-md"
                >
                  <Upload className="w-4 h-4 text-[#d4af37]" />
                  <span>Escolher Foto do Computador / Celular</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetHero}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#2d3345] bg-[#161822] px-3.5 py-3 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
                  title="Restaurar foto padrão"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Restaurar Padrão</span>
                </button>
              </div>

              {/* Quick Presets */}
              <div className="pt-2">
                <span className="block text-[11px] font-semibold text-neutral-400 mb-2">
                  Ou escolha uma foto de alta definição da nossa galeria:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: 'Clássica & Madeira',
                      url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80'
                    },
                    {
                      label: 'Estúdio & Fade',
                      url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80'
                    },
                    {
                      label: 'Navalha & Toalha',
                      url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80'
                    }
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        setHeroImageUrl(preset.url);
                        setHeroPreview(preset.url);
                        onNotify(`Foto definida para: ${preset.label}`);
                      }}
                      className="group relative rounded-lg border border-[#2c3243] overflow-hidden aspect-[4/3] hover:border-[#d4af37] transition cursor-pointer"
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-1 text-center">
                        <span className="text-[10px] font-bold text-white group-hover:text-[#f5d77f]">
                          {preset.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: General Information (Shop Name, Address, Phone) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="rounded-2xl border border-[#2a2f3f] bg-[#12141c] p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#232733] pb-4">
              <div className="w-9 h-9 rounded-lg bg-[#181a25] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Dados & Informações da Barbearia
                </h3>
                <span className="text-[11px] text-neutral-400">
                  Nome, subtítulo, endereço e contatos exibidos no site
                </span>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Nome da Barbearia *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Líder Barbers"
                  required
                  className="w-full rounded-xl border border-[#2b3040] bg-[#161822] px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Slogan / Subtítulo da Marca
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ex: Barbearia Clássica & Moderna"
                  className="w-full rounded-xl border border-[#2b3040] bg-[#161822] px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>WhatsApp / Telefone</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full rounded-xl border border-[#2b3040] bg-[#161822] px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Endereço / Cidade</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Paulista, 1000 — São Paulo, SP"
                    className="w-full rounded-xl border border-[#2b3040] bg-[#161822] px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#232733] flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa8222] px-7 py-3 text-xs font-black uppercase tracking-wider text-[#0d0e11] shadow-xl shadow-[#d4af37]/20 hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0d0e11]" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Todas as Configurações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick tips */}
          <div className="rounded-2xl border border-[#262b3a] bg-[#141620] p-5 text-xs text-neutral-300 space-y-2">
            <h4 className="font-bold text-[#f5d77f] uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Dicas de Personalização</span>
            </h4>
            <ul className="space-y-1.5 text-neutral-400 pl-4 list-disc">
              <li>
                <strong className="text-white">Formato ideal para a logo:</strong> PNG transparente ou com fundo escuro, com proporção quadrada (ex: 512x512px).
              </li>
              <li>
                <strong className="text-white">Foto principal:</strong> Prefira fotos horizontais de alta qualidade mostrando a bancada, as cadeiras ou o acabamento na navalha.
              </li>
              <li>
                As mudanças são aplicadas <strong className="text-white">imediatamente</strong> em todo o sistema (cabeçalho, rodapé, telas de agendamento e aplicativo instalado).
              </li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};
