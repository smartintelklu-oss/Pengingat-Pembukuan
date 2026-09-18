import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Tag, 
  CreditCard, 
  Calendar, 
  FileText,
  Plus
} from 'lucide-react';
import { Transaction, TransactionType, LedgerBook } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  activeLedger: LedgerBook;
  editingTransaction?: Transaction | null;
}

const INCOME_CATEGORIES = [
  'Penjualan Produk',
  'Pendapatan Jasa',
  'Gaji & Upah',
  'Bonus / Komisi',
  'Hasil Investasi',
  'Piutang Masuk',
  'Lain-lain',
];

const EXPENSE_CATEGORIES = [
  'Bahan Baku & Stok',
  'Biaya Operasional',
  'Gaji Karyawan',
  'Sewa Tempat',
  'Makan & Konsumsi',
  'Transportasi & Bensin',
  'Listrik, Air & Internet',
  'Promosi & Iklan',
  'Peralatan & Perlengkapan',
  'Kebutuhan Rumah',
  'Hiburan & Gaya Hidup',
  'Pajak & Retribusi',
  'Lain-lain',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  activeLedger,
  editingTransaction,
}) => {
  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'E-Wallet' | 'QRIS' | 'Kartu'>('Tunai');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setTitle(editingTransaction.title);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setNote(editingTransaction.note || '');
    } else {
      setType('income');
      setAmount('');
      setTitle('');
      setCategory(INCOME_CATEGORIES[0]);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Transfer Bank');
      setNote('');
    }
  }, [editingTransaction, isOpen]);

  // Update default category when switching type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      alert('Mohon masukkan jumlah nominal yang valid.');
      return;
    }

    const finalCategory = category === 'custom' ? customCategory.trim() : category;
    if (!finalCategory) {
      alert('Mohon pilih atau masukkan nama kategori.');
      return;
    }

    onSave({
      ...(editingTransaction ? { id: editingTransaction.id } : {}),
      ledgerId: activeLedger.id,
      type,
      amount: numAmount,
      title: title.trim(),
      category: finalCategory,
      date,
      paymentMethod,
      note: note.trim(),
    });

    onClose();
  };

  const currentCategoryList = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {editingTransaction ? 'Edit Transaksi Pembukuan' : 'Catat Transaksi Keuangan'}
            </h3>
            <p className="text-xs text-slate-500">
              Buku Kas: <span className="font-bold text-emerald-700">{activeLedger.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Transaction Type Buttons: Pemasukan vs Pengeluaran */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Pemasukan (Kas Masuk)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Pengeluaran (Kas Keluar)</span>
            </button>
          </div>

          {/* Nominal Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nominal Transaksi (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-sm font-bold text-slate-500">Rp</span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            {amount && Number(amount) > 0 && (
              <p className="text-2xs text-slate-500 mt-1">
                Terbilang: Rp {Number(amount).toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {/* Judul Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Judul / Deskripsi Transaksi *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pembayaran pesanan katering, Belanja sembako..."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Kategori & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kategori {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
              >
                {currentCategoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="custom">+ Kategori Kustom...</option>
              </select>

              {category === 'custom' && (
                <input
                  type="text"
                  placeholder="Ketik nama kategori baru"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
              />
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['Tunai', 'Transfer Bank', 'QRIS', 'E-Wallet', 'Kartu'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 px-2 rounded-lg text-2xs font-semibold border text-center transition-all ${
                    paymentMethod === method
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Catatan / Keterangan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Catatan / Nomor Invoice (Opsional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahan keterangan pembeli, nomor nota, atau bukti..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs transition-colors ${
                type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Simpan Transaksi
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
