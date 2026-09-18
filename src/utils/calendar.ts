import { ReminderTask } from '../types';

/**
 * Formats a Date object to iCalendar ISO string (YYYYMMDDTHHmmssZ)
 */
function toICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Creates and downloads an .ics (iCalendar) file for Apple Calendar, Google Calendar, Outlook, etc.
 */
export function downloadICSFile(task: ReminderTask) {
  const startDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
  // Default end time: 1 hour after start
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Catatan Pengingat & Pembukuan//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:task-${task.id}@catatan-app`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(startDateTime)}`,
    `DTEND:${toICSDate(endDateTime)}`,
    `SUMMARY:${task.title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${(task.note || '').replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
    `CATEGORIES:${task.category}`,
    `STATUS:${task.completed ? 'COMPLETED' : 'CONFIRMED'}`,
    task.reminderOffsetMinutes > 0 ? [
      'BEGIN:VALARM',
      `TRIGGER:-PT${task.reminderOffsetMinutes}M`,
      'ACTION:DISPLAY',
      `DESCRIPTION:Pengingat untuk ${task.title}`,
      'END:VALARM'
    ].join('\r\n') : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${task.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a direct Google Calendar Add Event URL
 */
export function getGoogleCalendarUrl(task: ReminderTask): string {
  const startDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  const formatGCal = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dates = `${formatGCal(startDateTime)}/${formatGCal(endDateTime)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: task.title,
    dates: dates,
    details: `${task.note || ''}\n\nKategori: ${task.category}\nPrioritas: ${task.priority}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
