'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  Share2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  User,
  Phone,
  AlertCircle,
  X,
  Send,
  Award,
  ShieldCheck
} from 'lucide-react';
import { AppData, TimeSlot, LinkItem } from '@/types';
import { ensureAbsoluteUrl, formatPhoneMask, isValidPhone } from '@/lib/utils';
import { initialData } from '@/data/initialData';

// Instagram Brand Icon SVG
const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'MessageCircle':
      return <MessageCircle className="w-5 h-5" />;
    case 'FileText':
      return <FileText className="w-5 h-5" />;
    case 'Instagram':
      return <InstagramIcon className="w-5 h-5" />;
    case 'Calendar':
      return <Calendar className="w-5 h-5" />;
    case 'Award':
      return <Award className="w-5 h-5" />;
    default:
      return <ExternalLink className="w-5 h-5" />;
  }
};

export default function PublicPage() {
  const [data, setData] = useState<AppData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('thaysa_app_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.profile) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return initialData;
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'links' | 'schedule'>('links');
  const [todayStr, setTodayStr] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialData.slots && initialData.slots.length > 0) {
      const dates = Array.from(new Set(initialData.slots.map((s) => s.date))).sort();
      return dates[0] || '';
    }
    return '';
  });
  const [bookingModalSlot, setBookingModalSlot] = useState<TimeSlot | null>(null);
  const [currentYear, setCurrentYear] = useState('2026');

  // Form State & Validation
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [procedure, setProcedure] = useState('Avaliação Geral & Diagnóstico');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Booking Redirect & Timer State
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [whatsappRedirectUrl, setWhatsappRedirectUrl] = useState('');

  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    setTodayStr(today);
    setCurrentYear(year.toString());
    fetchData(today);
  }, []);

  // Timer Effect for Redirect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (bookingSuccess && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
    } else if (bookingSuccess && redirectCountdown === 0 && whatsappRedirectUrl) {
      window.location.href = whatsappRedirectUrl;
    }
    return () => clearTimeout(timer);
  }, [bookingSuccess, redirectCountdown, whatsappRedirectUrl]);

  const fetchData = async (currentToday?: string) => {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && json.data) {
        setData(json.data);
        try {
          localStorage.setItem('thaysa_app_data', JSON.stringify(json.data));
        } catch (e) {}

        const todayFilter = currentToday || todayStr;
        if (json.data.slots && json.data.slots.length > 0) {
          const futureDates = Array.from(
            new Set(
              json.data.slots
                .filter((s: TimeSlot) => !todayFilter || s.date >= todayFilter)
                .map((s: TimeSlot) => s.date)
            )
          ).sort();
          if (futureDates.length > 0) {
            setSelectedDate((prev) =>
              !prev || (todayFilter && prev < todayFilter) || !futureDates.includes(prev)
                ? (futureDates[0] as string)
                : prev
            );
          }
        }
      }
    } catch (err) {
      console.warn('Usando dados em cache:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (link: LinkItem) => {
    const targetUrl = ensureAbsoluteUrl(link.url);
    window.open(targetUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Dra. Thaysa Meschiatti | Cirurgiã-Dentista',
          text: 'Agendamentos e links oficiais da Dra. Thaysa Meschiatti',
          url: window.location.href,
        });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleOpenBooking = (slot: TimeSlot) => {
    if (slot.status !== 'available') return;
    setBookingModalSlot(slot);
    setBookingSuccess(false);
    setPhoneError('');
    setRedirectCountdown(5);
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = formatPhoneMask(e.target.value);
    setPatientPhone(maskedValue);
    if (phoneError && isValidPhone(maskedValue)) {
      setPhoneError('');
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalSlot || !patientName.trim()) return;

    if (!isValidPhone(patientPhone)) {
      setPhoneError('Por favor, informe um WhatsApp válido com DDD ex: (27) 99612-1643.');
      return;
    }

    setSubmitting(true);
    setPhoneError('');

    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book',
          slotId: bookingModalSlot.id,
          patientName,
          patientPhone,
          procedure,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        const [year, month, day] = bookingModalSlot.date.split('-');
        const dateFormatted = `${day}/${month}/${year}`;
        
        const waText = encodeURIComponent(
          `*SOLICITAÇÃO DE AGENDAMENTO - DRA. THAYSA MESCHIATTI* 🦷✨\n\n` +
          `Olá Dra. Thaysa! Acabei de solicitar uma pré-reserva de horário pelo seu site:\n\n` +
          `👤 *Paciente:* ${patientName}\n` +
          `📱 *WhatsApp:* ${patientPhone}\n` +
          `📅 *Data:* ${dateFormatted}\n` +
          `⏰ *Horário:* ${bookingModalSlot.time}\n` +
          `🦷 *Procedimento:* ${procedure}\n` +
          (notes ? `📝 *Observação:* ${notes}\n` : '') +
          `\nPoderia me confirmar a disponibilidade deste horário? Muito obrigado(a)! 🙏😊`
        );

        const targetWaNumber = data?.profile.whatsappNumber || '5527996121643';
        const cleanNumber = targetWaNumber.replace(/\D/g, '');
        const phoneWithCountry = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
        const waUrl = `https://wa.me/${phoneWithCountry}?text=${waText}`;

        setWhatsappRedirectUrl(waUrl);
        setBookingSuccess(true);
        setRedirectCountdown(5);
        fetchData();
      } else {
        alert(json.message || 'Horário já reservado por outro paciente.');
        fetchData();
      }
    } catch (err) {
      alert('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualRedirect = () => {
    if (whatsappRedirectUrl) {
      window.location.href = whatsappRedirectUrl;
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col items-center justify-center p-6">
        <div className="relative w-20 h-20 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/40 animate-ping"></div>
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border border-amber-300 shadow-md">
            <span className="serif-title text-2xl font-bold text-amber-700">TM</span>
          </div>
        </div>
        <p className="text-amber-800 text-xs tracking-widest uppercase font-semibold animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  const { profile, links, slots } = data;
  const activeLinks = links.filter((l) => l.isActive).sort((a, b) => a.order - b.order);

  // Não exibe horários passados: apenas hoje e datas futuras
  const activeSlots = (slots || []).filter((s) => !todayStr || s.date >= todayStr);
  const uniqueDates = Array.from(new Set(activeSlots.map((s) => s.date))).sort();
  const slotsForSelectedDate = activeSlots.filter((s) => s.date === selectedDate);
  const availableCount = activeSlots.filter((s) => s.status === 'available').length;

  const formatDateDetailed = (dateStr: string) => {
    if (!dateStr) return { weekday: '', day: '', month: '', fullLabel: '' };
    try {
      const [y, m, d] = dateStr.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      const weekdayShort = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
      const monthShort = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

      let prefix = '';
      if (todayStr && dateStr === todayStr) {
        prefix = 'Hoje';
      }

      return {
        weekday: prefix || weekdayShort,
        day: d,
        month: monthShort,
        fullLabel: prefix ? `${prefix} (${d}/${m})` : `${weekdayShort}, ${d}/${m}`,
      };
    } catch (e) {
      return { weekday: '', day: dateStr, month: '', fullLabel: dateStr };
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 flex flex-col items-center px-4 py-6 sm:py-10 relative overflow-x-hidden selection:bg-amber-200 selection:text-amber-950">
      {/* Decorative Warm Ambient Lights */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-gradient-to-b from-amber-200/35 via-amber-100/20 to-transparent rounded-full blur-[110px] pointer-events-none"></div>
      <div className="absolute top-1/3 -right-24 w-72 h-72 bg-amber-300/15 rounded-full blur-[100px] pointer-events-none"></div>

      <main className="w-full max-w-[430px] mx-auto flex flex-col items-center z-10 space-y-5">
        
        {/* Brand Header */}
        <header className="w-full text-center flex flex-col items-center space-y-3 pt-3">
          
          {/* Foto de Perfil com Aro Dourado e Status */}
          <div className="relative group my-2">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 blur-sm opacity-60 group-hover:opacity-90 transition duration-500"></div>
            
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-amber-300/90 bg-white flex items-center justify-center p-0.5 shadow-xl">
              <img
                src={profile.avatarUrl || '/logo-1.png'}
                alt={profile.name}
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            {/* Indicador de Agenda Aberta */}
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-md" title="Atendimento Ativo">
              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
            </span>
          </div>

          {/* Identificação & Bio */}
          <div className="space-y-1.5 text-center px-2">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="serif-title text-2xl sm:text-3xl font-bold gold-gradient-text tracking-wide leading-tight">
                {profile.name}
              </h1>
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            </div>

            <div className="flex items-center justify-center gap-2 text-stone-700 text-xs sm:text-sm font-semibold tracking-wider uppercase">
              <span>{profile.title}</span>
              <span className="text-amber-400 font-bold">•</span>
              <span className="bg-amber-100/90 text-amber-900 text-[11px] px-2.5 py-0.5 rounded-full border border-amber-300 font-mono font-bold shadow-xs">
                {profile.cro}
              </span>
            </div>

            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto pt-0.5">
              {profile.bio}
            </p>
          </div>

          {/* Barra de Ações Rápidas */}
          <div className="flex items-center justify-center gap-3.5 pt-1.5">
            <a
              href={`https://wa.me/${profile.whatsappNumber}?text=${encodeURIComponent('Olá Dra. Thaysa! Vim pelo seu link e gostaria de informações.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-white border border-stone-200/90 text-emerald-600 hover:text-emerald-700 hover:border-emerald-400 hover:shadow-md transition-all active:scale-95 shadow-xs min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer"
              title="Falar no WhatsApp"
              aria-label="WhatsApp da Dra. Thaysa"
            >
              <MessageCircle className="w-5 h-5" />
            </a>

            <a
              href={ensureAbsoluteUrl(profile.instagramUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-white border border-stone-200/90 text-pink-600 hover:text-pink-700 hover:border-pink-400 hover:shadow-md transition-all active:scale-95 shadow-xs min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer"
              title="Instagram Profissional"
              aria-label="Instagram da Dra. Thaysa"
            >
              <InstagramIcon className="w-5 h-5" />
            </a>

            <button
              onClick={handleShare}
              className="p-3 rounded-full bg-white border border-stone-200/90 text-amber-700 hover:text-amber-800 hover:border-amber-400 hover:shadow-md transition-all active:scale-95 shadow-xs relative min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer"
              title="Compartilhar Perfil"
              aria-label="Compartilhar Perfil"
            >
              <Share2 className="w-5 h-5" />
              {copiedLink && (
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-stone-900 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg animate-fade-in">
                  Link copiado!
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Segmented Control Tabs */}
        <div className="w-full grid grid-cols-2 p-1.5 bg-stone-200/70 rounded-2xl border border-stone-300/60 shadow-inner">
          <button
            onClick={() => setActiveTab('links')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'links'
                ? 'gold-gradient-bg text-stone-950 shadow-md font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Links Rápidos</span>
          </button>
          
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 relative cursor-pointer ${
              activeTab === 'schedule'
                ? 'gold-gradient-bg text-stone-950 shadow-md font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Horários</span>
            {availableCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === 'schedule' ? 'bg-stone-950 text-amber-300' : 'bg-emerald-600 text-white'
              }`}>
                {availableCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: LINKS & CONTENT */}
        {activeTab === 'links' && (
          <div className="w-full space-y-3 animate-fade-in">
            {activeLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className="w-full group luxury-card p-4 rounded-2xl flex items-center justify-between text-left transition-all duration-200 cursor-pointer min-h-[64px]"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-amber-50/90 border border-amber-200/80 flex items-center justify-center text-amber-800 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-stone-950 transition-all duration-200 shrink-0">
                    {renderIcon(link.iconName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-900 group-hover:text-amber-900 text-sm sm:text-base transition-colors truncate">
                        {link.title}
                      </h3>
                      {link.badge && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                          {link.badge}
                        </span>
                      )}
                    </div>
                    {link.subtitle && (
                      <p className="text-stone-500 text-xs truncate pt-0.5">
                        {link.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 group-hover:text-amber-800 group-hover:border-amber-300 transition-colors shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}

            {/* Featured Action Card */}
            <button
              onClick={() => setActiveTab('schedule')}
              className="w-full relative group overflow-hidden gold-gradient-bg p-4 sm:p-4.5 rounded-2xl flex items-center justify-between text-left text-stone-950 font-bold shadow-lg hover:shadow-xl active:scale-[0.985] transition-all duration-200 mt-2 min-h-[68px] cursor-pointer"
            >
              <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
              <div className="flex items-center space-x-3.5 z-10">
                <div className="w-11 h-11 rounded-xl bg-stone-950/15 flex items-center justify-center text-stone-950 shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] uppercase font-extrabold tracking-widest text-stone-950/80">
                    Atendimento Presencial
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-stone-950">
                    Ver Horários & Agendar
                  </div>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-stone-950/15 flex items-center justify-center text-stone-950 z-10 shrink-0">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {/* TAB 2: SCHEDULE & SLOT BOOKING */}
        {activeTab === 'schedule' && (
          <div className="w-full space-y-4 animate-fade-in">
            
            {/* Context Notice */}
            <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5 shadow-xs">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Selecione o dia e o horário ideal. Ao clicar, preencha seus dados para enviar sua mensagem direta no WhatsApp e confirmar sua consulta com a Dra. Thaysa.
              </p>
            </div>

            {uniqueDates.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-amber-300 text-stone-500 shadow-sm">
                <Calendar className="w-8 h-8 text-amber-600/60 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-700">Nenhum horário cadastrado no momento.</p>
                <p className="text-xs text-stone-500 mt-1">Fale diretamente pelo WhatsApp para verificar disponibilidade de encaixe.</p>
              </div>
            ) : (
              <>
                {/* Horizontal Date Selector Carousel */}
                <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth snap-x">
                  {uniqueDates.map((dateStr) => {
                    const countForDate = activeSlots.filter((s) => s.date === dateStr && s.status === 'available').length;
                    const isSelected = selectedDate === dateStr;
                    const dateInfo = formatDateDetailed(dateStr);

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`snap-start py-2.5 px-3 rounded-2xl text-center transition-all duration-200 flex flex-col items-center justify-center min-w-[70px] shrink-0 border cursor-pointer ${
                          isSelected
                            ? 'gold-gradient-bg text-stone-950 border-amber-400 font-extrabold shadow-md scale-102'
                            : 'luxury-card text-stone-700 hover:border-amber-300'
                        }`}
                      >
                        <span className={`text-[10px] font-bold tracking-wider uppercase ${isSelected ? 'text-stone-950' : 'text-stone-500'}`}>
                          {dateInfo.weekday}
                        </span>
                        <span className="text-base sm:text-lg font-black leading-tight">
                          {dateInfo.day}
                        </span>
                        <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-stone-900' : 'text-stone-400'}`}>
                          {dateInfo.month}
                        </span>
                        {countForDate > 0 && (
                          <span
                            className={`mt-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isSelected ? 'bg-stone-950 text-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {countForDate}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {slotsForSelectedDate.map((slot) => {
                    const isAvailable = slot.status === 'available';
                    const isPending = slot.status === 'pending';
                    const isBooked = slot.status === 'booked';

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => isAvailable && handleOpenBooking(slot)}
                        className={`p-3.5 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center space-y-1 min-h-[76px] cursor-pointer ${
                          isAvailable
                            ? 'luxury-card border-emerald-300/80 hover:border-emerald-500 hover:shadow-md active:scale-[0.97]'
                            : isPending
                            ? 'bg-amber-50/80 border-amber-200 text-stone-500 opacity-90 cursor-not-allowed'
                            : 'bg-stone-100/90 border-stone-200 text-stone-400 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-4 h-4 ${
                            isAvailable ? 'text-emerald-600 group-hover:scale-110' : isPending ? 'text-amber-600' : 'text-stone-400'
                          } transition-transform`} />
                          <span className="font-mono text-base sm:text-lg font-bold text-stone-900">
                            {slot.time}
                          </span>
                        </div>

                        <div className="text-[11px] font-medium tracking-wide">
                          {isAvailable && (
                            <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                              Disponível <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                          {isPending && (
                            <span className="text-amber-700 font-semibold">
                              Em análise
                            </span>
                          )}
                          {isBooked && (
                            <span className="text-stone-400">
                              Ocupado
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="w-full pt-10 pb-12 text-center flex flex-col items-center space-y-4">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mx-auto"></div>
          
          {/* Logotipo Oficial da Marca - Em destaque no rodapé */}
          <div className="flex justify-center px-4 py-2 w-full">
            <img
              src={profile.logoUrl || '/logo-2.png'}
              alt="Dra. Thaysa Meschiatti - Cirurgiã-Dentista • CRO ES 11914"
              className="w-64 sm:w-72 md:w-80 max-w-[340px] h-auto object-contain drop-shadow-[0_4px_16px_rgba(180,83,9,0.15)] select-none hover:scale-105 transition-transform duration-300"
            />
          </div>

          <p className="text-stone-500 text-xs tracking-wider">
            © {currentYear} Dra. Thaysa Meschiatti • CRO ES 11914
          </p>
        </footer>

      </main>

      {/* MOBILE BOTTOM SHEET & BOOKING MODAL */}
      {bookingModalSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-amber-200/80 shadow-2xl animate-slide-up sm:animate-fade-in max-h-[92vh] flex flex-col overflow-hidden text-stone-900">
            
            {/* Mobile drag handle indicator */}
            <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mt-3 mb-1 sm:hidden"></div>

            {/* Header */}
            <div className="px-6 pt-3 pb-2 flex items-start justify-between border-b border-stone-100 relative">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
                  <Calendar className="w-3.5 h-3.5" /> Pré-Agendamento Online
                </div>
                <h2 className="serif-title text-xl sm:text-2xl font-bold text-stone-900">
                  Solicitar Horário
                </h2>
                <p className="text-xs text-stone-500">
                  Preencha seus dados para reservar e confirmar com a Dra. Thaysa.
                </p>
              </div>

              <button
                onClick={() => setBookingModalSlot(null)}
                className="text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition -mr-2 -mt-1 cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
              
              {/* Selected Slot Recap */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-amber-900 uppercase font-semibold">Data & Horário Selecionados</p>
                    <p className="text-sm sm:text-base font-bold text-stone-900 font-mono">
                      {formatDateDetailed(bookingModalSlot.date).fullLabel} às {bookingModalSlot.time}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold border border-emerald-300 shrink-0">
                  Disponível
                </span>
              </div>

              {/* Form or Success State */}
              {bookingSuccess ? (
                <div className="text-center py-4 space-y-4 animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-300 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-stone-900">Pré-Reserva Registrada!</h3>
                    <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
                      Sua solicitação foi registrada. Agora confirme diretamente com a Dra. Thaysa no WhatsApp:
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-mono flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin text-amber-700" />
                    <span>Redirecionando automaticamente em <b>{redirectCountdown}</b> segundos...</span>
                  </div>

                  <a
                    href={whatsappRedirectUrl}
                    onClick={handleManualRedirect}
                    className="w-full py-4 px-4 rounded-xl gold-gradient-bg text-stone-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 hover:brightness-105 active:scale-98 transition shadow-lg text-center cursor-pointer min-h-[52px]"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Confirmar no WhatsApp da Dra. Thaysa</span>
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmitBooking} className="space-y-3.5">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-amber-700" /> Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Maria Silva"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-base text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition min-h-[48px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-amber-700" /> Seu WhatsApp com DDD *
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      required
                      placeholder="(27) 99612-1643"
                      value={patientPhone}
                      onChange={handlePhoneInputChange}
                      className={`w-full bg-stone-50 border rounded-xl px-3.5 py-3 text-base text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none transition min-h-[48px] ${
                        phoneError ? 'border-red-500 focus:border-red-500' : 'border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      }`}
                    />
                    {phoneError && (
                      <p className="text-[11px] text-red-600 flex items-center gap-1 pt-0.5 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{phoneError}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Procedimento de Interesse
                    </label>
                    <select
                      value={procedure}
                      onChange={(e) => setProcedure(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-base text-stone-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition min-h-[48px]"
                    >
                      <option value="Avaliação Geral & Diagnóstico">Avaliação Geral & Diagnóstico</option>
                      <option value="Limpeza Profissional (Profilaxia)">Limpeza Profissional (Profilaxia)</option>
                      <option value="Clareamento Dental">Clareamento Dental</option>
                      <option value="Alinhadores / Ortodontia">Alinhadores / Ortodontia</option>
                      <option value="Restauração Estética">Restauração Estética</option>
                      <option value="Urgência Odontológica">Urgência / Dor</option>
                      <option value="Outro Atendimento">Outro / Dúvida</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">
                      Observações ou Dúvidas (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Prefiro atendimento no período da manhã..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-base text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 px-4 rounded-xl gold-gradient-bg text-stone-950 font-extrabold text-base flex items-center justify-center gap-2 hover:brightness-105 active:scale-98 transition shadow-lg disabled:opacity-50 min-h-[52px] cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Reservando...' : 'Confirmar & Chamar no WhatsApp'}</span>
                  </button>

                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
