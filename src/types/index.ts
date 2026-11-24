export interface ProfileConfig {
  name: string;
  title: string;
  cro: string;
  bio: string;
  avatarUrl: string;
  logoUrl: string;
  whatsappNumber: string;
  whatsappFormatted: string;
  email: string;
  instagramHandle: string;
  instagramUrl: string;
  articleUrl: string;
  theme: 'gold-obsidian' | 'rose-pearl' | 'emerald-clean' | 'modern-dark';
}

export interface LinkItem {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  iconName: string;
  badge?: string;
  isActive: boolean;
  order: number;
  clicks: number;
}

export type SlotStatus = 'available' | 'pending' | 'booked';

export interface BookingRequest {
  id: string;
  slotId: string;
  date: string;
  time: string;
  patientName: string;
  patientPhone: string;
  procedure: string;
  notes?: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: SlotStatus;
  booking?: BookingRequest;
}

export interface UserAccount {
  username: string;
  role: 'dentist' | 'admin';
  name: string;
  passwordHash: string;
}

export interface AppData {
  profile: ProfileConfig;
  links: LinkItem[];
  slots: TimeSlot[];
  bookings: BookingRequest[];
  users: UserAccount[];
}
