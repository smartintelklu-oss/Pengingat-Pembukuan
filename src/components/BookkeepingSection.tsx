import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileSpreadsheet, 
  FileText, 
  BookOpen, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Store, 
  User, 
  Wallet, 
  ArrowLeft,
  ChevronRight,
  X,
  Check
} from 'lucide-react';
import { Transaction, LedgerBook } from '../types';
import { exportToExcel, exportToPDF } from '../utils/export';

interface BookkeepingSectionProps {
  ledgers: LedgerBook[];
  activeLedger: LedgerBook;
  onSelectLedger: (id: string) => void;
  onOpenManageLedgers?: () => void;
  onCreateLedger: (ledgerData: Partial<LedgerBook>) => void;
  onDeleteLedger: (id: string) => void;
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAiAnalysis: () => void;
}

export const BookkeepingSection: React.FC<BookkeepingSectionProps> = ({
  ledgers,
  activeLedger,
  onSelectLedger,
  onCreateLedger,
  onDeleteLedger,
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onOpenAiAnalysis,
}) => {
  // Navigation state: 'list' shows all ledgers + Tambah Pembukuan button
  // 'detail' shows the inside of a specific ledger with transactions & export buttons
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Add ledger modal state
  const [isAddLedgerModalOpen, setIsAddLedgerModalOpen] = useState(false);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [newLedgerDesc, setNewLedgerDesc] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<'Store' | 'User' | 'Wallet' | 'BookOpen'>('Store');

  // Filters inside ledger detail view
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Filter transactions by active ledger
  const ledgerTransactions = transactions.filter(t => t.ledgerId === activeLedger.id);

  // Filter transactions by date period
  const now = new Date();
  const filteredByPeriod = ledgerTransactions.filter(t => {
    const txDate = new Date(t.date);
    if (period === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      return t.date === todayStr;
    }
    if (period === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return txDate >= oneWeekAgo;
    }
    if (period === 'month') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    if (period === 'year') {
      return txDate.getFullYear() === now.getFullYear();
    }
    return true; // 'all'
  });

  // Filter by search, category, and type
  const displayedTransactions = filteredByPeriod.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Sort: newest date first
  const sortedTransactions = [...displayedTransactions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Calculate totals for export & categories
  const totalIncome = filteredByPeriod
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredByPeriod
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Category breakdown
  const categoryStats: Record<string, { type: string; total: number }> = {};
  filteredByPeriod.forEach(t => {
    if (!categoryStats[t.category]) {
      categoryStats[t.category] = { type: t.type, total: 0 };
    }
    categoryStats[t.category].total += t.amount;
  });

  const periodLabelMap: Record<string, string> = {
    today: 'Hari Ini',
    week: '7 Hari Terakhir',
    month: 'Bulan Ini',
    year: 'Tahun Ini',
    all: 'Semua Waktu',
  };

  const handleExportExcel = () => {
    exportToExcel(filteredByPeriod, activeLedger, periodLabelMap[period]);
  };

  const handleExportPDF = () => {
    exportToPDF(filteredByPeriod, activeLedger, periodLabelMap[period]);
  };

  const handleOpenLedgerDetail = (ledgerId: string) => {
    onSelectLedger(ledgerId);
    setViewMode('detail');
  };

  const handleCreateNewLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLedgerName.trim()) return;

    onCreateLedger({
      name: newLedgerName.trim(),
      description: newLedgerDesc.trim() || 'Pencatatan kas',
      color: 'teal',
      icon: selectedIcon,
    });

    setNewLedgerName('');
    setNewLedgerDesc('');
    setIsAddLedgerModalOpen(false);
    setViewMode('detail');
  };

  const renderLedgerIcon = (name: string, iconType?: string) => {
    const lower = name.toLowerCase();
    if (iconType === 'Store' || lower.includes('usaha') || lower.includes('toko') || lower.includes('bisnis')) {
      return <Store className="w-6 h-6" />;
    }
    if (iconType === 'User' || lower.includes('pribadi')) {
      return <User className="w-6 h-6" />;
    }
    if (iconType === 'Wallet' || lower.includes('tabungan') || lower.includes('kas')) {
      return <Wallet className="w-6 h-6" />;
    }
    return <BookOpen className="w-6 h-6" />;
  };

  return (
    <div className="space-y-6">
      
      {/* ---------------------------------------------------- */}
      {/* VIEW 1: DAFTAR PEMBUKUAN (LIST OF LEDGERS & ADD BTN) */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Bar: Nama Pembukuan Title & Tombol Tambah Pembukuan */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Daftar Buku Pembukuan
                </h2>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Pilih buku pembukuan untuk mencatat transaksi atau buat buku baru
                </p>
              </div>
            </div>

            {/* Tombol Tambah Pembukuan */}
            <button
              id="btn-tambah-pembukuan"
              onClick={() => setIsAddLedgerModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pembukuan</span>
            </button>
          </div>

          {/* Grid of Ledgers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ledgers.map((ledger) => {
              const ledgerTxCount = transactions.filter(t => t.ledgerId === ledger.id).length;
              const isSelected = ledger.id === activeLedger.id;

              return (
                <div
                  key={ledger.id}
                  id={`card-ledger-${ledger.id}`}
                  className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => handleOpenLedgerDetail(ledger.id)}
                >
                  <div>
                    {/* Top Row: Icon & Transactions Count Badge */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {renderLedgerIcon(ledger.name, ledger.icon)}
                      </div>
                      <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        {ledgerTxCount} Transaksi
                      </span>
                    </div>

                    {/* Ledger Name & Description */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {ledger.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {ledger.description}
                    </p>
                  </div>

                  {/* Bottom Action: Open Ledger Button */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                      <span>Buka Pembukuan</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>

                    {ledgers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLedger(ledger.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hapus Pembukuan Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* VIEW 2: DI DALAM PEMBUKUAN (DETAIL VIEW WITH ACTIONS & TRANSACTIONS) */}
      {/* -------------------------------------------------------------------- */}
      {viewMode === 'detail' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Bar Inside Ledger: Back Button, Nama Pembukuan, Unduh Excel, Unduh PDF, Catat Transaksi */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left: Back Button & Ledger Identity */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                id="btn-back-to-ledgers"
                onClick={() => setViewMode('list')}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all w-fit cursor-pointer"
                title="Kembali ke Daftar Pembukuan"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Daftar Pembukuan</span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {renderLedgerIcon(activeLedger.name, activeLedger.icon)}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                      Buku Aktif:
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {activeLedger.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    {activeLedger.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Unduh Excel, Unduh PDF, Catat Transaksi (HANYA ADA DI DALAM PEMBUKUAN) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* AI Analysis Button */}
              <button
                id="btn-ai-analysis"
                onClick={onOpenAiAnalysis}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Analisis Kondisi Keuangan dengan AI"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Analisis AI</span>
              </button>

              {/* Unduh Excel Button */}
              <button
                id="btn-export-excel"
                onClick={handleExportExcel}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Unduh Laporan ke Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Unduh Excel</span>
              </button>

              {/* Unduh PDF Button */}
              <button
                id="btn-export-pdf"
                onClick={handleExportPDF}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Unduh Laporan ke PDF (.pdf)"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Unduh PDF</span>
              </button>

              {/* Catat Transaksi Button */}
              <button
                id="btn-catat-transaksi"
                onClick={onAddTransaction}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Transaksi</span>
              </button>
            </div>

          </div>

          {/* NOTE: LAPORAN TOTAL CARDS (Total Pemasukan, Total Pengeluaran, Saldo Kas Bersih) */}
          {/* TELAH DIHAPUS SEPENUHNYA SESUAI INSTRUKSI PENGGUNA */}

          {/* Period Selector Tabs & Search Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
              {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    period === p
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {periodLabelMap[p]}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi / nota..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Main Content Layout: Transactions Table & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Transactions List */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
              
              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">
                    Riwayat Transaksi
                  </span>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {sortedTransactions.length} Data
                  </span>
                </div>

                {/* Type Filter Buttons */}
                <div className="flex items-center space-x-1 text-xs">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                      typeFilter === 'all' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setTypeFilter('income')}
                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                      typeFilter === 'income' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => setTypeFilter('expense')}
                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                      typeFilter === 'expense' ? 'bg-rose-100 text-rose-800' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Keluar
                  </button>
                </div>
              </div>

              {/* Transactions List Table / Cards */}
              {sortedTransactions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Belum ada transaksi di periode ini</p>
                  <p className="text-xs text-slate-400 mt-0.5 mb-4">
                    Klik tombol "Catat Transaksi" untuk memasukkan data pemasukan atau pengeluaran kas di buku {activeLedger.name}.
                  </p>
                  <button
                    onClick={onAddTransaction}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Catat Transaksi Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                  {sortedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/40 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {tx.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">{tx.date}</span>
                            <span>•</span>
                            <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 text-2xs font-semibold">
                              {tx.category}
                            </span>
                            <span>•</span>
                            <span className="text-2xs text-slate-500">{tx.paymentMethod}</span>
                          </div>
                          {tx.note && (
                            <p className="text-2xs text-slate-500 mt-1 italic line-clamp-1">
                              Nota: {tx.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm sm:text-base font-extrabold ${
                            tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                        </p>

                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
                            title="Edit Transaksi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Category Breakdown & Statistics Sidebar */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Category Distribution Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900">
                    Distribusi Kategori
                  </h4>
                  <span className="text-2xs text-slate-400">
                    {periodLabelMap[period]}
                  </span>
                </div>

                {Object.keys(categoryStats).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Belum ada rincian kategori di periode ini
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(categoryStats).map(([catName, data]) => {
                      const relevantTotal = data.type === 'income' ? totalIncome : totalExpense;
                      const percentage = relevantTotal > 0 ? Math.round((data.total / relevantTotal) * 100) : 0;

                      return (
                        <div key={catName} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">{catName}</span>
                            <span className="font-bold text-slate-900">
                              Rp {data.total.toLocaleString('id-ID')} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                data.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Ledger Guide Card */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xs">
                <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  Panduan Buku: {activeLedger.name}
                </h5>
                <p className="text-2xs text-slate-300 leading-relaxed">
                  Laporan pembukuan ini dapat langsung diunduh ke format spreadsheet Excel (.xlsx) atau dokumen PDF (.pdf) untuk pelaporan berkala.
                </p>
                <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-3xs text-slate-400">Ekspor cepat:</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={handleExportExcel}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-2xs font-semibold text-emerald-300 cursor-pointer"
                    >
                      .xlsx Excel
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-2xs font-semibold text-rose-300 cursor-pointer"
                    >
                      .pdf Dokumen
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: TAMBAH BUKU PEMBUKUAN BARU                   */}
      {/* ---------------------------------------------------- */}
      {isAddLedgerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Tambah Pembukuan Baru
                  </h4>
                  <p className="text-xs text-slate-500">
                    Buat buku kas terpisah untuk usaha atau keperluan pribadi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddLedgerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewLedger} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pembukuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLedgerName}
                  onChange={(e) => setNewLedgerName(e.target.value)}
                  placeholder="Contoh: Usaha, Pribadi, Toko Online, Freelance"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Keterangan Pembukuan
                </label>
                <input
                  type="text"
                  value={newLedgerDesc}
                  onChange={(e) => setNewLedgerDesc(e.target.value)}
                  placeholder="Contoh: Arus kas operasional bisnis toko baju"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ikon Pembukuan
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'Store', label: 'Usaha', icon: Store },
                    { id: 'User', label: 'Pribadi', icon: User },
                    { id: 'Wallet', label: 'Tabungan', icon: Wallet },
                    { id: 'BookOpen', label: 'Umum', icon: BookOpen },
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isSelected = selectedIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedIcon(item.id as any)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-2xs">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddLedgerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Simpan &amp; Buka Pembukuan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
