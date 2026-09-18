import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Share2, 
  Download, 
  MessageSquare, 
  Volume2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ReminderTask } from '../types';
import { downloadICSFile, getGoogleCalendarUrl } from '../utils/calendar';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { speakText, playNotificationChime } from '../utils/audio';

interface CalendarViewProps {
  tasks: ReminderTask[];
  onToggleComplete: (id: string) => void;
  onOpenReminderModal: (task?: ReminderTask) => void;
  onOpenVoiceModal: (task: ReminderTask) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onToggleComplete,
  onOpenReminderModal,
  onOpenVoiceModal,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  // Month metadata
  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Calendar matrix days
  const calendarDays: Array<{ dateStr: string; dayNumber: number; isCurrentMonth: boolean }> = [];
  
  // Previous month filler days
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dateStr, dayNumber: d, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dateStr, dayNumber: d, isCurrentMonth: true });
  }

  // Next month filler days to complete grid (42 cells = 6 rows)
  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 1 : month + 2;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dateStr, dayNumber: d, isCurrentMonth: false });
  }

  // Filter tasks for selected date
  const selectedDateTasks = tasks.filter(t => t.dueDate === selectedDateStr);

  const handleSpeak = async (task: ReminderTask) => {
    await playNotificationChime();
    speakText(task.aiVoiceScript || `Pengingat untuk ${task.title}. ${task.note}`, task.aiVoiceTone);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Calendar Grid Container */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        {/* Calendar Header Navigation */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 capitalize">
              {monthName}
            </h3>
            <button
              onClick={goToToday}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium"
            >
              Hari Ini
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Day Name Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
          <span>Min</span>
          <span>Sen</span>
          <span>Sel</span>
          <span>Rab</span>
          <span>Kam</span>
          <span>Jum</span>
          <span>Sab</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((item, idx) => {
            const isSelected = item.dateStr === selectedDateStr;
            const isToday = item.dateStr === new Date().toISOString().split('T')[0];
            const dayTasks = tasks.filter(t => t.dueDate === item.dateStr);
            const hasHighPriority = dayTasks.some(t => t.priority === 'high' && !t.completed);
            const allCompleted = dayTasks.length > 0 && dayTasks.every(t => t.completed);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDateStr(item.dateStr)}
                className={`min-h-[58px] p-1.5 rounded-xl text-left flex flex-col justify-between transition-all border ${
                  isSelected 
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20' 
                    : item.isCurrentMonth
                      ? 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-200'
                      : 'border-transparent bg-white text-slate-300 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-emerald-600 text-white font-bold'
                        : isSelected
                          ? 'text-emerald-900 font-bold'
                          : item.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                    }`}
                  >
                    {item.dayNumber}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-2xs font-bold px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Dot Indicators */}
                <div className="flex items-center space-x-1 mt-1">
                  {dayTasks.slice(0, 3).map((t, tIdx) => (
                    <span
                      key={tIdx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        t.completed
                          ? 'bg-slate-300'
                          : t.priority === 'high'
                            ? 'bg-rose-500'
                            : t.priority === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                      }`}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-3xs text-slate-400 leading-none">+</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Prioritas Tinggi</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Sedang</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Normal</span>
            </span>
          </div>
          <span className="text-slate-400 text-2xs">Klik tanggal untuk melihat rincian</span>
        </div>
      </div>

      {/* Selected Date Agenda Details */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Agenda Tanggal
            </h4>
            <p className="text-xs text-slate-500">
              {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={() => onOpenReminderModal()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
          >
            + Tambah Agenda
          </button>
        </div>

        {selectedDateTasks.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600">Tidak ada agenda pada tanggal ini</p>
            <p className="text-xs text-slate-400 mt-1">Klik tombol di atas untuk menjadwalkan tugas atau kegiatan baru.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {selectedDateTasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  task.completed
                    ? 'bg-slate-50/70 border-slate-200 opacity-75'
                    : task.priority === 'high'
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5">
                    <button
                      onClick={() => onToggleComplete(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                      title={task.completed ? "Tandai Belum Selesai" : "Tandai Selesai"}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          task.completed ? 'text-emerald-600 fill-emerald-50' : 'text-slate-300'
                        }`}
                      />
                    </button>
                    <div>
                      <h5
                        className={`text-sm font-bold ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h5>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500">
                        <span className="flex items-center text-emerald-700 font-medium">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {task.dueTime} WIB
                        </span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded text-2xs bg-slate-100 text-slate-600 font-medium">
                          {task.category}
                        </span>
                        {task.priority === 'high' && (
                          <span className="px-1.5 py-0.2 rounded text-2xs bg-rose-100 text-rose-700 font-semibold">
                            Mendesak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleSpeak(task)}
                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Dengarkan Suara AI"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {task.note && (
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                    {task.note}
                  </p>
                )}

                {/* Integration Buttons: WhatsApp, Google Calendar, .ICS */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => sendWhatsAppMessage(task)}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-2xs font-semibold transition-colors"
                      title="Kirim Pesan ke WhatsApp"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      WhatsApp
                    </button>
                    <a
                      href={getGoogleCalendarUrl(task)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-2xs font-semibold transition-colors"
                      title="Sinkronisasi ke Google Calendar"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Google Cal
                    </a>
                    <button
                      onClick={() => downloadICSFile(task)}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 text-2xs font-semibold transition-colors"
                      title="Unduh File .ICS"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      .ICS
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenVoiceModal(task)}
                    className="text-2xs font-medium text-emerald-600 hover:underline"
                  >
                    Naskah Suara AI
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
