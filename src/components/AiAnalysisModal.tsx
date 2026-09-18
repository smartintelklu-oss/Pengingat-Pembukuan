import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Lightbulb, 
  RotateCw,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Transaction, LedgerBook, AiFinancialInsight } from '../types';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: LedgerBook;
  transactions: Transaction[];
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isOpen,
  onClose,
  ledger,
  transactions,
}) => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<AiFinancialInsight | null>(null);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/financial-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ledgerName: ledger.name,
          income: totalIncome,
          expense: totalExpense,
          balance,
          transactions,
        }),
      });
      const data = await res.json();
      setInsight(data);
    } catch (e) {
      console.error('Failed to fetch AI insights:', e);
      setInsight({
        summary: `Arus kas pada buku pembukuan ${ledger.name} menunjukkan perputaran dana aktif. Terus catat setiap pengeluaran agar rasio tabungan terjaga.`,
        healthStatus: balance >= 0 ? 'Cukup Sehat' : 'Waspada Defisit',
        keyObservation: 'Evaluasi pengeluaran rutin dapat menghemat hingga 15% beban operasional bulanan.',
        tips: [
          'Pisahkan dana operasional pokok dari dana cadangan.',
          'Catat transaksi segera setelah terjadi agar tidak ada nota yang terlewat.',
          'Lakukan ekspor data ke Excel atau PDF setiap akhir bulan.'
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInsights();
    }
  }, [isOpen, ledger.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Konsultasi &amp; Analisis Keuangan AI
              </h4>
              <p className="text-xs text-slate-500">
                Buku Pembukuan: <span className="font-semibold text-emerald-800">{ledger.name}</span>
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

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-emerald-600 animate-spin" />
            <p className="text-sm font-bold text-slate-800">
              Menganalisis Pola Transaksi Pembukuan...
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              AI sedang menghitung rasio arus kas, mengevaluasi kategori pengeluaran, dan menyusun saran finansial.
            </p>
          </div>
        ) : insight ? (
          <div className="mt-4 space-y-4">
            
            {/* Health Status Pill */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Status Kesehatan Kas
                </span>
                <h5 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {insight.healthStatus || 'Sehat'}
                </h5>
              </div>

              <div className="text-right">
                <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Saldo Bersih
                </span>
                <span className={`text-sm font-extrabold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Rp {balance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* AI Summary */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900 mb-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Evaluasi Arus Kas</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {insight.summary}
              </p>
              {insight.keyObservation && (
                <div className="mt-2.5 pt-2 border-t border-emerald-200/60 text-2xs text-emerald-800 font-medium">
                  💡 <strong>Sorotan Utama:</strong> {insight.keyObservation}
                </div>
              )}
            </div>

            {/* Actionable Tips */}
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Rekomendasi &amp; Tips Praktis:</span>
              </div>
              <ul className="space-y-2">
                {(insight.tips || []).map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Refresh Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={fetchInsights}
                className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Analisis Ulang</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
              >
                Tutup Analisis
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};
