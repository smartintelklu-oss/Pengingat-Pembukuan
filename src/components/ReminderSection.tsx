import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  ListFilter, 
  Clock, 
  MessageSquare, 
  Volume2, 
  CheckCircle2, 
  Share2, 
  Download, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Bell, 
  Repeat,
  AlertTriangle
} from 'lucide-react';
import { ReminderTask } from '../types';
import { CalendarView } from './CalendarView';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { downloadICSFile, getGoogleCalendarUrl } from '../utils/calendar';
import { speakText, playNotificationChime } from '../utils/audio';

interface ReminderSectionProps {
  tasks: ReminderTask[];
  onAddTask: () => void;
  onEditTask: (task: ReminderTask) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onOpenVoiceModal: (task: ReminderTask) => void;
}

export const ReminderSection: React.FC<ReminderSectionProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  onOpenVoiceModal,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed'>('all');

  // Compute stats
  const totalTasks = tasks.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasksCount = tasks.filter(t => t.dueDate === todayStr && !t.completed).length;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    const matchesStatus = 
      selectedStatus === 'all' 
        ? true 
        : selectedStatus === 'pending' 
          ? !t.completed 
          : t.completed;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  // Sort: pending first, then by date and time
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const dateA = new Date(`${a.dueDate}T${a.dueTime}`).getTime();
    const dateB = new Date(`${b.dueDate}T${b.dueTime}`).getTime();
    return dateA - dateB;
  });

  const handleQuickPlayVoice = async (task: ReminderTask) => {
    await playNotificationChime();
    speakText(task.aiVoiceScript || `Pengingat tugas ${task.title}. ${task.note}`, task.aiVoiceTone);
  };

  const categories = Array.from(new Set(tasks.map(t => t.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pengingat</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalTasks}</p>
          <span className="text-2xs text-slate-400">Semua catatan agenda</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Agenda Hari Ini</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-2">{todayTasksCount}</p>
          <span className="text-2xs text-emerald-600">Perlu diselesaikan hari ini</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Prioritas Tinggi</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-900 mt-2">{highPriorityCount}</p>
          <span className="text-2xs text-rose-600">Mendesak &amp; krusial</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Tugas Selesai</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900 mt-2">{completedCount}</p>
          <span className="text-2xs text-blue-600">Tercentang selesai</span>
        </div>
      </div>

      {/* Control Bar: View Switcher, Search, and Action Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* View Switcher: List vs Calendar */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            id="view-list-btn"
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Daftar Catatan</span>
          </button>
          <button
            id="view-calendar-btn"
            onClick={() => setViewMode('calendar')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kalender Agenda</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul catatan, tugas, atau kata kunci..."
            className="w-full pl-9.5 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Add Task Button */}
        <button
          id="btn-tambah-pengingat"
          onClick={onAddTask}
          className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-sm shadow-emerald-200"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengingat Baru</span>
        </button>
      </div>

      {/* Main Content: Calendar View or List View */}
      {viewMode === 'calendar' ? (
        <CalendarView
          tasks={tasks}
          onToggleComplete={onToggleComplete}
          onOpenReminderModal={onAddTask}
          onOpenVoiceModal={onOpenVoiceModal}
        />
      ) : (
        <div className="space-y-4">
          
          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-2xs font-semibold uppercase tracking-wider mr-1">Status:</span>
            {(['all', 'pending', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedStatus === status
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status === 'all' ? 'Semua' : status === 'pending' ? 'Belum Selesai' : 'Selesai'}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <span className="text-slate-400 text-2xs font-semibold uppercase tracking-wider mr-1">Kategori:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Task Card Grid */}
          {sortedTasks.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Bell className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Tidak ada catatan pengingat ditemukan
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {searchQuery 
                  ? `Tidak ada pengingat yang cocok dengan pencarian "${searchQuery}".` 
                  : 'Mulai buat catatan pengingat tugas dengan jadwal notifikasi fleksibel dan suara AI.'}
              </p>
              <button
                onClick={onAddTask}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 inline-flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pengingat Pertama</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedTasks.map((task) => {
                const isOverdue = 
                  !task.completed && 
                  new Date(`${task.dueDate}T${task.dueTime}`).getTime() < Date.now();

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      task.completed
                        ? 'border-slate-200 bg-slate-50/50 opacity-70'
                        : isOverdue
                          ? 'border-rose-300 shadow-2xs hover:border-rose-400'
                          : task.priority === 'high'
                            ? 'border-amber-300 shadow-2xs hover:border-amber-400'
                            : 'border-slate-200 hover:border-emerald-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <button
                            onClick={() => onToggleComplete(task.id)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            <CheckCircle2
                              className={`w-5 h-5 ${
                                task.completed ? 'text-emerald-600 fill-emerald-50' : 'text-slate-300'
                              }`}
                            />
                          </button>
                          <div>
                            <h4
                              className={`text-sm sm:text-base font-bold ${
                                task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </h4>

                            {/* Tags & Metadata */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="px-2 py-0.5 rounded-md text-2xs font-semibold bg-slate-100 text-slate-700">
                                {task.category}
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded-md text-2xs font-bold ${
                                  task.priority === 'high'
                                    ? 'bg-rose-100 text-rose-700'
                                    : task.priority === 'medium'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {task.priority === 'high' ? 'Tinggi' : task.priority === 'medium' ? 'Sedang' : 'Rendah'}
                              </span>

                              {task.recurrence !== 'none' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium bg-purple-50 text-purple-700">
                                  <Repeat className="w-2.5 h-2.5 mr-1" />
                                  {task.recurrence === 'daily' ? 'Harian' : task.recurrence === 'weekly' ? 'Mingguan' : task.recurrence === 'monthly' ? 'Bulanan' : 'Tahunan'}
                                </span>
                              )}

                              {isOverdue && (
                                <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-rose-600 text-white">
                                  Lewat Waktu
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Top Right Mini Controls */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            title="Edit Catatan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Preview Teks Catatan */}
                      {task.note && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-normal">
                          <p className="line-clamp-3 whitespace-pre-wrap">{task.note}</p>
                        </div>
                      )}

                      {/* Time Details */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center text-slate-800 font-semibold">
                          <CalendarIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          <span>{task.dueDate} • {task.dueTime} WIB</span>
                        </div>

                        <div className="flex items-center text-slate-500">
                          <Bell className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          <span>
                            {task.reminderOffsetMinutes === 0
                              ? 'Tepat waktu'
                              : `${task.reminderOffsetMinutes} mnt sebelumnya`}
                          </span>
                        </div>
                      </div>

                      {/* AI Voice Preview Bar */}
                      <div className="mt-3 p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 truncate">
                          <button
                            onClick={() => handleQuickPlayVoice(task)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
                            title="Putar Suara AI"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <p className="text-2xs text-emerald-900 truncate font-medium">
                            <span className="font-bold">Suara AI:</span> "{task.aiVoiceScript || task.title}"
                          </p>
                        </div>

                        <button
                          onClick={() => onOpenVoiceModal(task)}
                          className="text-2xs font-bold text-emerald-700 hover:underline shrink-0"
                        >
                          Atur Suara
                        </button>
                      </div>
                    </div>

                    {/* Card Footer: Integrations */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => sendWhatsAppMessage(task)}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors border border-emerald-200"
                          title="Kirim Pesan WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          <span>Kirim WA</span>
                          {task.whatsappNumber && (
                            <span className="ml-1 text-3xs bg-emerald-200 text-emerald-800 px-1 rounded-full">
                              ✓
                            </span>
                          )}
                        </button>

                        <a
                          href={getGoogleCalendarUrl(task)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-2xs font-semibold transition-colors"
                          title="Simpan ke Google Calendar"
                        >
                          <Share2 className="w-3 h-3 mr-1 text-slate-500" />
                          <span>Google Cal</span>
                        </a>

                        <button
                          onClick={() => downloadICSFile(task)}
                          className="inline-flex items-center px-2 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-2xs font-semibold transition-colors"
                          title="Unduh File iCal .ICS"
                        >
                          <Download className="w-3 h-3 mr-1 text-slate-500" />
                          <span>.ICS</span>
                        </button>
                      </div>

                      <span className="text-3xs text-slate-400">
                        {task.notified ? 'Telah Diingatkan' : 'Menunggu Jadwal'}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
