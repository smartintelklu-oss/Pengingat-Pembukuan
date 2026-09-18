import { ReminderTask, Transaction, LedgerBook, ScheduledWhatsApp } from '../types';

const STORAGE_KEYS = {
  REMINDERS: 'catatan_reminders_v1',
  LEDGERS: 'catatan_ledgers_v1',
  TRANSACTIONS: 'catatan_transactions_v1',
  ACTIVE_LEDGER: 'catatan_active_ledger_v1',
  SCHEDULED_WHATSAPP: 'catatan_scheduled_whatsapp_v1',
};

// Default starter ledgers as requested: Usaha & Pribadi
export const DEFAULT_LEDGERS: LedgerBook[] = [
  {
    id: 'ledger-usaha',
    name: 'Usaha (Bisnis & Toko)',
    description: 'Catatan arus kas operasional bisnis, penjualan, dan pembelian bahan',
    color: 'emerald',
    icon: 'Store',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ledger-pribadi',
    name: 'Keuangan Pribadi',
    description: 'Catatan pemasukan gaji, tabungan, dan pengeluaran kebutuhan sehari-hari',
    color: 'indigo',
    icon: 'User',
    createdAt: new Date().toISOString(),
  },
];

// Helper to get formatted dates relative to today
const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d;
};

// Starter sample reminders
export const DEFAULT_REMINDERS: ReminderTask[] = [
  {
    id: 'rem-1',
    title: 'Meeting Evaluasi Penjualan Bulanan',
    note: 'Siapkan laporan rekapitulasi omset, evaluasi stok menipis, dan target promosi minggu depan dengan tim.',
    category: 'Usaha',
    dueDate: formatDate(today),
    dueTime: '14:00',
    reminderOffsetMinutes: 15,
    reminderDateTime: new Date(new Date(`${formatDate(today)}T14:00`).getTime() - 15 * 60000).toISOString(),
    recurrence: 'weekly',
    priority: 'high',
    completed: false,
    whatsappNumber: '081234567890',
    whatsappAutoSend: true,
    whatsappCustomMessage: '',
    aiVoiceScript: 'Halo! Jangan lupa ada Meeting Evaluasi Penjualan Bulanan hari ini pukul dua siang. Siapkan laporan rekapitulasi omset dan evaluasi stok tim Anda. Sukses untuk meetingnya!',
    aiVoiceTone: 'professional',
    notified: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-2',
    title: 'Bayar Tagihan Listrik & Internet Kantor',
    note: 'Cek nomor pelanggan PLN pascabayar dan Indihome via mobile banking sebelum jatuh tempo.',
    category: 'Usaha',
    dueDate: formatDate(addDays(1)),
    dueTime: '10:00',
    reminderOffsetMinutes: 30,
    reminderDateTime: new Date(new Date(`${formatDate(addDays(1))}T10:00`).getTime() - 30 * 60000).toISOString(),
    recurrence: 'monthly',
    priority: 'medium',
    completed: false,
    whatsappNumber: '',
    whatsappAutoSend: false,
    whatsappCustomMessage: '',
    aiVoiceScript: 'Selamat pagi! Ini pengingat untuk membayar tagihan listrik dan internet kantor sebelum batas jatuh tempo. Pastikan pembayaran telah terverifikasi ya.',
    aiVoiceTone: 'friendly',
    notified: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-3',
    title: 'Restock Bahan Baku Supplier Utama',
    note: 'Pesan tepung, mentega, dan kemasan box kardus ukuran sedang 200 pcs.',
    category: 'Pekerjaan',
    dueDate: formatDate(addDays(2)),
    dueTime: '09:00',
    reminderOffsetMinutes: 60,
    reminderDateTime: new Date(new Date(`${formatDate(addDays(2))}T09:00`).getTime() - 60 * 60000).toISOString(),
    recurrence: 'none',
    priority: 'high',
    completed: false,
    whatsappNumber: '081987654321',
    whatsappAutoSend: true,
    whatsappCustomMessage: 'Halo Supplier, mengingatkan kembali untuk konfirmasi pengiriman bahan baku tepung dan mentega ke gudang kami besok pagi. Terima kasih.',
    aiVoiceScript: 'Perhatian, pengingat restock bahan baku supplier utama dijadwalkan pukul sembilan pagi. Harap cek daftar pesanan agar stok gudang tetap aman.',
    aiVoiceTone: 'urgent',
    notified: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-4',
    title: 'Transfer Alokasi Tabungan & Investasi',
    note: 'Sisihkan 20% dari penghasilan ke instrumen reksadana dan tabungan darurat.',
    category: 'Pribadi',
    dueDate: formatDate(addDays(4)),
    dueTime: '17:30',
    reminderOffsetMinutes: 0,
    reminderDateTime: new Date(`${formatDate(addDays(4))}T17:30`).toISOString(),
    recurrence: 'monthly',
    priority: 'medium',
    completed: false,
    whatsappNumber: '',
    whatsappAutoSend: false,
    aiVoiceScript: 'Halo! Waktunya menyisihkan alokasi tabungan dan investasi bulanan Anda untuk mencapai kebebasan finansial. Luar biasa disiplinnya!',
    aiVoiceTone: 'cheerful',
    notified: false,
    createdAt: new Date().toISOString(),
  }
];

// Starter sample transactions for Usaha & Pribadi
export const DEFAULT_TRANSACTIONS: Transaction[] = [
  // Usaha (Bisnis & Toko)
  {
    id: 'tx-u1',
    ledgerId: 'ledger-usaha',
    type: 'income',
    category: 'Penjualan Produk',
    amount: 3850000,
    title: 'Penjualan Paket Promo Akhir Pekan',
    note: 'Pesanan order 35 paket online via marketplace & WhatsApp',
    date: formatDate(today),
    paymentMethod: 'QRIS',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-u2',
    ledgerId: 'ledger-usaha',
    type: 'income',
    category: 'Pendapatan Jasa',
    amount: 1500000,
    title: 'Jasa Desain Kemasan Klien',
    note: 'Pelunasan invoice termin 2 proyek branding packaging',
    date: formatDate(addDays(-1)),
    paymentMethod: 'Transfer Bank',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-u3',
    ledgerId: 'ledger-usaha',
    type: 'expense',
    category: 'Bahan Baku & Stok',
    amount: 1420000,
    title: 'Beli Bahan Baku & Packaging Kemasan',
    note: 'Tepung 5 sak, dus box 200 pcs, stiker logo',
    date: formatDate(addDays(-1)),
    paymentMethod: 'Transfer Bank',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-u4',
    ledgerId: 'ledger-usaha',
    type: 'expense',
    category: 'Biaya Operasional',
    amount: 350000,
    title: 'Bensin & Ongkos Kurir Pengiriman',
    note: 'Pengiriman pesanan sameday dalam kota 14 titik',
    date: formatDate(today),
    paymentMethod: 'Tunai',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-u5',
    ledgerId: 'ledger-usaha',
    type: 'expense',
    category: 'Promosi & Iklan',
    amount: 450000,
    title: 'Top up Saldo Iklan Media Sosial',
    note: 'Target kampanye produk baru 3 hari',
    date: formatDate(addDays(-3)),
    paymentMethod: 'E-Wallet',
    createdAt: new Date().toISOString(),
  },

  // Pribadi
  {
    id: 'tx-p1',
    ledgerId: 'ledger-pribadi',
    type: 'income',
    category: 'Gaji & Pendapatan',
    amount: 7500000,
    title: 'Penerimaan Gaji Bulanan',
    note: 'Payroll bulan berjalan',
    date: formatDate(addDays(-4)),
    paymentMethod: 'Transfer Bank',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-p2',
    ledgerId: 'ledger-pribadi',
    type: 'expense',
    category: 'Makan & Konsumsi',
    amount: 125000,
    title: 'Makan Siang & Kopi Keluarga',
    note: 'Makan bersama di akhir pekan',
    date: formatDate(today),
    paymentMethod: 'QRIS',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-p3',
    ledgerId: 'ledger-pribadi',
    type: 'expense',
    category: 'Kebutuhan Rumah',
    amount: 850000,
    title: 'Belanja Bulanan Supermarket',
    note: 'Sembako, minyak goreng, sabun, dan kebutuhan dapur',
    date: formatDate(addDays(-2)),
    paymentMethod: 'Kartu',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-p4',
    ledgerId: 'ledger-pribadi',
    type: 'expense',
    category: 'Transportasi',
    amount: 200000,
    title: 'Beli Saldo E-Toll & Bensin Motor',
    note: 'Transportasi kerja harian',
    date: formatDate(addDays(-3)),
    paymentMethod: 'E-Wallet',
    createdAt: new Date().toISOString(),
  },
];

export function loadReminders(): ReminderTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(DEFAULT_REMINDERS));
      return DEFAULT_REMINDERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading reminders:', e);
    return DEFAULT_REMINDERS;
  }
}

export function saveReminders(reminders: ReminderTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  } catch (e) {
    console.error('Error saving reminders:', e);
  }
}

export function loadLedgers(): LedgerBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEDGERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LEDGERS, JSON.stringify(DEFAULT_LEDGERS));
      return DEFAULT_LEDGERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading ledgers:', e);
    return DEFAULT_LEDGERS;
  }
}

export function saveLedgers(ledgers: LedgerBook[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LEDGERS, JSON.stringify(ledgers));
  } catch (e) {
    console.error('Error saving ledgers:', e);
  }
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
      return DEFAULT_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading transactions:', e);
    return DEFAULT_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving transactions:', e);
  }
}

export function loadActiveLedgerId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_LEDGER) || 'ledger-usaha';
  } catch {
    return 'ledger-usaha';
  }
}

export function saveActiveLedgerId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_LEDGER, id);
  } catch (e) {
    console.error('Error saving active ledger:', e);
  }
}

// Starter sample scheduled WhatsApp messages
export const DEFAULT_SCHEDULED_WHATSAPP: ScheduledWhatsApp[] = [
  {
    id: 'swa-1',
    recipientName: 'Budi Santoso (Mitra Toko)',
    whatsappNumber: '081234567890',
    textType: 'pengingat',
    messageContent: `Halo Budi Santoso,\n\nMengingatkan kembali terkait agenda pertemuan evaluasi kerja sama dan restock barang besok pagi pukul 10:00 WIB. Mohon disiapkan berkas yang diperlukan ya.\n\nTerima kasih banyak! 🙏`,
    scheduledDate: formatDate(today),
    scheduledTime: '14:30',
    scheduledDateTime: new Date(`${formatDate(today)}T14:30`).toISOString(),
    recurrence: 'weekly',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'swa-2',
    recipientName: 'Ibu Rahayu (Pelanggan Grosir)',
    whatsappNumber: '081987654321',
    textType: 'tagihan',
    messageContent: `Yth. Ibu Rahayu,\n\nSemoga Ibu selalu sehat berkah. Mengingatkan kembali bahwa invoice transaksi pembelian grosir periode ini telah mendekati tanggal jatuh tempo.\n\nBila sudah melakukan pembayaran, mohon abaikan pesan ini. Terima kasih banyak atas kemitraannya! 💳✨`,
    scheduledDate: formatDate(addDays(1)),
    scheduledTime: '09:00',
    scheduledDateTime: new Date(`${formatDate(addDays(1))}T09:00`).toISOString(),
    recurrence: 'monthly',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'swa-3',
    recipientName: 'Ahmad Fauzi (Keluarga/Ulang Tahun)',
    whatsappNumber: '082199887766',
    textType: 'ucapan',
    messageContent: `Selamat Ulang Tahun untuk Ahmad Fauzi! 🎉🎂\n\nSemoga panjang umur, senantiasa diberikan kesehatan, berkah rizki, dan segala hajat dikabulkan dengan mudah. Sukses selalu untuk karier dan usahanya! ✨💐`,
    scheduledDate: formatDate(addDays(3)),
    scheduledTime: '08:00',
    scheduledDateTime: new Date(`${formatDate(addDays(3))}T08:00`).toISOString(),
    recurrence: 'yearly',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

export function loadScheduledWhatsApp(): ScheduledWhatsApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULED_WHATSAPP);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULED_WHATSAPP, JSON.stringify(DEFAULT_SCHEDULED_WHATSAPP));
      return DEFAULT_SCHEDULED_WHATSAPP;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading scheduled WhatsApp:', e);
    return DEFAULT_SCHEDULED_WHATSAPP;
  }
}

export function saveScheduledWhatsApp(items: ScheduledWhatsApp[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULED_WHATSAPP, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving scheduled WhatsApp:', e);
  }
}

