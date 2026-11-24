import fs from 'fs';
import path from 'path';
import { AppData, BookingRequest, LinkItem, ProfileConfig, TimeSlot } from '@/types';
import { initialData } from '@/data/initialData';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

// In-memory cache for serverless environments
let memoryDb: AppData | null = null;

export function getAppData(): AppData {
  if (memoryDb) {
    return memoryDb;
  }

  try {
    if (fs.existsSync(DB_PATH)) {
      const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
      memoryDb = JSON.parse(fileContent);
      return memoryDb!;
    }
  } catch (error) {
    console.warn('Could not read db.json, falling back to initialData:', error);
  }

  memoryDb = JSON.parse(JSON.stringify(initialData));
  saveAppData(memoryDb!);
  return memoryDb!;
}

export function saveAppData(data: AppData): boolean {
  memoryDb = data;
  try {
    const dirPath = path.dirname(DB_PATH);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.warn('Writing db.json to filesystem failed (normal on Vercel read-only system):', error);
    return false;
  }
}

export function updateProfile(newProfile: Partial<ProfileConfig>): ProfileConfig {
  const data = getAppData();
  data.profile = { ...data.profile, ...newProfile };
  saveAppData(data);
  return data.profile;
}

export function updateLinks(links: LinkItem[]): LinkItem[] {
  const data = getAppData();
  data.links = links;
  saveAppData(data);
  return data.links;
}

export function updateSlots(slots: TimeSlot[]): TimeSlot[] {
  const data = getAppData();
  data.slots = slots;
  saveAppData(data);
  return data.slots;
}

export function createBooking(request: Omit<BookingRequest, 'id' | 'createdAt' | 'status'>): { booking: BookingRequest; slot: TimeSlot } | null {
  const data = getAppData();
  const slotIndex = data.slots.findIndex((s) => s.id === request.slotId);

  if (slotIndex === -1) {
    return null;
  }

  const newBooking: BookingRequest = {
    ...request,
    id: `booking-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  data.slots[slotIndex].status = 'pending';
  data.slots[slotIndex].booking = newBooking;
  data.bookings.unshift(newBooking);

  saveAppData(data);
  return { booking: newBooking, slot: data.slots[slotIndex] };
}

export function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled' | 'completed'): boolean {
  const data = getAppData();
  const bookingIndex = data.bookings.findIndex((b) => b.id === bookingId);
  if (bookingIndex === -1) return false;

  data.bookings[bookingIndex].status = status;

  const slotIndex = data.slots.findIndex((s) => s.id === data.bookings[bookingIndex].slotId);
  if (slotIndex !== -1) {
    if (status === 'confirmed') {
      data.slots[slotIndex].status = 'booked';
    } else if (status === 'cancelled' || status === 'completed') {
      data.slots[slotIndex].status = 'available';
      delete data.slots[slotIndex].booking;
    }
  }

  saveAppData(data);
  return true;
}

export function createManualBooking(params: {
  date: string;
  time: string;
  slotId?: string;
  patientName: string;
  patientPhone: string;
  procedure: string;
  notes?: string;
  status?: 'confirmed' | 'pending';
}): { booking: BookingRequest; slot: TimeSlot } {
  const data = getAppData();
  let slotIndex = -1;

  if (params.slotId) {
    slotIndex = data.slots.findIndex((s) => s.id === params.slotId);
  }

  if (slotIndex === -1) {
    slotIndex = data.slots.findIndex((s) => s.date === params.date && s.time === params.time);
  }

  let targetSlot: TimeSlot;
  if (slotIndex === -1) {
    targetSlot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: params.date,
      time: params.time,
      status: params.status === 'pending' ? 'pending' : 'booked',
    };
    data.slots.push(targetSlot);
    data.slots.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
    slotIndex = data.slots.findIndex((s) => s.id === targetSlot.id);
  } else {
    targetSlot = data.slots[slotIndex];
  }

  const bookingStatus = params.status || 'confirmed';

  const newBooking: BookingRequest = {
    id: `booking-${Date.now()}`,
    slotId: targetSlot.id,
    date: params.date,
    time: params.time,
    patientName: params.patientName,
    patientPhone: params.patientPhone,
    procedure: params.procedure,
    notes: params.notes,
    createdAt: new Date().toISOString(),
    status: bookingStatus,
  };

  data.slots[slotIndex].status = bookingStatus === 'confirmed' ? 'booked' : 'pending';
  data.slots[slotIndex].booking = newBooking;
  data.bookings.unshift(newBooking);

  saveAppData(data);
  return { booking: newBooking, slot: data.slots[slotIndex] };
}

export function deleteBooking(bookingId: string): boolean {
  const data = getAppData();
  const index = data.bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) return false;
  const booking = data.bookings[index];
  data.bookings.splice(index, 1);
  const slot = data.slots.find((s) => s.id === booking.slotId);
  if (slot && slot.booking?.id === bookingId) {
    slot.status = 'available';
    delete slot.booking;
  }
  saveAppData(data);
  return true;
}
