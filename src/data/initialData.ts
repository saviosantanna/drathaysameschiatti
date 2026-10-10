import { AppData } from '@/types';

const getFormattedDateStr = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

export const initialData: AppData = {
  profile: {
    name: 'Dra. Thaysa Meschiatti',
    title: 'Cirurgiã-Dentista',
    cro: 'CRO ES 11914',
    bio: 'Transformando sorrisos com excelência, estética e cuidado humanizado. Agende seu atendimento prévio abaixo.',
    avatarUrl: '/logo-1.jpeg',
    logoUrl: '/logo-2.jpeg',
    whatsappNumber: '5527996121643',
    whatsappFormatted: '(27) 99612-1643',
    email: 'thaysameschiattisantos100@gmail.com',
    instagramHandle: '@thaysameschiatti',
    instagramUrl: 'https://www.instagram.com/thaysameschiatti',
    articleUrl: 'https://ojs.brazilianjournals.com.br/ojs/index.php/BJHR/article/view/72949/51075',
    theme: 'gold-obsidian',
  },
  links: [
    {
      id: 'link-whatsapp',
      title: 'Falar no WhatsApp Direto',
      subtitle: 'Tire dúvidas ou solicite informações',
      url: 'https://wa.me/5527996121643?text=Ol%C3%A1%20Dra.%20Thaysa!%20Vim%20pelo%20seu%20link%20do%20Instagram.',
      iconName: 'MessageCircle',
      badge: 'RÁPIDO',
      isActive: true,
      order: 1,
      clicks: 42,
    },
    {
      id: 'link-artigo',
      title: 'Artigo Científico Publicado',
      subtitle: 'Leia a publicação acadêmica da Dra. Thaysa',
      url: 'https://ojs.brazilianjournals.com.br/ojs/index.php/BJHR/article/view/72949/51075',
      iconName: 'FileText',
      badge: 'DESTAQUE',
      isActive: true,
      order: 2,
      clicks: 18,
    },
    {
      id: 'link-instagram',
      title: 'Instagram Profissional',
      subtitle: 'Acompanhe dicas, casos e bastidores',
      url: 'https://www.instagram.com/thaysameschiatti',
      iconName: 'Instagram',
      isActive: true,
      order: 3,
      clicks: 65,
    },
  ],
  slots: [
    {
      id: 'slot-1',
      date: getFormattedDateStr(0),
      time: '09:00',
      status: 'available',
    },
    {
      id: 'slot-2',
      date: getFormattedDateStr(0),
      time: '10:30',
      status: 'available',
    },
    {
      id: 'slot-3',
      date: getFormattedDateStr(0),
      time: '14:00',
      status: 'available',
    },
    {
      id: 'slot-4',
      date: getFormattedDateStr(0),
      time: '15:30',
      status: 'available',
    },
    {
      id: 'slot-5',
      date: getFormattedDateStr(1),
      time: '08:30',
      status: 'available',
    },
    {
      id: 'slot-6',
      date: getFormattedDateStr(1),
      time: '10:00',
      status: 'available',
    },
    {
      id: 'slot-7',
      date: getFormattedDateStr(1),
      time: '14:30',
      status: 'available',
    },
    {
      id: 'slot-8',
      date: getFormattedDateStr(2),
      time: '09:00',
      status: 'available',
    },
    {
      id: 'slot-9',
      date: getFormattedDateStr(2),
      time: '11:00',
      status: 'available',
    },
    {
      id: 'slot-10',
      date: getFormattedDateStr(2),
      time: '16:00',
      status: 'available',
    },
  ],
  bookings: [],
  users: [
    {
      username: 'thaysa',
      name: 'Dra. Thaysa Meschiatti',
      role: 'dentist',
      passwordHash: 'Thay5A#2026',
    },
    {
      username: 'admin',
      name: 'Administrador Master',
      role: 'admin',
      passwordHash: 'Admin#Thaysa2026',
    },
  ],
};
