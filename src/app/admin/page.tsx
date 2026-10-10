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
  Camera,
  UserPlus,
  Check,
  Award,
  X
} from 'lucide-react';
import { AppData, BookingRequest, LinkItem, ProfileConfig, TimeSlot } from '@/types';
import { ensureAbsoluteUrl, formatPhoneMask, isValidPhone } from '@/lib/utils';
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

  // Modal State - Agendamento Confirmado / Redirecionamento WhatsApp
  const [confirmedNotification, setConfirmedNotification] = useState<{
    patientName: string;
    patientPhone: string;
    date: string;
    time: string;
    procedure: string;
    waUrl: string;
  } | null>(null);

  // Confirmation Modal State - Deletion
  const [slotToDelete, setSlotToDelete] = useState<TimeSlot | null>(null);
  const [dayToDelete, setDayToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Manual Booking Modal State
  const [manualBookingModalOpen, setManualBookingModalOpen] = useState(false);
  const [manualPatientName, setManualPatientName] = useState('');
  const [manualPatientPhone, setManualPatientPhone] = useState('');
  const [manualPhoneError, setManualPhoneError] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('09:00');
  const [manualProcedure, setManualProcedure] = useState('Avaliação Geral & Diagnóstico');
  const [manualNotes, setManualNotes] = useState('');
  const [manualSlotId, setManualSlotId] = useState<string | undefined>(undefined);
  const [manualSendWhatsApp, setManualSendWhatsApp] = useState(true);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Photo Upload State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [customPhotoUrlInput, setCustomPhotoUrlInput] = useState('');

  // Logo Upload State
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState('');

  // Form State - New Slot
  const [batchDate, setBatchDate] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['09:00', '10:30', '14:00', '15:30']);
  const [filterDate, setFilterDate] = useState<string>('all');

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

  const promptDeleteSlot = (slot: TimeSlot) => {
    setSlotToDelete(slot);
  };

  const executeDeleteSlot = async () => {
    if (!slotToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/slots?slotId=${slotToDelete.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchData();
        setSlotToDelete(null);
      }
    } catch (err) {
      alert('Erro ao deletar horário.');
    } finally {
      setIsDeleting(false);
    }
  };

  const promptDeleteDay = (dateStr: string) => {
    setDayToDelete(dateStr);
  };

  const executeDeleteDay = async () => {
    if (!dayToDelete) return;
    setIsDeleting(true);
    const daySlots = (data?.slots || []).filter((s) => s.date === dayToDelete);
    try {
      for (const slot of daySlots) {
        await fetch(`/api/slots?slotId=${slot.id}`, { method: 'DELETE' });
      }
      fetchData();
      setDayToDelete(null);
    } catch (err) {
      alert('Erro ao excluir horários do dia.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenManualBooking = (presetSlot?: TimeSlot, defaultDate?: string) => {
    if (presetSlot) {
      setManualSlotId(presetSlot.id);
      setManualDate(presetSlot.date);
      setManualTime(presetSlot.time);
    } else {
      setManualSlotId(undefined);
      setManualDate(defaultDate || batchDate || new Date().toISOString().split('T')[0]);
      setManualTime('09:00');
    }
    setManualPatientName('');
    setManualPatientPhone('');
    setManualPhoneError('');
    setManualProcedure('Avaliação Geral & Diagnóstico');
    setManualNotes('');
    setManualSendWhatsApp(true);
    setManualBookingModalOpen(true);
  };

  const handleManualPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatPhoneMask(e.target.value);
    setManualPatientPhone(masked);
    if (manualPhoneError && isValidPhone(masked)) {
      setManualPhoneError('');
    }
  };

  const handleSubmitManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPatientName.trim() || !manualDate || !manualTime) return;

    if (!isValidPhone(manualPatientPhone)) {
      setManualPhoneError('Informe um WhatsApp válido com DDD ex: (27) 99612-1643');
      return;
    }

    setManualSubmitting(true);
    setManualPhoneError('');

    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual-booking',
          slotId: manualSlotId,
          date: manualDate,
          time: manualTime,
          patientName: manualPatientName.trim(),
          patientPhone: manualPatientPhone,
          procedure: manualProcedure,
          notes: manualNotes.trim() || undefined,
          status: 'confirmed',
        }),
      });

      const json = await res.json();
      if (json.success) {
        fetchData();
        setManualBookingModalOpen(false);

        if (manualSendWhatsApp) {
          const waUrl = generateWhatsAppConfirmationUrl({
            patientName: manualPatientName.trim(),
            patientPhone: manualPatientPhone,
            date: manualDate,
            time: manualTime,
            procedure: manualProcedure,
          });

          setConfirmedNotification({
            patientName: manualPatientName.trim(),
            patientPhone: manualPatientPhone,
            date: manualDate,
            time: manualTime,
            procedure: manualProcedure,
            waUrl,
          });

          try {
            window.open(waUrl, '_blank');
          } catch (e) {
            window.location.href = waUrl;
          }
        }
      } else {
        alert(json.message || 'Erro ao registrar agendamento.');
      }
    } catch (err) {
      alert('Erro ao registrar agendamento manual.');
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          handleProfileChange('avatarUrl', dataUrl);
        }
        setUploadingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          handleProfileChange('logoUrl', dataUrl);
        }
        setUploadingLogo(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffDays = Math.round((dateObj.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
      const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

      if (diffDays === 0) return `Hoje (${d}/${m}) • ${dayNameCapitalized}`;
      if (diffDays === 1) return `Amanhã (${d}/${m}) • ${dayNameCapitalized}`;
      return `${dayNameCapitalized}, ${d} de ${monthName}`;
    } catch (e) {
      return dateStr;
    }
  };

  const generateWhatsAppConfirmationUrl = (booking: {
    patientName: string;
    patientPhone: string;
    date: string;
    time: string;
    procedure: string;
  }) => {
    const [y, m, d] = booking.date.split('-');
    const dateFormatted = y && m && d ? `${d}/${m}/${y}` : booking.date;
    const cleanPhone = booking.patientPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const text = encodeURIComponent(
      `*AGENDAMENTO CONFIRMADO - DRA. THAYSA MESCHIATTI* 🦷✨\n\n` +
      `Olá, *${booking.patientName}*! Seu agendamento foi *confirmado com sucesso*!\n\n` +
      `📅 *Data:* ${dateFormatted}\n` +
      `⏰ *Horário:* ${booking.time}\n` +
      `🦷 *Procedimento:* ${booking.procedure}\n` +
      `📍 *Local:* Consultório Dra. Thaysa Meschiatti - CRO ES 11914\n\n` +
      `Estamos te aguardando! Caso tenha alguma dúvida ou precise remarcar, favor avisar por aqui.`
    );

    return `https://wa.me/${phoneWithCountry}?text=${text}`;
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    const booking =
      data?.bookings.find((b) => b.id === bookingId) ||
      data?.slots.find((s) => s.booking?.id === bookingId)?.booking;

    let waUrl = '';
    if (status === 'confirmed' && booking) {
      waUrl = generateWhatsAppConfirmationUrl(booking);
    }

    // Janela síncrona aberta no evento de clique para prevenir bloqueio de pop-up no navegador
    let syncPopup: Window | null = null;
    if (status === 'confirmed' && waUrl && typeof window !== 'undefined') {
      try {
        syncPopup = window.open('about:blank', '_blank');
      } catch (e) {
        syncPopup = null;
      }
    }

    try {
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

        if (status === 'confirmed' && booking && waUrl) {
          // 1. Se abriu em aba do navegador desktop, atualiza o endereço
          if (syncPopup && !syncPopup.closed) {
            syncPopup.location.href = waUrl;
          } else {
            // 2. Se o navegador bloqueou o pop-up ou em dispositivos móveis, redireciona diretamente
            window.location.href = waUrl;
          }

          // 3. Exibe o modal informativo na tela com o link direto clicável
          setConfirmedNotification({
            patientName: booking.patientName,
            patientPhone: booking.patientPhone,
            date: booking.date,
            time: booking.time,
            procedure: booking.procedure,
            waUrl,
          });
        }
      } else {
        if (syncPopup && !syncPopup.closed) syncPopup.close();
        alert(json.message || 'Erro ao atualizar solicitação.');
      }
    } catch (err) {
      if (syncPopup && !syncPopup.closed) syncPopup.close();
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
      <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex items-center justify-center p-4 relative overflow-hidden selection:bg-amber-200 selection:text-amber-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-200/30 rounded-full blur-[110px] pointer-events-none"></div>

        <div className="w-full max-w-sm bg-white p-8 rounded-3xl border border-amber-200/90 space-y-6 shadow-2xl z-10 text-center">
          
          <div className="w-16 h-16 rounded-full bg-white border-2 border-amber-300 mx-auto flex items-center justify-center p-1 shadow-md">
            <img src="/logo-1.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <div>
            <h1 className="serif-title text-2xl font-bold gold-gradient-text">
              Painel Administrativo
            </h1>
            <p className="text-xs text-stone-600 pt-1">
              Dra. Thaysa Meschiatti • Gestão de Links & Agenda
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left pt-2">
            
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Usuário</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Nome de usuário"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Senha de Acesso</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-10 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-amber-700 p-1 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl gold-gradient-bg text-stone-950 font-extrabold text-sm hover:brightness-105 active:scale-98 transition shadow-lg flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <span>Entrar no Painel</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-xs text-stone-500">
            <Link href="/" className="hover:text-amber-800 transition inline-flex items-center gap-1 font-medium">
              ← Voltar para a Página Pública
            </Link>
          </div>

        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex items-center justify-center">
        <p className="text-amber-800 animate-pulse text-sm font-semibold">Carregando painel...</p>
      </div>
    );
  }

  const { profile, links, slots, bookings } = data;
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col selection:bg-amber-200 selection:text-amber-950">
      
      {/* Top Navbar */}
      <header className="w-full bg-white/95 border-b border-amber-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full border border-amber-300 overflow-hidden bg-white flex items-center justify-center shadow-xs">
            <img src={profile.avatarUrl || '/logo-1.png'} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="serif-title text-lg font-bold gold-gradient-text">
              {profile.name}
            </h1>
            <p className="text-stone-500 text-xs flex items-center gap-2">
              <span>Painel Admin</span>
              <span className="text-amber-500">•</span>
              <span className="text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold">{currentUser.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl border border-amber-300 text-amber-900 bg-amber-50/80 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Ver Site Público</span>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-stone-100 transition cursor-pointer"
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
          <nav className="bg-white p-2.5 rounded-2xl border border-amber-200/80 space-y-1 shadow-xs">
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'gold-gradient-bg text-stone-950 font-bold shadow-md'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
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
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeTab === 'links'
                  ? 'gold-gradient-bg text-stone-950 font-bold shadow-md'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LinkIcon className="w-4 h-4" />
                <span>Gerenciar Links</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'links' ? 'bg-stone-950 text-amber-300' : 'bg-stone-100 text-stone-700 border border-stone-200'
              }`}>
                {links.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition relative cursor-pointer ${
                activeTab === 'schedule'
                  ? 'gold-gradient-bg text-stone-950 font-bold shadow-md'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span>Agenda & Horários</span>
              </div>
              {pendingBookings.length > 0 && (
                <span className="bg-amber-500 text-stone-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                  {pendingBookings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'gold-gradient-bg text-stone-950 font-bold shadow-md'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </div>
            </button>

          </nav>
        </aside>

        {/* Tab Content Area */}
        <main className="md:col-span-9 space-y-6">
          
          {/* TAB 1: PROFILE & IDENTITY */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-3xl border border-amber-200/80 space-y-6 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between border-b border-amber-200/70 pb-4">
                <div>
                  <h2 className="serif-title text-xl font-bold text-stone-900">
                    Editar Perfil Profissional
                  </h2>
                  <p className="text-xs text-stone-500">
                    Altere os dados exibidos no cabeçalho e contatos principais.
                  </p>
                </div>
                <button
                  onClick={() => handleSaveData(data)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl gold-gradient-bg text-stone-950 font-bold text-xs flex items-center gap-1.5 hover:brightness-105 active:scale-98 transition shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Perfil'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Nome Profissional</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Título / Especialidade</label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => handleProfileChange('title', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Registro Profissional (CRO)</label>
                  <input
                    type="text"
                    value={profile.cro}
                    onChange={(e) => handleProfileChange('cro', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 font-mono placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">WhatsApp (apenas números com DDD)</label>
                  <input
                    type="text"
                    value={profile.whatsappNumber}
                    onChange={(e) => handleProfileChange('whatsappNumber', e.target.value)}
                    placeholder="Ex: 5527996121643"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 font-mono placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Instagram URL</label>
                  <input
                    type="text"
                    value={profile.instagramUrl}
                    onChange={(e) => handleProfileChange('instagramUrl', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">E-mail Profissional</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>

              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Bio / Descrição Curta</label>
                <textarea
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition resize-none"
                />
              </div>

              {/* 1. FOTO DE PERFIL DA DRA. THAYSA */}
              <div className="space-y-4 pt-3 border-t border-stone-200">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-600" /> Foto de Perfil da Dra. Thaysa
                  </h3>
                  <p className="text-xs text-stone-500">
                    Foto circular exibida na página principal (raiz do projeto).
                  </p>
                </div>

                {/* Prévia da Foto Atual */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-2xl bg-stone-50/80 border border-amber-200/80 shadow-xs">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-amber-300 bg-white flex items-center justify-center p-0.5 shrink-0 mx-auto sm:mx-0 shadow-md">
                    <img
                      src={profile.avatarUrl || '/logo-1.png'}
                      alt={profile.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>

                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <p className="text-xs font-semibold text-stone-900">Foto Atual</p>
                      <p className="text-[11px] text-stone-500 font-mono truncate max-w-sm">
                        {profile.avatarUrl.startsWith('data:') ? 'Foto Personalizada (Arquivo Enviado)' : profile.avatarUrl}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label className="px-4 py-2 rounded-xl gold-gradient-bg text-stone-950 font-extrabold text-xs flex items-center gap-2 cursor-pointer hover:brightness-105 active:scale-98 transition shadow-md">
                        <Camera className="w-4 h-4" />
                        <span>{uploadingPhoto ? 'Carregando foto...' : 'Enviar Foto do Celular / Computador'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingPhoto}
                          className="hidden"
                        />
                      </label>

                      {profile.avatarUrl !== '/logo-1.png' && (
                        <button
                          type="button"
                          onClick={() => handleProfileChange('avatarUrl', '/logo-1.png')}
                          className="px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 text-xs font-semibold bg-white hover:bg-stone-50 transition shadow-xs cursor-pointer"
                        >
                          Restaurar Padrão
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* URL de Foto Externa */}
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <div className="text-left">
                    <label className="text-[11px] text-stone-700 font-semibold block">URL de Foto Externa:</label>
                    <span className="text-[10px] text-stone-400">Ou cole um link direto de foto hospedada na internet</span>
                  </div>
                  <div className="flex gap-1.5 flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="https://exemplo.com/foto.jpg"
                      value={customPhotoUrlInput}
                      onChange={(e) => setCustomPhotoUrlInput(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPhotoUrlInput.trim()) {
                          handleProfileChange('avatarUrl', customPhotoUrlInput.trim());
                          setCustomPhotoUrlInput('');
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold hover:brightness-105 shrink-0 cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. LOGOTIPO OFICIAL DA MARCA / CLÍNICA */}
              <div className="space-y-4 pt-3 border-t border-stone-200">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" /> Logotipo Oficial da Marca / Clínica
                  </h3>
                  <p className="text-xs text-stone-500">
                    O logotipo é exibido no rodapé da página principal (raiz do projeto), com destaque elegante.
                  </p>
                </div>

                {/* Prévia do Logotipo Atual */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-2xl bg-stone-50/80 border border-amber-200/80 shadow-xs">
                  <div className="bg-white px-4 py-2 rounded-xl border border-amber-300 flex items-center justify-center shrink-0 mx-auto sm:mx-0 shadow-md max-w-[200px]">
                    <img
                      src={profile.logoUrl || '/logo-2.png'}
                      alt="Logo da Clínica"
                      className="h-12 w-auto object-contain"
                    />
                  </div>

                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <p className="text-xs font-semibold text-stone-900">Logotipo Selecionado</p>
                      <p className="text-[11px] text-stone-500 font-mono truncate max-w-sm">
                        {profile.logoUrl?.startsWith('data:') ? 'Logotipo Personalizado (Arquivo Enviado)' : (profile.logoUrl || '/logo-2.png')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label className="px-4 py-2 rounded-xl gold-gradient-bg text-stone-950 font-extrabold text-xs flex items-center gap-2 cursor-pointer hover:brightness-105 active:scale-98 transition shadow-md">
                        <Camera className="w-4 h-4" />
                        <span>{uploadingLogo ? 'Carregando logo...' : 'Enviar Novo Logotipo (PNG/JPG)'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>

                      {profile.logoUrl !== '/logo-2.png' && (
                        <button
                          type="button"
                          onClick={() => handleProfileChange('logoUrl', '/logo-2.png')}
                          className="px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 text-xs font-semibold bg-white hover:bg-stone-50 transition shadow-xs cursor-pointer"
                        >
                          Restaurar Logo 2 Padrão
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Presets Rápidos de Logotipo */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                    Modelos pré-definidos de logotipo:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => handleProfileChange('logoUrl', '/logo-2.png')}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                        (profile.logoUrl || '/logo-2.png') === '/logo-2.png'
                          ? 'border-amber-400 bg-amber-50/80 shadow-md ring-1 ring-amber-400/40'
                          : 'border-stone-200 bg-white hover:border-amber-300'
                      }`}
                    >
                      <div className="bg-white p-2 rounded-xl border border-stone-200 shrink-0 shadow-xs">
                        <img src="/logo-2.png" alt="Logo 2" className="h-10 w-auto object-contain" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">Logo Completa com Nome</span>
                        <span className="text-[10px] text-stone-500">Horizontal com tipografia oficial</span>
                      </div>
                    </div>

                    <div
                      onClick={() => handleProfileChange('logoUrl', '/logo-1.png')}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                        profile.logoUrl === '/logo-1.png'
                          ? 'border-amber-400 bg-amber-50/80 shadow-md ring-1 ring-amber-400/40'
                          : 'border-stone-200 bg-white hover:border-amber-300'
                      }`}
                    >
                      <div className="bg-white p-2 rounded-xl border border-stone-200 shrink-0 shadow-xs">
                        <img src="/logo-1.png" alt="Logo 1" className="h-10 w-10 rounded-full object-cover" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">Monograma TM Dourado</span>
                        <span className="text-[10px] text-stone-500">Selo clássico da marca</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* URL de Logotipo Externa */}
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <div className="text-left">
                    <label className="text-[11px] text-stone-700 font-semibold block">URL de Logotipo Externa:</label>
                    <span className="text-[10px] text-stone-400">Cole um link direto caso seu logotipo esteja na nuvem</span>
                  </div>
                  <div className="flex gap-1.5 flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="https://exemplo.com/logo.png"
                      value={customLogoUrlInput}
                      onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customLogoUrlInput.trim()) {
                          handleProfileChange('logoUrl', customLogoUrlInput.trim());
                          setCustomLogoUrlInput('');
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold hover:brightness-105 shrink-0 cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MANAGE LINKS */}
          {activeTab === 'links' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Form Add New Link */}
              <div className="bg-white p-6 rounded-3xl border border-amber-200/80 space-y-4 shadow-sm">
                <h2 className="serif-title text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-600" /> Adicionar Novo Botão de Link
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">Título do Botão *</label>
                    <input
                      type="text"
                      placeholder="Ex: Artigo Científico"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">URL / Link Completo *</label>
                    <input
                      type="text"
                      placeholder="https://exemplo.com..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                    />
                    <p className="text-[11px] text-stone-400">Links são convertidos automaticamente para a URL completa.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">Subtítulo Explicativo (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Leia a publicação na íntegra"
                      value={newLinkSubtitle}
                      onChange={(e) => setNewLinkSubtitle(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">Selo / Tag em Destaque</label>
                    <input
                      type="text"
                      placeholder="Ex: NOVO, DESTAQUE, ARTIGO"
                      value={newLinkBadge}
                      onChange={(e) => setNewLinkBadge(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">Ícone</label>
                    <select
                      value={newLinkIcon}
                      onChange={(e) => setNewLinkIcon(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
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
                  className="px-5 py-2.5 rounded-xl gold-gradient-bg text-stone-950 font-extrabold text-xs flex items-center gap-2 hover:brightness-105 active:scale-98 transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Adicionar à Lista
                </button>
              </div>

              {/* Links List Manager */}
              <div className="bg-white p-6 rounded-3xl border border-amber-200/80 space-y-4 shadow-sm">
                <h2 className="serif-title text-xl font-bold text-stone-900">
                  Links Cadastrados
                </h2>

                <div className="space-y-3">
                  {links.map((link, index) => (
                    <div
                      key={link.id}
                      className="p-4 rounded-2xl bg-stone-50/90 border border-stone-200 hover:border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleMoveLink(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-stone-400 hover:text-amber-700 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveLink(index, 'down')}
                            disabled={index === links.length - 1}
                            className="p-1 text-stone-400 hover:text-amber-700 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900 text-sm truncate">{link.title}</span>
                            {link.badge && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                                {link.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 truncate">{link.url}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => setEditingLink({ ...link })}
                          className="px-3 py-1.5 rounded-xl border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>

                        <button
                          onClick={() => handleToggleLinkActive(link.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            link.isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {link.isActive ? 'Visível' : 'Oculto'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 text-stone-400 hover:text-red-600 transition cursor-pointer"
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
                <div className="p-6 rounded-3xl border border-amber-300 bg-amber-50/70 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-700 animate-spin" />
                      <h2 className="serif-title text-xl font-bold text-amber-950">
                        Solicitações de Pré-Agendamento Pendentes ({pendingBookings.length})
                      </h2>
                    </div>
                    <span className="text-xs bg-amber-500 text-stone-950 font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                      Ação Necessária
                    </span>
                  </div>

                  <div className="space-y-3">
                    {pendingBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl bg-white border border-amber-200/90 space-y-3 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
                          <div>
                            <span className="text-xs text-amber-800 font-mono font-semibold">
                              Solicitado para: {b.date} às {b.time}
                            </span>
                            <h3 className="text-base font-bold text-stone-900">{b.patientName}</h3>
                          </div>
                          <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300 font-semibold self-start sm:self-auto">
                            {b.procedure}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
                          <div>
                            <span className="text-stone-400 font-medium">Telefone:</span> {b.patientPhone}
                          </div>
                          {b.notes && (
                            <div>
                              <span className="text-stone-400 font-medium">Obs:</span> {b.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Confirmar Horário
                          </button>
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                            className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" /> Recusar / Liberar
                          </button>
                          <a
                            href={`https://wa.me/${b.patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Olá ${b.patientName}! Aqui é a Dra. Thaysa Meschiatti. Recebi sua solicitação de agendamento para ${b.date} às ${b.time}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl gold-gradient-bg text-stone-950 text-xs font-bold flex items-center gap-1.5 hover:brightness-105 transition shadow-xs cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" /> Chamar no WhatsApp
                          </a>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CONFIRMED BOOKINGS LIST */}
              {confirmedBookings.length > 0 && (
                <div className="p-6 rounded-3xl border border-emerald-300/70 bg-emerald-50/60 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h2 className="serif-title text-xl font-bold text-emerald-950">
                        Agendamentos Confirmados ({confirmedBookings.length})
                      </h2>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Prontos para Atendimento
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {confirmedBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl bg-white border border-emerald-200/80 space-y-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                          <div>
                            <span className="text-xs text-emerald-800 font-mono font-semibold">
                              {b.date} às {b.time}
                            </span>
                            <h3 className="text-base font-bold text-stone-900">{b.patientName}</h3>
                          </div>
                          <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 font-semibold">
                            {b.procedure}
                          </span>
                        </div>

                        <div className="text-xs text-stone-600 space-y-1">
                          <p><span className="text-stone-400 font-medium">Telefone:</span> {b.patientPhone}</p>
                          {b.notes && <p><span className="text-stone-400 font-medium">Obs:</span> {b.notes}</p>}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={generateWhatsAppConfirmationUrl(b)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Enviar Confirmação WhatsApp</span>
                          </a>
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            title="Cancelar / Liberar Horário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BATCH CREATE SLOTS */}
              <div className="bg-white p-6 rounded-3xl border border-amber-200/80 space-y-4 shadow-sm">
                <h2 className="serif-title text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" /> Cadastrar Novos Horários Disponíveis
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">Escolha a Data</label>
                    <input
                      type="date"
                      value={batchDate}
                      onChange={(e) => setBatchDate(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">Horários Selecionados</label>
                    <p className="text-xs text-amber-800 font-mono font-bold pt-2">
                      {selectedTimes.length} horário(s) selecionado(s)
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-stone-600">Clique para Marcar/Desmarcar os Horários:</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {commonTimesList.map((time) => {
                      const isSelected = selectedTimes.includes(time);
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleTimeSelection(time)}
                          className={`py-2 rounded-xl font-mono text-xs font-bold transition border cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-xs'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-amber-400'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleAddBatchSlots}
                    className="px-5 py-2.5 rounded-xl gold-gradient-bg text-stone-950 font-extrabold text-xs flex items-center gap-2 hover:brightness-105 active:scale-98 transition shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Horários na Agenda
                  </button>

                  <button
                    onClick={() => handleOpenManualBooking()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 hover:brightness-105 active:scale-98 transition shadow-md cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Novo Agendamento Manual
                  </button>
                </div>
              </div>

              {/* EXISTING SLOTS LIST - SEPARADO POR DIAS */}
              <div className="bg-white p-6 rounded-3xl border border-amber-200/80 space-y-6 shadow-sm">
                
                {/* Cabeçalho da Seção com Contadores */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/70 pb-4">
                  <div>
                    <h2 className="serif-title text-xl font-bold text-stone-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-600" /> Agenda Cadastrada ({slots.length} horários em {Array.from(new Set(slots.map((s) => s.date))).length} dias)
                    </h2>
                    <p className="text-xs text-stone-500">
                      Visualização organizada e separada por cada dia disponível.
                    </p>
                  </div>

                  {/* Badges de Resumo */}
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {slots.filter((s) => s.status === 'available').length} Livres
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      {slots.filter((s) => s.status === 'pending').length} Pendentes
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-stone-100 border border-stone-300 text-stone-700 text-xs font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-stone-500"></span>
                      {slots.filter((s) => s.status === 'booked').length} Ocupados
                    </span>
                  </div>
                </div>

                {/* Filtro / Abas de Navegação Rápida por Dia */}
                {Array.from(new Set(slots.map((s) => s.date))).length > 1 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-stone-500 font-semibold block">Filtrar Visualização por Dia:</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        onClick={() => setFilterDate('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border cursor-pointer ${
                          filterDate === 'all'
                            ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-amber-400'
                        }`}
                      >
                        Todos os Dias ({slots.length})
                      </button>
                      {Array.from(new Set(slots.map((s) => s.date))).sort().map((dStr) => {
                        const dayFree = slots.filter((s) => s.date === dStr && s.status === 'available').length;
                        const [y, m, d] = dStr.split('-');
                        const isSelected = filterDate === dStr;
                        return (
                          <button
                            key={dStr}
                            onClick={() => setFilterDate(dStr)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400 text-stone-950 border-amber-500 font-bold shadow-xs'
                                : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-amber-400'
                            }`}
                          >
                            <span>Dia {d}/{m}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isSelected ? 'bg-stone-950 text-amber-300' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {dayFree} livres
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lista Separada Dia por Dia */}
                {slots.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-stone-300 rounded-3xl space-y-2">
                    <Calendar className="w-10 h-10 text-stone-400 mx-auto" />
                    <p className="text-sm font-semibold text-stone-600">Nenhum horário cadastrado na agenda.</p>
                    <p className="text-xs text-stone-400">Cadastre datas e horários no formulário acima.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(filterDate === 'all'
                      ? Array.from(new Set(slots.map((s) => s.date))).sort()
                      : [filterDate]
                    ).map((dateStr) => {
                      const daySlots = slots.filter((s) => s.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
                      const freeCount = daySlots.filter((s) => s.status === 'available').length;
                      const pendingCount = daySlots.filter((s) => s.status === 'pending').length;
                      const bookedCount = daySlots.filter((s) => s.status === 'booked').length;
                      const isFullyBooked = freeCount === 0 && daySlots.length > 0;

                      return (
                        <div
                          key={dateStr}
                          className="p-5 rounded-3xl bg-stone-50/90 border border-amber-200/80 space-y-4 shadow-xs hover:border-amber-400 transition"
                        >
                          {/* Cabeçalho do Dia */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 shadow-xs">
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                                  <span>{formatDateLabel(dateStr)}</span>
                                  {isFullyBooked ? (
                                    <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full border border-red-300">
                                      LOTADO
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                                      DISPONÍVEL
                                    </span>
                                  )}
                                </h3>
                                <p className="text-xs text-stone-500 pt-0.5">
                                  {daySlots.length} horário(s) no dia • <span className="text-emerald-700 font-semibold">{freeCount} livre(s)</span>
                                  {pendingCount > 0 && <span className="text-amber-800 font-semibold"> • {pendingCount} pendente(s)</span>}
                                  {bookedCount > 0 && <span className="text-stone-500"> • {bookedCount} preenchido(s)</span>}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={() => handleOpenManualBooking(undefined, dateStr)}
                                className="px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer"
                                title="Agendar um paciente diretamente neste dia"
                              >
                                <UserPlus className="w-3.5 h-3.5" /> Agendar
                              </button>

                              <button
                                onClick={() => {
                                  setBatchDate(dateStr);
                                  window.scrollTo({ top: 350, behavior: 'smooth' });
                                }}
                                className="px-3 py-1.5 rounded-xl border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer"
                                title="Cadastrar mais horários para este mesmo dia"
                              >
                                <Plus className="w-3.5 h-3.5" /> Mais Horários
                              </button>

                              <button
                                onClick={() => promptDeleteDay(dateStr)}
                                className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                title="Excluir todos os horários deste dia"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Grade de Horários do Dia */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {daySlots.map((s) => (
                              <div
                                key={s.id}
                                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 shadow-xs ${
                                  s.status === 'available'
                                    ? 'bg-white border-emerald-300 hover:border-emerald-500'
                                    : s.status === 'pending'
                                    ? 'bg-amber-50/90 border-amber-300'
                                    : 'bg-stone-100/90 border-stone-200 opacity-80'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Clock className={`w-4 h-4 ${
                                      s.status === 'available' ? 'text-emerald-600' : s.status === 'pending' ? 'text-amber-700' : 'text-stone-400'
                                    }`} />
                                    <span className="font-mono text-base font-bold text-stone-900">{s.time}</span>
                                  </div>

                                  <button
                                    onClick={() => promptDeleteSlot(s)}
                                    className="p-1 text-stone-400 hover:text-red-600 transition cursor-pointer"
                                    title="Remover Horário"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {s.booking && (
                                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] space-y-1">
                                    <div className="flex items-center justify-between">
                                      <p className="font-semibold text-stone-900 truncate">👤 {s.booking.patientName}</p>
                                      <span className="font-mono text-stone-500 text-[10px]">{s.booking.patientPhone}</span>
                                    </div>
                                    <p className="text-amber-800 font-medium truncate">🦷 {s.booking.procedure}</p>
                                  </div>
                                )}

                                <div className="pt-1 border-t border-stone-200/80 space-y-1.5">
                                  {s.status === 'pending' && s.booking ? (
                                    <div className="space-y-1.5">
                                      <button
                                        onClick={() => handleUpdateBookingStatus(s.booking!.id, 'confirmed')}
                                        className="w-full py-1.5 px-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Confirmar & Abrir WhatsApp</span>
                                      </button>
                                      <div className="flex gap-1.5">
                                        <a
                                          href={`https://wa.me/${s.booking.patientPhone.replace(/\D/g, '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-1 py-1 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-semibold flex items-center justify-center gap-1 border border-stone-200 cursor-pointer"
                                        >
                                          <MessageCircle className="w-3 h-3 text-emerald-600" /> WhatsApp
                                        </a>
                                        <button
                                          onClick={() => handleUpdateBookingStatus(s.booking!.id, 'cancelled')}
                                          className="py-1 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-semibold cursor-pointer"
                                        >
                                          Recusar
                                        </button>
                                      </div>
                                    </div>
                                  ) : s.status === 'booked' && s.booking ? (
                                    <div className="space-y-1.5">
                                      <a
                                        href={generateWhatsAppConfirmationUrl(s.booking)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-1.5 px-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>Reenviar WhatsApp</span>
                                      </a>
                                      <button
                                        onClick={() => handleUpdateBookingStatus(s.booking!.id, 'cancelled')}
                                        className="w-full py-1 px-2 rounded-lg text-stone-500 hover:text-red-600 text-[10px] transition text-center cursor-pointer"
                                      >
                                        Cancelar & Liberar Vaga
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <button
                                        onClick={() => handleOpenManualBooking(s)}
                                        className="w-full py-1.5 px-2 rounded-xl text-xs font-bold bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 hover:border-amber-400 flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                                      >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span>Agendar Paciente</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleUpdateSlotStatus(
                                            s.id,
                                            s.status === 'available' ? 'booked' : 'available'
                                          )
                                        }
                                        className={`w-full py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                                          s.status === 'available'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                            : 'bg-stone-200 text-stone-700 border-stone-300 hover:bg-stone-300'
                                        }`}
                                      >
                                        {s.status === 'available' ? '🟢 Livre (Clique p/ Fechar)' : '🔴 Ocupado (Clique p/ Reabrir)'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 4: SETTINGS & BACKUP */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-3xl border border-amber-200/80 space-y-6 shadow-sm animate-fadeIn">
              
              <div className="border-b border-amber-200/70 pb-4">
                <h2 className="serif-title text-xl font-bold text-stone-900">
                  Configurações do Sistema
                </h2>
                <p className="text-xs text-stone-500">
                  Gerenciamento de contas de acesso e backups do banco de dados.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" /> Contas com Acesso ao Painel
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 shadow-xs">
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                      DENTISTA
                    </span>
                    <p className="text-sm font-bold text-stone-900">Dra. Thaysa Meschiatti</p>
                    <p className="text-xs font-mono text-stone-500">Usuário: thaysa</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 shadow-xs">
                    <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-full border border-stone-300">
                      ADMINISTRADOR MASTER
                    </span>
                    <p className="text-sm font-bold text-stone-900">Suporte Técnico</p>
                    <p className="text-xs font-mono text-stone-500">Usuário: admin</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 shadow-xs">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-amber-600" /> Backup dos Dados
                </h3>
                <p className="text-xs text-stone-500">
                  Faça o download do arquivo de backup contendo todas as suas configurações, links cadastrados e horários da agenda.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2.5 rounded-xl border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 font-bold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4" /> Baixar Backup em JSON
                </button>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* EDIT LINK MODAL */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-amber-200/90 p-6 space-y-5 shadow-2xl relative text-stone-900">
            <button
              onClick={() => setEditingLink(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="serif-title text-xl font-bold text-stone-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" /> Editar Botão de Link
              </h2>
              <p className="text-xs text-stone-500">
                Altere o título, URL de destino ou visual deste botão.
              </p>
            </div>

            <form onSubmit={handleSaveEditedLink} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Título do Botão *</label>
                <input
                  type="text"
                  required
                  value={editingLink.title}
                  onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">URL / Link Completo *</label>
                <input
                  type="text"
                  required
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Subtítulo Explicativo (Opcional)</label>
                <input
                  type="text"
                  value={editingLink.subtitle || ''}
                  onChange={(e) => setEditingLink({ ...editingLink, subtitle: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Selo / Tag em Destaque</label>
                  <input
                    type="text"
                    value={editingLink.badge || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, badge: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Ícone</label>
                  <select
                    value={editingLink.iconName}
                    onChange={(e) => setEditingLink({ ...editingLink, iconName: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
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
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl gold-gradient-bg text-stone-950 font-extrabold text-xs flex items-center gap-1.5 hover:brightness-105 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMED NOTIFICATION MODAL */}
      {confirmedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-300 p-6 sm:p-8 space-y-5 shadow-2xl relative text-center text-stone-900">
            <button
              onClick={() => setConfirmedNotification(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-700 shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="serif-title text-2xl font-bold text-stone-900">
                Agendamento Confirmado!
              </h2>
              <p className="text-xs text-emerald-800">
                O horário foi confirmado. A conversa no WhatsApp do paciente foi aberta com a mensagem pronta.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-500">Paciente:</span>
                <span className="font-bold text-stone-900">{confirmedNotification.patientName}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-500">WhatsApp:</span>
                <span className="font-mono font-semibold text-emerald-700">{confirmedNotification.patientPhone}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-500">Data e Horário:</span>
                <span className="font-bold text-stone-900">{confirmedNotification.date} às {confirmedNotification.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Procedimento:</span>
                <span className="font-semibold text-amber-800">{confirmedNotification.procedure}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={confirmedNotification.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setConfirmedNotification(null)}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-xl hover:scale-[1.02] cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Abrir WhatsApp do Paciente Agora</span>
              </a>

              <button
                type="button"
                onClick={() => setConfirmedNotification(null)}
                className="w-full py-2 text-xs text-stone-500 hover:text-stone-800 transition cursor-pointer font-medium"
              >
                Fechar Notificação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {(slotToDelete || dayToDelete) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-red-200 p-6 space-y-5 shadow-2xl relative text-center text-stone-900">
            <div className="w-14 h-14 rounded-full bg-red-100 border border-red-300 mx-auto flex items-center justify-center text-red-600">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="serif-title text-xl font-bold text-stone-900">
                {slotToDelete ? 'Excluir este Horário?' : 'Excluir Horários do Dia?'}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {slotToDelete ? (
                  <>
                    Tem certeza que deseja remover o horário das <b className="text-stone-900 font-mono">{slotToDelete.time}</b> do dia <b className="text-stone-900">{formatDateLabel(slotToDelete.date)}</b>?
                  </>
                ) : (
                  <>
                    Tem certeza que deseja remover <b className="text-red-700">TODOS</b> os horários cadastrados para o dia <b className="text-stone-900">{formatDateLabel(dayToDelete || '')}</b>?
                  </>
                )}
              </p>

              {slotToDelete?.booking && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs text-left">
                  ⚠️ <b>Atenção:</b> Há um agendamento vinculado de <b>{slotToDelete.booking.patientName}</b>.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setSlotToDelete(null);
                  setDayToDelete(null);
                }}
                className="py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 text-xs font-semibold hover:bg-stone-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={slotToDelete ? executeDeleteSlot : executeDeleteDay}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL APPOINTMENT MODAL */}
      {manualBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-amber-200/90 p-6 space-y-5 shadow-2xl relative text-stone-900">
            <button
              onClick={() => setManualBookingModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold">
                <UserPlus className="w-3.5 h-3.5" /> Agendamento Interno
              </div>
              <h2 className="serif-title text-xl font-bold text-stone-900">
                Cadastrar Agendamento Manualmente
              </h2>
              <p className="text-xs text-stone-500">
                Preencha os dados do paciente para agendar diretamente pelo consultório ou WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSubmitManualBooking} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Data do Atendimento *</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Horário *</label>
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 font-mono focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-600" /> Nome do Paciente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={manualPatientName}
                  onChange={(e) => setManualPatientName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-600" /> WhatsApp com DDD *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(27) 99612-1643"
                  value={manualPatientPhone}
                  onChange={handleManualPhoneChange}
                  className={`w-full bg-stone-50 border rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none transition ${
                    manualPhoneError ? 'border-red-500 focus:border-red-500' : 'border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                />
                {manualPhoneError && (
                  <p className="text-[11px] text-red-600 font-medium">{manualPhoneError}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Procedimento
                </label>
                <select
                  value={manualProcedure}
                  onChange={(e) => setManualProcedure(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                >
                  <option value="Avaliação Geral & Diagnóstico">Avaliação Geral & Diagnóstico</option>
                  <option value="Limpeza Profissional (Profilaxia)">Limpeza Profissional (Profilaxia)</option>
                  <option value="Clareamento Dental">Clareamento Dental</option>
                  <option value="Alinhadores / Ortodontia">Alinhadores / Ortodontia</option>
                  <option value="Restauração Estética">Restauração Estética</option>
                  <option value="Urgência Odontológica">Urgência Odontológica</option>
                  <option value="Consulta de Retorno">Consulta de Retorno</option>
                  <option value="Outro Procedimento">Outro Procedimento</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">
                  Observações Internas (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Primeira consulta, indicado por familiar..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sendWhatsAppCheck"
                  checked={manualSendWhatsApp}
                  onChange={(e) => setManualSendWhatsApp(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
                <label htmlFor="sendWhatsAppCheck" className="text-xs text-stone-700 cursor-pointer select-none">
                  Abrir WhatsApp para enviar mensagem de confirmação ao paciente
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setManualBookingModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-5 py-2.5 rounded-xl gold-gradient-bg text-stone-950 font-extrabold text-xs flex items-center gap-1.5 hover:brightness-105 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{manualSubmitting ? 'Salvando...' : 'Confirmar Agendamento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
