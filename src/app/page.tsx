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
  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'links' | 'schedule'>('links');
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
    setCurrentYear(new Date().getFullYear().toString());
    fetchData();
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

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && json.data) {
        setData(json.data);
        if (json.data.slots && json.data.slots.length > 0) {
          const uniqueDates = Array.from(new Set(json.data.slots.map((s: TimeSlot) => s.date))).sort();
          if (uniqueDates.length > 0 && !selectedDate) {
            setSelectedDate(uniqueDates[0] as string);
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
          `*SOLICITAÇÃO DE AGENDAMENTO - DRA. THAYSA MESCHIATTI*\n\n` +
          `• *Data:* ${dateFormatted}\n` +
          `• *Horário:* ${bookingModalSlot.time}\n` +
          `• *Nome:* ${patientName}\n` +
          `• *Telefone:* ${patientPhone}\n` +
          `• *Procedimento:* ${procedure}\n` +
          (notes ? `• *Observação:* ${notes}\n` : '') +
          `\nOlá Dra. Thaysa! Acabei de solicitar a pré-reserva deste horário pelo seu link. Poderia me confirmar?`
        );

        const targetWaNumber = data?.profile.whatsappNumber || '5527996121643';
        const waUrl = `https://wa.me/${targetWaNumber}?text=${waText}`;

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
      <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-6">
        <div className="relative w-20 h-20 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping"></div>
          <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center border border-amber-500/40 gold-glow">
            <span className="serif-title text-2xl font-bold text-amber-300">TM</span>
          </div>
        </div>
        <p className="text-amber-200/80 text-sm tracking-widest uppercase font-medium animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  const { profile, links, slots } = data;
  const activeLinks = links.filter((l) => l.isActive).sort((a, b) => a.order - b.order);

  const uniqueDates = Array.from(new Set(slots.map((s) => s.date))).sort();
  const slotsForSelectedDate = slots.filter((s) => s.date === selectedDate);
  const availableCount = slots.filter((s) => s.status === 'available').length;

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dateObj.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

    if (diffDays === 0) return `Hoje (${d}/${m})`;
    if (diffDays === 1) return `Amanhã (${d}/${m})`;
    return `${dayName.toUpperCase()}, ${d} ${monthName}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 flex flex-col items-center px-4 py-8 md:py-12 relative overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <main className="w-full max-w-md mx-auto flex flex-col items-center z-10 space-y-6">
        
        {/* Header / Profile Info */}
        <div className="w-full text-center flex flex-col items-center space-y-4">
          
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-200 to-amber-600 blur-sm opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-amber-300/60 bg-black flex items-center justify-center p-1 shadow-2xl">
              <img
                src={profile.avatarUrl || '/logo-1.jpeg'}
                alt={profile.name}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-[#0a0a0c] rounded-full flex items-center justify-center shadow-lg" title="Disponível para agendamentos">
              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="serif-title text-2xl md:text-3xl font-bold gold-gradient-text tracking-wide">
                {profile.name}
              </h1>
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            </div>

            <p className="text-amber-200/90 text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2">
              <span>{profile.title}</span>
              <span className="text-amber-500/40">•</span>
              <span className="bg-amber-500/10 text-amber-300 text-xs px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                {profile.cro}
              </span>
            </p>

            <p className="text-neutral-400 text-xs leading-relaxed max-w-xs mx-auto pt-1">
              {profile.bio}
            </p>
          </div>

          {/* Quick Action Icon Bar */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <a
              href={`https://wa.me/${profile.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full glass-card text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-all hover:scale-105"
              title="Falar no WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a
              href={ensureAbsoluteUrl(profile.instagramUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full glass-card text-pink-400 hover:text-pink-300 hover:border-pink-500/40 transition-all hover:scale-105"
              title="Instagram"
            >
              <InstagramIcon className="w-5 h-5" />
            </a>
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full glass-card text-amber-400 hover:text-amber-300 hover:border-amber-500/40 transition-all hover:scale-105 relative"
              title="Compartilhar Perfil"
            >
              <Share2 className="w-5 h-5" />
              {copiedLink && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-bold text-[10px] px-2 py-0.5 rounded whitespace-nowrap shadow-lg">
                  Link copiado!
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Selector Pill */}
        <div className="w-full grid grid-cols-2 p-1 glass-panel rounded-2xl border border-amber-500/20">
          <button
            onClick={() => setActiveTab('links')}
            className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'links'
                ? 'gold-gradient-bg text-black shadow-lg font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Links Rápidos</span>
          </button>
          
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative ${
              activeTab === 'schedule'
                ? 'gold-gradient-bg text-black shadow-lg font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Horários</span>
            {availableCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === 'schedule' ? 'bg-black text-amber-300' : 'bg-amber-500 text-black'
              }`}>
                {availableCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: LINKS & CONTENT */}
        {activeTab === 'links' && (
          <div className="w-full space-y-3.5 animate-fadeIn">
            {activeLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className="w-full group glass-card p-4 rounded-2xl flex items-center justify-between text-left border border-amber-500/20 hover:border-amber-400/60 transition-all duration-300"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-900/30 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300 shrink-0">
                    {renderIcon(link.iconName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white group-hover:text-amber-300 text-sm md:text-base transition-colors truncate">
                        {link.title}
                      </h3>
                      {link.badge && (
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                          {link.badge}
                        </span>
                      )}
                    </div>
                    {link.subtitle && (
                      <p className="text-neutral-400 text-xs truncate pt-0.5">
                        {link.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-neutral-900/80 border border-amber-500/20 flex items-center justify-center text-neutral-400 group-hover:text-amber-300 group-hover:border-amber-400/50 transition-colors shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}

            <button
              onClick={() => setActiveTab('schedule')}
              className="w-full relative group overflow-hidden gold-gradient-bg p-4 rounded-2xl flex items-center justify-between text-left text-black font-bold shadow-xl hover:brightness-110 transition-all duration-300 mt-2"
            >
              <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
              <div className="flex items-center space-x-3.5 z-10">
                <div className="w-11 h-11 rounded-xl bg-black/20 flex items-center justify-center text-black">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-widest text-amber-950 opacity-80">
                    Atendimento Presencial
                  </div>
                  <div className="text-base font-extrabold">
                    Ver Horários & Agendar
                  </div>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-black/20 flex items-center justify-center text-black z-10">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        )}

        {/* TAB 2: SCHEDULE & SLOT BOOKING */}
        {activeTab === 'schedule' && (
          <div className="w-full space-y-4 animate-fadeIn">
            
            <div className="p-3.5 glass-panel rounded-2xl border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Escolha o horário desejado abaixo. Ao selecionar, você preencherá seus dados e enviará uma mensagem direta para a Dra. Thaysa confirmar no WhatsApp!
              </p>
            </div>

            {uniqueDates.length === 0 ? (
              <div className="text-center p-8 glass-panel rounded-2xl border border-dashed border-amber-500/20 text-neutral-400">
                <Calendar className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
                <p className="text-sm font-medium">Nenhum horário cadastrado no momento.</p>
                <p className="text-xs text-neutral-500 mt-1">Volte em breve ou mande uma mensagem direta no WhatsApp.</p>
              </div>
            ) : (
              <>
                <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                  {uniqueDates.map((dateStr) => {
                    const countForDate = slots.filter((s) => s.date === dateStr && s.status === 'available').length;
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-md'
                            : 'glass-panel text-neutral-300 border-amber-500/20 hover:border-amber-400/40'
                        }`}
                      >
                        <span>{formatDateLabel(dateStr)}</span>
                        {countForDate > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isSelected ? 'bg-black text-amber-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {countForDate}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {slotsForSelectedDate.map((slot) => {
                    const isAvailable = slot.status === 'available';
                    const isPending = slot.status === 'pending';
                    const isBooked = slot.status === 'booked';

                    return (
                      <div
                        key={slot.id}
                        onClick={() => isAvailable && handleOpenBooking(slot)}
                        className={`p-3.5 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-center space-y-1.5 ${
                          isAvailable
                            ? 'glass-card border-emerald-500/30 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/40 cursor-pointer group'
                            : isPending
                            ? 'glass-panel border-amber-500/30 opacity-80 cursor-not-allowed bg-amber-950/20'
                            : 'glass-panel border-red-500/20 opacity-50 cursor-not-allowed bg-red-950/10'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-4 h-4 ${
                            isAvailable ? 'text-emerald-400 group-hover:scale-110' : isPending ? 'text-amber-400' : 'text-neutral-500'
                          } transition-transform`} />
                          <span className="font-mono text-base font-bold text-white">
                            {slot.time}
                          </span>
                        </div>

                        <div className="text-[11px] font-medium tracking-wide">
                          {isAvailable && (
                            <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                              Disponível <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                          {isPending && (
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              Aguardando Confirmação
                            </span>
                          )}
                          {isBooked && (
                            <span className="text-neutral-500 flex items-center gap-1">
                              Preenchido
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center space-y-2">
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mx-auto"></div>
          <p className="text-neutral-500 text-xs">
            © {currentYear} Dra. Thaysa Meschiatti • CRO ES 11914
          </p>
          <div className="pt-1">
            <Link
              href="/admin"
              className="text-neutral-600 hover:text-amber-400 text-[11px] transition-colors font-mono tracking-wider uppercase inline-flex items-center gap-1"
            >
              <Lock className="w-3 h-3" /> Painel Admin
            </Link>
          </div>
        </footer>

      </main>

      {/* BOOKING MODAL */}
      {bookingModalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-amber-500/40 p-6 space-y-5 shadow-2xl relative">
            
            <button
              onClick={() => setBookingModalSlot(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5" /> Pré-Agendamento
              </div>
              <h2 className="serif-title text-xl font-bold text-white">
                Solicitar Horário
              </h2>
              <p className="text-xs text-neutral-400">
                Preencha os dados abaixo para reservar seu horário com a Dra. Thaysa.
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-amber-200/80 uppercase font-semibold">Data & Horário</p>
                  <p className="text-sm font-bold text-white font-mono">
                    {formatDateLabel(bookingModalSlot.date)} às {bookingModalSlot.time}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-semibold border border-emerald-500/30">
                Reservado para você
              </span>
            </div>

            {/* CONFIRMATION / REDIRECT DISPLAY */}
            {bookingSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Horário Reservado com Sucesso!</h3>
                  <p className="text-xs text-neutral-300 max-w-xs mx-auto leading-relaxed">
                    Sua pré-reserva foi registrada. O último passo é enviar os dados pelo WhatsApp para a Dra. Thaysa confirmar!
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/90 border border-amber-500/20 text-xs text-amber-300 font-mono flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Redirecionando automaticamente em <b>{redirectCountdown}</b> segundos...</span>
                </div>

                <a
                  href={whatsappRedirectUrl}
                  onClick={handleManualRedirect}
                  className="w-full py-3.5 px-4 rounded-xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition shadow-lg text-center"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Enviar Mensagem no WhatsApp da Dra. Thaysa</span>
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" /> Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Silva"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-neutral-900/90 border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> Seu WhatsApp com DDD *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(27) 99612-1643"
                    value={patientPhone}
                    onChange={handlePhoneInputChange}
                    className={`w-full bg-neutral-900/90 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition ${
                      phoneError ? 'border-red-500 focus:border-red-400' : 'border-amber-500/20 focus:border-amber-400'
                    }`}
                  />
                  {phoneError && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1 pt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{phoneError}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Procedimento de Interesse
                  </label>
                  <select
                    value={procedure}
                    onChange={(e) => setProcedure(e.target.value)}
                    className="w-full bg-neutral-900/90 border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition"
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
                  <label className="text-xs font-semibold text-neutral-300">
                    Observações ou Dúvidas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Prefiro atendimento no período da manhã..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-neutral-900/90 border border-amber-500/20 rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition shadow-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Reservando...' : 'Confirmar & Enviar no WhatsApp'}</span>
                </button>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
