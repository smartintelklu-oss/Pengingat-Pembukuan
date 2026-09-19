export type PriorityLevel = 'low' | 'medium' | 'high';

export type AppTab = 'home' | 'reminders' | 'bookkeeping' | 'whatsapp' | 'settings' | 'login';

export type ReminderTiming = 
  | '0' // on time
  | '5' // 5 mins before
  | '15' // 15 mins before
  | '30' // 30 mins before
  | '60' // 1 hour before
  | '120' // 2 hours before
  | '1440' // 1 day before
  | 'custom';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ReminderTask {
  id: string;
  title: string;
  note: string;
  category: string; // e.g. 'Pekerjaan', 'Pribadi', 'Usaha', 'Ibadah', 'Keluarga'
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  reminderOffsetMinutes: number; // minutes before due date/time to alert
  reminderDateTime: string; // calculated ISO string of when reminder triggers
  recurrence: RecurrenceType;
  priority: PriorityLevel;
  completed: boolean;
  
  // WhatsApp Integration
  whatsappNumber?: string; // Target phone number (e.g. 628123456789)
  whatsappAutoSend: boolean; // Flag to auto-prompt or prepare WhatsApp dispatch
  whatsappCustomMessage?: string; // Optional custom message template

  // AI Voice Reminder
  aiVoiceScript?: string; // Generated spoken reminder text
  aiVoiceTone: 'friendly' | 'professional' | 'urgent' | 'cheerful';

  // Notification status
  notified: boolean;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  ledgerId: string; // e.g. 'ledger-usaha', 'ledger-pribadi'
  type: TransactionType;
  category: string;
  amount: number;
  title: string;
  note?: string;
  date: string; // YYYY-MM-DD
  paymentMethod: 'Tunai' | 'Transfer Bank' | 'E-Wallet' | 'QRIS' | 'Kartu';
  createdAt: string;
}

export interface LedgerBook {
  id: string;
  name: string; // 'Usaha', 'Pribadi', etc.
  description: string;
  color: string; // Tailwind color or hex
  icon: string; // Lucide icon name
  createdAt: string;
}

export interface AiFinancialInsight {
  summary: string;
  healthStatus: 'Sangat Sehat' | 'Cukup Sehat' | 'Waspada Defisit' | 'Perlu Penataan';
  keyObservation: string;
  tips: string[];
  source?: string;
}

export type WhatsAppTextType = 
  | 'pengingat' // Pengingat Agenda / Janji Temu
  | 'tagihan' // Tagihan / Pembayaran
  | 'ucapan' // Ucapan Selamat / Hari Spesial
  | 'laporan' // Laporan / Rekap Informasi
  | 'kustom'; // Pesan Kustom Bebas

export interface ScheduledWhatsApp {
  id: string;
  recipientName: string; // Nama Penerima
  whatsappNumber: string; // Nomor WhatsApp (e.g. 08123456789 atau 628123456789)
  textType: WhatsAppTextType; // Jenis teks
  messageContent: string; // Isi teks pesan
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  scheduledDateTime: string; // ISO string untuk pembandingan waktu
  recurrence: RecurrenceType; // 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  status: 'pending' | 'sent' | 'cancelled';
  lastSentAt?: string;
  createdAt: string;
}

export type UserRole = 'owner' | 'staff';

export interface AppUser {
  id: string;
  email?: string;
  displayName: string;
  photoURL?: string;
  role?: UserRole; // 'owner' (Pemilik) atau 'staff' (Staf)
  pin?: string; // Optional 4-6 digit PIN for quick credential protection
  isCloudUser: boolean; // true if authenticated with Firebase Google/Email, false if local offline profile
  createdAt: string;
}


