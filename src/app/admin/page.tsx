'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  User,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  MessageCircle,
  Settings,
  Sparkles,
  Link as LinkIcon,
  Eye,
  EyeOff,
  LogOut,
  Save,
  ArrowUp,
  ArrowDown,
  FileJson,
  Upload,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Phone,
  CloudUpload,
  AlertTriangle,
  X
} from 'lucide-react';
import { AppData, BookingRequest, LinkItem, ProfileConfig, TimeSlot } from '@/types';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { initialData } from '@/data/initialData';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string; role: string } | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'links' | 'schedule' | 'settings'>('profile');

  // Form State - New Link
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkSubtitle, setNewLinkSubtitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkBadge, setNewLinkBadge] = useState('');
  const [newLinkIcon, setNewLinkIcon] = useState('MessageCircle');

  // Modal State - Edit Link
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  // Form State - New Slot
  const [batchDate, setBatchDate] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['09:00', '10:30', '14:00', '15:30']);

  const commonTimesList = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  useEffect(() => {
    setBatchDate(new Date().toISOString().split('T')[0]);
    const savedUser = sessionStorage.getItem('thaysa_admin_user') || localStorage.getItem('thaysa_admin_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {}
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: loginUsername.trim(), 
          password: loginPassword.trim() 
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentUser(json.user);
        sessionStorage.setItem('thaysa_admin_user', JSON.stringify(json.user));
        localStorage.setItem('thaysa_admin_user', JSON.stringify(json.user));
      } else {
        setLoginError(json.message || 'Credenciais inválidas.');
      }
    } catch (err) {
      setLoginError('Erro de conexão ao autenticar.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('thaysa_admin_user');
    localStorage.removeItem('thaysa_admin_user');
  };

  const handleSaveData = async (updatedData: AppData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      alert('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (field: keyof ProfileConfig, value: string) => {
    if (!data) return;
    const newData = {
      ...data,
      profile: {
        ...data.profile,
        [field]: value,
      },
    };
    setData(newData);
  };

  // Links Handlers
  const handleAddLink = () => {
    if (!data || !newLinkTitle || !newLinkUrl) return;

    const normalizedUrl = ensureAbsoluteUrl(newLinkUrl);

    const newLink: LinkItem = {
      id: `link-${Date.now()}`,
      title: newLinkTitle,
      subtitle: newLinkSubtitle,
      url: normalizedUrl,
      iconName: newLinkIcon,
      badge: newLinkBadge || undefined,
      isActive: true,
      order: data.links.length + 1,
      clicks: 0,
    };
    const updatedLinks = [...data.links, newLink];
    const newData = { ...data, links: updatedLinks };
    setData(newData);
    handleSaveData(newData);

    // Reset Form
    setNewLinkTitle('');
    setNewLinkSubtitle('');
    setNewLinkUrl('');
    setNewLinkBadge('');
  };

  const handleSaveEditedLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !editingLink) return;

    const normalizedUrl = ensureAbsoluteUrl(editingLink.url);

    const updatedLinks = data.links.map((l) =>
      l.id === editingLink.id
        ? {
            ...editingLink,
            url: normalizedUrl,
          }
        : l
    );

    const newData = { ...data, links: updatedLinks };
    setData(newData);
    handleSaveData(newData);
    setEditingLink(null);
  };

  const handleToggleLinkActive = (id: string) => {
    if (!data) return;
    const updatedLinks = data.links.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l));
    const newData = { ...data, links: updatedLinks };
    setData(newData);
    handleSaveData(newData);
  };

  const handleDeleteLink = (id: string) => {
    if (!data || !confirm('Tem certeza que deseja apagar este link?')) return;
    const updatedLinks = data.links.filter((l) => l.id !== id);
    const newData = { ...data, links: updatedLinks };
    setData(newData);
    handleSaveData(newData);
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    if (!data) return;
    const linksCopy = [...data.links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= linksCopy.length) return;

    const temp = linksCopy[index];
    linksCopy[index] = linksCopy[targetIndex];
    linksCopy[targetIndex] = temp;

    linksCopy.forEach((l, i) => (l.order = i + 1));
    const newData = { ...data, links: linksCopy };
    setData(newData);
    handleSaveData(newData);
  };

  // Schedule Handlers
  const toggleTimeSelection = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter((t) => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const handleAddBatchSlots = async () => {
    if (!data || !batchDate || selectedTimes.length === 0) return;
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-slots',
          date: batchDate,
          times: selectedTimes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      }
    } catch (err) {
      alert('Erro ao cadastrar horários.');
    }
  };

  const handleUpdateSlotStatus = async (slotId: string, status: 'available' | 'pending' | 'booked') => {
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          slotId,
          status,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      }
    } catch (err) {
      alert('Erro ao atualizar status do horário.');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Deseja remover este horário da lista?')) return;
    try {
      const res = await fetch(`/api/slots?slotId=${slotId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchData();
      }
    } catch (err) {
      alert('Erro ao deletar horário.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      const booking = data?.bookings.find((b) => b.id === bookingId);
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-booking-status',
          bookingId,
          status,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();

        if (status === 'confirmed' && booking) {
          const [y, m, d] = booking.date.split('-');
          const dateFormatted = `${d}/${m}/${y}`;
          const cleanPhone = booking.patientPhone.replace(/\D/g, '');
          const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

          const text = encodeURIComponent(
            `*AGENDAMENTO CONFIRMADO - DRA. THAYSA MESCHIATTI*\n\n` +
            `• *Paciente:* ${booking.patientName}\n` +
            `• *Data:* ${dateFormatted}\n` +
            `• *Horário:* ${booking.time}\n` +
            `• *Procedimento:* ${booking.procedure}\n\n` +
            `Olá ${booking.patientName}! Seu agendamento foi CONFIRMADO com sucesso! Aguardo você no consultório no dia ${dateFormatted} às ${booking.time}.\n\nQualquer dúvida ou imprevisto, favor avisar por aqui.`
          );

          const waUrl = `https://wa.me/${phoneWithCountry}?text=${text}`;
          window.open(waUrl, '_blank');
        }
      }
    } catch (err) {
      alert('Erro ao atualizar solicitação.');
    }
  };

  const handleExportBackup = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thaysa-meschiatti-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-amber-500/30 space-y-6 shadow-2xl z-10 text-center">
          
          <div className="w-16 h-16 rounded-full bg-black border-2 border-amber-400/60 mx-auto flex items-center justify-center p-1 gold-glow">
            <img src="/logo-1.jpeg" alt="Logo" className="w-full h-full object-cover rounded-full" />
          </div>

          <div>
            <h1 className="serif-title text-2xl font-bold gold-gradient-text">
              Painel Administrativo
            </h1>
            <p className="text-xs text-neutral-400 pt-1">
              Dra. Thaysa Meschiatti • Gestão de Links & Agenda
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left pt-2">
            
            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Usuário</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="thaysa ou admin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Senha de Acesso</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-amber-300 p-1"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl gold-gradient-bg text-black font-extrabold text-sm hover:brightness-110 active:scale-98 transition shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              <span>Entrar no Painel</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-xs text-neutral-500">
            <Link href="/" className="hover:text-amber-400 transition inline-flex items-center gap-1">
              ← Voltar para a Página Pública
            </Link>
          </div>

        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">
        <p className="text-amber-300 animate-pulse text-sm">Carregando painel...</p>
      </div>
    );
  }

  const { profile, links, slots, bookings } = data;
  const pendingBookings = bookings.filter((b) => b.status === 'pending');

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 flex flex-col">
      
      {/* Top Navbar */}
      <header className="w-full glass-panel border-b border-amber-500/20 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full border border-amber-400/50 overflow-hidden bg-black flex items-center justify-center">
            <img src={profile.avatarUrl || '/logo-1.jpeg'} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="serif-title text-lg font-bold gold-gradient-text">
              {profile.name}
            </h1>
            <p className="text-neutral-400 text-xs flex items-center gap-2">
              <span>Painel Admin</span>
              <span className="text-amber-500">•</span>
              <span className="text-amber-300 font-mono text-[11px]">{currentUser.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Ver Site Público</span>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="md:col-span-3 space-y-2">
          <nav className="glass-panel p-2 rounded-2xl border border-amber-500/20 space-y-1">
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'profile'
                  ? 'gold-gradient-bg text-black font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span>Perfil & Identidade</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'links'
                  ? 'gold-gradient-bg text-black font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LinkIcon className="w-4 h-4" />
                <span>Gerenciar Links</span>
              </div>
              <span className="bg-neutral-800 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">
                {links.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition relative ${
                activeTab === 'schedule'
                  ? 'gold-gradient-bg text-black font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span>Agenda & Horários</span>
              </div>
              {pendingBookings.length > 0 && (
                <span className="bg-amber-500 text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                  {pendingBookings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'settings'
                  ? 'gold-gradient-bg text-black font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Configurações & Nuvem</span>
              </div>
            </button>

          </nav>
        </aside>

        {/* Tab Content Area */}
        <main className="md:col-span-9 space-y-6">
          
          {/* TAB 1: PROFILE & IDENTITY */}
          {activeTab === 'profile' && (
            <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                <div>
                  <h2 className="serif-title text-xl font-bold text-white">
                    Editar Perfil Profissional
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Altere os dados exibidos no cabeçalho e contatos principais.
                  </p>
                </div>
                <button
                  onClick={() => handleSaveData(data)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl gold-gradient-bg text-black font-bold text-xs flex items-center gap-1.5 hover:brightness-110 transition shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Perfil'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Nome Profissional</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Título / Especialidade</label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => handleProfileChange('title', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Registro Profissional (CRO)</label>
                  <input
                    type="text"
                    value={profile.cro}
                    onChange={(e) => handleProfileChange('cro', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">WhatsApp (apenas números com DDD)</label>
                  <input
                    type="text"
                    value={profile.whatsappNumber}
                    onChange={(e) => handleProfileChange('whatsappNumber', e.target.value)}
                    placeholder="Ex: 5527996121643"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Instagram URL</label>
                  <input
                    type="text"
                    value={profile.instagramUrl}
                    onChange={(e) => handleProfileChange('instagramUrl', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">E-mail Profissional</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Bio / Descrição Curta</label>
                <textarea
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Selecione a Imagem da Logo / Perfil
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div
                    onClick={() => handleProfileChange('avatarUrl', '/logo-1.jpeg')}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col items-center space-y-2 ${
                      profile.avatarUrl === '/logo-1.jpeg'
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <img src="/logo-1.jpeg" alt="Logo Monograma" className="w-16 h-16 rounded-full object-cover border border-amber-400/40" />
                    <span className="text-xs font-medium text-white">Monograma TM (Logo 1)</span>
                  </div>

                  <div
                    onClick={() => handleProfileChange('avatarUrl', '/logo-2.jpeg')}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col items-center space-y-2 ${
                      profile.avatarUrl === '/logo-2.jpeg'
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <img src="/logo-2.jpeg" alt="Logo Completa" className="w-16 h-16 rounded-full object-cover border border-amber-400/40" />
                    <span className="text-xs font-medium text-white">Logo Completa com Nome</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MANAGE LINKS */}
          {activeTab === 'links' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Form Add New Link */}
              <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 space-y-4">
                <h2 className="serif-title text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" /> Adicionar Novo Botão de Link
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Título do Botão *</label>
                    <input
                      type="text"
                      placeholder="Ex: Artigo Científico"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">URL / Link Completo *</label>
                    <input
                      type="text"
                      placeholder="https://exemplo.com..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[11px] text-neutral-500">Links são convertidos automaticamente para a URL completa.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Subtítulo Explicativo (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Leia a publicação na íntegra"
                      value={newLinkSubtitle}
                      onChange={(e) => setNewLinkSubtitle(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Selo / Tag em Destaque</label>
                    <input
                      type="text"
                      placeholder="Ex: NOVO, DESTAQUE, ARTIGO"
                      value={newLinkBadge}
                      onChange={(e) => setNewLinkBadge(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Ícone</label>
                    <select
                      value={newLinkIcon}
                      onChange={(e) => setNewLinkIcon(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="FileText">Documento / Artigo (FileText)</option>
                      <option value="MessageCircle">WhatsApp / Mensagem (MessageCircle)</option>
                      <option value="Instagram">Instagram (Social)</option>
                      <option value="Calendar">Agenda / Calendário (Calendar)</option>
                      <option value="ExternalLink">Link Externo Geral (ExternalLink)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAddLink}
                  disabled={!newLinkTitle || !newLinkUrl}
                  className="px-5 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Adicionar à Lista
                </button>
              </div>

              {/* Links List Manager */}
              <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 space-y-4">
                <h2 className="serif-title text-xl font-bold text-white">
                  Links Cadastrados
                </h2>

                <div className="space-y-3">
                  {links.map((link, index) => (
                    <div
                      key={link.id}
                      className="p-4 rounded-2xl bg-neutral-900/90 border border-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleMoveLink(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-neutral-400 hover:text-amber-400 disabled:opacity-20"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveLink(index, 'down')}
                            disabled={index === links.length - 1}
                            className="p-1 text-neutral-400 hover:text-amber-400 disabled:opacity-20"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm truncate">{link.title}</span>
                            {link.badge && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                                {link.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 truncate">{link.url}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => setEditingLink({ ...link })}
                          className="px-3 py-1.5 rounded-xl border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>

                        <button
                          onClick={() => handleToggleLinkActive(link.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            link.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {link.isActive ? 'Visível' : 'Oculto'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 text-neutral-400 hover:text-red-400 transition"
                          title="Apagar Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SCHEDULE & APPOINTMENT MANAGER */}
          {activeTab === 'schedule' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* PENDING PATIENT REQUESTS */}
              {pendingBookings.length > 0 && (
                <div className="p-6 glass-panel rounded-3xl border border-amber-400/50 bg-amber-950/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                      <h2 className="serif-title text-xl font-bold text-amber-200">
                        Solicitações de Pré-Agendamento Pendentes ({pendingBookings.length})
                      </h2>
                    </div>
                    <span className="text-xs bg-amber-500 text-black font-extrabold px-2.5 py-0.5 rounded-full">
                      Ação Necessária
                    </span>
                  </div>

                  <div className="space-y-3">
                    {pendingBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                          <div>
                            <span className="text-xs text-amber-300/80 font-mono">
                              Solicitado para: {b.date} às {b.time}
                            </span>
                            <h3 className="text-base font-bold text-white">{b.patientName}</h3>
                          </div>
                          <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 font-semibold self-start sm:self-auto">
                            {b.procedure}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300">
                          <div>
                            <span className="text-neutral-500">Telefone:</span> {b.patientPhone}
                          </div>
                          {b.notes && (
                            <div>
                              <span className="text-neutral-500">Obs:</span> {b.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Confirmar Horário
                          </button>
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                            className="px-3.5 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <XCircle className="w-4 h-4" /> Recusar / Liberar
                          </button>
                          <a
                            href={`https://wa.me/${b.patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Olá ${b.patientName}! Aqui é a Dra. Thaysa Meschiatti. Recebi sua solicitação de agendamento para ${b.date} às ${b.time}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition"
                          >
                            <MessageCircle className="w-4 h-4" /> Chamar no WhatsApp
                          </a>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BATCH CREATE SLOTS */}
              <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 space-y-4">
                <h2 className="serif-title text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" /> Cadastrar Novos Horários Disponíveis
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Escolha a Data</label>
                    <input
                      type="date"
                      value={batchDate}
                      onChange={(e) => setBatchDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Horários Selecionados</label>
                    <p className="text-xs text-amber-300 font-mono pt-2">
                      {selectedTimes.length} horário(s) selecionado(s)
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-neutral-400">Clique para Marcar/Desmarcar os Horários:</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {commonTimesList.map((time) => {
                      const isSelected = selectedTimes.includes(time);
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleTimeSelection(time)}
                          className={`py-2 rounded-xl font-mono text-xs font-bold transition border ${
                            isSelected
                              ? 'bg-amber-400 text-black border-amber-300'
                              : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-amber-500/30'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleAddBatchSlots}
                  className="px-5 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs flex items-center gap-2 hover:brightness-110 transition shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Adicionar Horários na Agenda
                </button>
              </div>

              {/* EXISTING SLOTS LIST */}
              <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 space-y-4">
                <h2 className="serif-title text-xl font-bold text-white">
                  Agenda Cadastrada ({slots.length} horários)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {slots.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl bg-neutral-900/90 border border-amber-500/10 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-400">{s.date}</span>
                        <span className="font-mono text-sm font-bold text-white">{s.time}</span>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-neutral-800">
                        <button
                          onClick={() =>
                            handleUpdateSlotStatus(
                              s.id,
                              s.status === 'available' ? 'booked' : 'available'
                            )
                          }
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                            s.status === 'available'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : s.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}
                        >
                          {s.status === 'available' && 'Livre (Clique p/ Fechar)'}
                          {s.status === 'pending' && 'Pendente'}
                          {s.status === 'booked' && 'Ocupado (Clique p/ Abrir)'}
                        </button>

                        <button
                          onClick={() => handleDeleteSlot(s.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 transition"
                          title="Remover Horário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: SETTINGS & BACKUP */}
          {activeTab === 'settings' && (
            <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 space-y-6 animate-fadeIn">
              
              <div className="border-b border-amber-500/20 pb-4">
                <h2 className="serif-title text-xl font-bold text-white">
                  Configurações do Sistema & Hospedagem Vercel
                </h2>
                <p className="text-xs text-neutral-400">
                  Gerenciamento de contas de acesso e backups do banco de dados.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" /> Contas com Acesso ao Painel
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-neutral-900 border border-amber-500/20 space-y-1">
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                      DENTISTA
                    </span>
                    <p className="text-sm font-bold text-white">Dra. Thaysa Meschiatti</p>
                    <p className="text-xs font-mono text-neutral-400">Usuário: thaysa</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-900 border border-amber-500/20 space-y-1">
                    <span className="text-[10px] bg-neutral-800 text-neutral-300 font-bold px-2 py-0.5 rounded-full">
                      ADMINISTRADOR MASTER
                    </span>
                    <p className="text-sm font-bold text-white">Suporte Técnico</p>
                    <p className="text-xs font-mono text-neutral-400">Usuário: admin</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/20 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-amber-400" /> Backup dos Dados
                </h3>
                <p className="text-xs text-neutral-400">
                  Faça o download do arquivo de backup contendo todas as suas configurações, links cadastrados e horários da agenda.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-2 hover:bg-amber-500/10 transition"
                >
                  <CloudUpload className="w-4 h-4" /> Baixar Backup em JSON
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <CloudUpload className="w-4 h-4 text-amber-400" /> Como publicar 100% Grátis na Vercel
                </h3>
                <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Envie esta pasta para seu repositório no GitHub (ou execute <code className="bg-black px-1 py-0.5 rounded text-amber-300">git push</code>).</li>
                  <li>Acesse <a href="https://vercel.com" target="_blank" className="text-amber-400 underline font-bold">vercel.com</a> e crie uma conta gratuita.</li>
                  <li>Clique em <b>Import Project</b>, selecione o repositório no GitHub e clique em <b>Deploy</b>.</li>
                  <li>Sua aplicação estará online imediatamente com certificado SSL automático!</li>
                </ol>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* EDIT LINK MODAL */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-panel rounded-3xl border border-amber-500/40 p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setEditingLink(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="serif-title text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" /> Editar Botão de Link
              </h2>
              <p className="text-xs text-neutral-400">
                Altere o título, URL de destino ou visual deste botão.
              </p>
            </div>

            <form onSubmit={handleSaveEditedLink} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Título do Botão *</label>
                <input
                  type="text"
                  required
                  value={editingLink.title}
                  onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">URL / Link Completo *</label>
                <input
                  type="text"
                  required
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Subtítulo Explicativo (Opcional)</label>
                <input
                  type="text"
                  value={editingLink.subtitle || ''}
                  onChange={(e) => setEditingLink({ ...editingLink, subtitle: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Selo / Tag em Destaque</label>
                  <input
                    type="text"
                    value={editingLink.badge || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, badge: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Ícone</label>
                  <select
                    value={editingLink.iconName}
                    onChange={(e) => setEditingLink({ ...editingLink, iconName: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="FileText">Documento / Artigo (FileText)</option>
                    <option value="MessageCircle">WhatsApp / Mensagem (MessageCircle)</option>
                    <option value="Instagram">Instagram (Social)</option>
                    <option value="Calendar">Agenda / Calendário (Calendar)</option>
                    <option value="ExternalLink">Link Externo Geral (ExternalLink)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs flex items-center gap-1.5 hover:brightness-110 shadow-lg"
                >
                  <Save className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
