import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Download, 
  Smartphone, 
  Share, 
  X, 
  PlusSquare, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'compact' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'header',
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed and running standalone, show installed badge if requested or null
  if (isInstalled) {
    if (variant === 'card' || variant === 'banner') {
      return (
        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Aplikasi sudah terpasang di perangkat ini</span>
        </div>
      );
    }
    return null;
  }

  // 1. If native prompt is available (Chrome Android / Desktop Chrome / Edge)
  const handleAction = () => {
    if (isInstallable) {
      install();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Primary Trigger Button */}
      <button
        id="btn-install-pwa"
        type="button"
        onClick={handleAction}
        className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer ${
          isInstallable 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
            : 'bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 hover:border-blue-300'
        } ${className}`}
        title="Pasang aplikasi Catatan Pengingat & Pembukuan ke Layar Utama perangkat Anda"
      >
        <Download className="w-4 h-4 text-current" />
        <span className="hidden sm:inline">Install Aplikasi PWA</span>
        <span className="sm:hidden">Install App</span>
      </button>

      {/* Manual / Fallback Installation Modal Guide */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Install Aplikasi PWA</h3>
                  <p className="text-xs text-slate-500">Pasang ke Layar Utama HP / Laptop Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note regarding Preview iframe */}
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Tips Instalasi:</strong> Jika Anda sedang membuka aplikasi di dalam jendela pratinjau (preview), buka aplikasi di <strong>Tab Baru Browser</strong> agar browser dapat menampilkan tombol instalasi otomatis secara penuh.
              </div>
            </div>

            {/* Platform Instructions */}
            <div className="mt-4 space-y-3.5 text-xs text-slate-700">
              
              {/* Android Chrome */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center space-x-2 font-bold text-slate-900 mb-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Di HP Android (Google Chrome):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed">
                  <li>Ketuk ikon <strong>menu titik tiga (⋮)</strong> di pojok kanan atas browser Chrome.</li>
                  <li>Pilih menu <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar utama"</strong>.</li>
                  <li>Konfirmasi dengan menekan <strong>Instal</strong>. Ikon aplikasi akan langsung ada di layar HP Anda.</li>
                </ol>
              </div>

              {/* iPhone / iPad Safari */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center space-x-2 font-bold text-slate-900 mb-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Di iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed">
                  <li>Buka website ini di browser <strong>Safari</strong>.</li>
                  <li>Ketuk tombol <strong>Share / Bagikan</strong> <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> di bilah bawah Safari.</li>
                  <li>Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-700" />.</li>
                  <li>Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.</li>
                </ol>
              </div>

              {/* Laptop / PC Desktop */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center space-x-2 font-bold text-slate-900 mb-2">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                  <span>Di Laptop / Komputer (Chrome / Edge):</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Klik ikon <strong>Instal</strong> <Download className="w-3.5 h-3.5 inline mx-0.5 text-indigo-600" /> yang berada di sisi kanan bilah alamat (URL bar) browser Anda, lalu klik <strong>Instal</strong>.
                </p>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex items-center space-x-2">
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center space-x-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all text-center shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Tab Baru</span>
              </a>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
