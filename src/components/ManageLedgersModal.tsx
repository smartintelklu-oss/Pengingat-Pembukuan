import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Plus, 
  Store, 
  User, 
  Briefcase, 
  Wallet, 
  Edit2, 
  Check, 
  Trash2 
} from 'lucide-react';
import { LedgerBook } from '../types';

interface ManageLedgersModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgers: LedgerBook[];
  activeLedgerId: string;
  onSelectLedger: (id: string) => void;
  onCreateLedger: (ledger: Partial<LedgerBook>) => void;
  onDeleteLedger: (id: string) => void;
}

export const ManageLedgersModal: React.FC<ManageLedgersModalProps> = ({
  isOpen,
  onClose,
  ledgers,
  activeLedgerId,
  onSelectLedger,
  onCreateLedger,
  onDeleteLedger,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onCreateLedger({
      name: newName.trim(),
      description: newDescription.trim() || 'Buku pencatatan kas',
      color: 'teal',
      icon: 'BookOpen',
    });

    setNewName('');
    setNewDescription('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Pilih &amp; Kelola Buku Pembukuan
              </h4>
              <p className="text-xs text-slate-500">
                Pisahkan catatan Usaha, Pribadi, atau proyek lainnya
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ledger List */}
        <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {ledgers.map((l) => {
            const isActive = l.id === activeLedgerId;
            return (
              <div
                key={l.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div 
                  className="flex items-center space-x-3 cursor-pointer flex-1"
                  onClick={() => {
                    onSelectLedger(l.id);
                    onClose();
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs ${
                      l.name.toLowerCase().includes('usaha')
                        ? 'bg-emerald-600'
                        : l.name.toLowerCase().includes('pribadi')
                          ? 'bg-indigo-600'
                          : 'bg-teal-600'
                    }`}
                  >
                    {l.name.toLowerCase().includes('usaha') ? (
                      <Store className="w-5 h-5" />
                    ) : l.name.toLowerCase().includes('pribadi') ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Wallet className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h5 className="text-sm font-bold text-slate-900">{l.name}</h5>
                      {isActive && (
                        <span className="px-2 py-0.2 rounded-full text-3xs font-bold bg-emerald-600 text-white">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-2xs text-slate-500 line-clamp-1">{l.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 pl-2">
                  {!isActive && (
                    <button
                      onClick={() => {
                        onSelectLedger(l.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Pilih
                    </button>
                  )}

                  {ledgers.length > 1 && l.id !== 'ledger-usaha' && l.id !== 'ledger-pribadi' && (
                    <button
                      onClick={() => onDeleteLedger(l.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Hapus Buku Kas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Ledger Form */}
        {isAdding ? (
          <form onSubmit={handleCreate} className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Buat Buku Pembukuan Baru
            </h5>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nama Buku (Contoh: Toko Cabang 2, Freelance...)"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Deskripsi singkat atau peruntukan buku kas..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            />
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg shadow-2xs hover:bg-emerald-700"
              >
                Simpan Buku Baru
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 w-full py-2.5 px-4 rounded-2xl border border-dashed border-slate-300 text-slate-600 hover:border-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Buku Pembukuan Baru</span>
          </button>
        )}

      </div>
    </div>
  );
};
