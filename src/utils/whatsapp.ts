import { ReminderTask, ScheduledWhatsApp, RecurrenceType, WhatsAppTextType } from '../types';

/**
 * Cleans phone number to standard international format without '+' (e.g., 628123456789)
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Friendly display format for phone number: +62 812-3456-7890
 */
export function displayPhoneNumber(phone: string): string {
  const formatted = formatPhoneNumber(phone);
  if (!formatted) return '-';
  if (formatted.startsWith('62') && formatted.length >= 10) {
    const rest = formatted.slice(2);
    if (rest.length <= 4) return `+62 ${rest}`;
    if (rest.length <= 8) return `+62 ${rest.slice(0, 3)}-${rest.slice(3)}`;
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  return phone;
}

/**
 * Pre-made friendly templates for each Jenis Teks
 */
export const WHATSAPP_TEXT_TEMPLATES: Record<WhatsAppTextType, { label: string; sample: (name: string) => string }> = {
  pengingat: {
    label: 'Pengingat Agenda & Tugas',
    sample: (name) => 
`Halo ${name || 'Bapak/Ibu'}, 

Mengingatkan kembali terkait agenda pertemuan/kegiatan yang telah dijadwalkan. Mohon kesediaannya untuk mempersiapkan hal-hal yang diperlukan ya. 

Terima kasih banyak! 🙏`,
  },
  tagihan: {
    label: 'Pengingat Tagihan & Pembayaran',
    sample: (name) => 
`Yth. ${name || 'Pelanggan'},

Semoga Anda selalu sehat. Mengingatkan kembali bahwa tagihan invoice pembayaran Anda telah mendekati tanggal jatuh tempo.

Bila telah melakukan pembayaran, mohon abaikan pesan ini. Terima kasih atas kerja sama dan kepercayaannya! 💳✨`,
  },
  ucapan: {
    label: 'Ucapan Selamat & Hari Spesial',
    sample: (name) => 
`Selamat Hari Spesial untuk ${name || 'Sahabat'}! 🎉🎂

Semoga senantiasa diberikan kesehatan, kebahagiaan yang berlimpah, rezeki yang berkah, serta segala impian dapat terwujud dengan indah. 

Salam hangat dari kami! ✨💐`,
  },
  laporan: {
    label: 'Laporan & Rekap Informasi',
    sample: (name) => 
`Halo ${name || 'Rekan'},

Berikut adalah ringkasan laporan dan catatan pembaruan operasional untuk periode berjalan. Seluruh data telah tercatat dengan rapi.

Silakan periksa dan beri kabar apabila ada hal yang perlu didiskusikan lebih lanjut. Terima kasih! 📊`,
  },
  kustom: {
    label: 'Pesan Bebas / Kustom',
    sample: (name) => 
`Halo ${name || 'Kak'},

Semoga harimu menyenangkan. Berikut ada pesan penting yang ingin kami sampaikan:

(Tuliskan pesan Anda di sini)`,
  },
};

/**
 * Calculates the next recurrence date given a base YYYY-MM-DD string
 */
export function getNextRecurrenceDate(dateStr: string, recurrence: RecurrenceType): string {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);

  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return dateStr;
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generates WhatsApp Web / App intent link for ScheduledWhatsApp item
 */
export function generateScheduledWhatsAppLink(item: ScheduledWhatsApp): string {
  const phone = formatPhoneNumber(item.whatsappNumber);
  const encoded = encodeURIComponent(item.messageContent);

  if (phone) {
    return `https://wa.me/${phone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Opens WhatsApp in a new tab safely for ScheduledWhatsApp
 */
export function sendScheduledWhatsApp(item: ScheduledWhatsApp) {
  const url = generateScheduledWhatsAppLink(item);
  window.open(url, '_blank', 'noopener,noreferrer');
}


/**
 * Builds a structured, friendly Indonesian WhatsApp message template for a task/agenda
 */
export function formatWhatsAppMessage(task: ReminderTask): string {
  if (task.whatsappCustomMessage && task.whatsappCustomMessage.trim().length > 0) {
    return task.whatsappCustomMessage;
  }

  const priorityBadge = 
    task.priority === 'high' ? '🔴 MENDESAK / TINGGI' :
    task.priority === 'medium' ? '🟡 SEDANG' : '🟢 NORMAL';

  const dateFormatted = new Date(`${task.dueDate}T${task.dueTime}`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `🔔 *PENGINGAT AGENDA / TUGAS* 🔔
-----------------------------------------
📌 *Judul:* ${task.title}
📂 *Kategori:* ${task.category}
⚡ *Prioritas:* ${priorityBadge}
📅 *Jadwal:* ${dateFormatted}
⏰ *Waktu:* ${task.dueTime} WIB

📝 *Preview Catatan:*
${task.note ? `"${task.note}"` : '(Tidak ada rincian tambahan)'}

${task.recurrence !== 'none' ? `🔄 *Pengulangan:* ${task.recurrence === 'daily' ? 'Setiap Hari' : task.recurrence === 'weekly' ? 'Setiap Minggu' : task.recurrence === 'monthly' ? 'Setiap Bulan' : 'Setiap Tahun'}\n` : ''}
-----------------------------------------
_Pesan pengingat otomatis dibuat dari Aplikasi Catatan & Pembukuan._`;
}

/**
 * Generates WhatsApp Web / App intent link
 */
export function generateWhatsAppLink(task: ReminderTask): string {
  const message = formatWhatsAppMessage(task);
  const encoded = encodeURIComponent(message);
  const phone = task.whatsappNumber ? formatPhoneNumber(task.whatsappNumber) : '';

  if (phone) {
    return `https://wa.me/${phone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Opens WhatsApp in a new tab safely
 */
export function sendWhatsAppMessage(task: ReminderTask) {
  const url = generateWhatsAppLink(task);
  window.open(url, '_blank', 'noopener,noreferrer');
}
