import React, { useState } from 'react';
import { 
  User, 
  Users, 
  LogIn, 
  LogOut, 
  Plus, 
  Cloud, 
  CloudOff, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Mail, 
  X,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { AppUser } from '../types';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  fbSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../services/firebase';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  localProfiles: AppUser[];
  onSwitchUser: (user: AppUser) => void;
  onAddNewProfile: (name: string, email?: string) => void;
  onCloudLoginSuccess: (user: AppUser) => void;
  onLogoutToDefault: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  localProfiles,
  onSwitchUser,
  onAddNewProfile,
  onCloudLoginSuccess,
  onLogoutToDefault
}) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'cloud_login' | 'add_profile'>('profiles');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');

  // Firebase Email Auth form
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    onAddNewProfile(newProfileName.trim(), newProfileEmail.trim() || undefined);
    setNewProfileName('');
    setNewProfileEmail('');
    setActiveTab('profiles');
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const appUser: AppUser = {
        id: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna Cloud',
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        isCloudUser: true,
        createdAt: new Date().toISOString()
      };
      onCloudLoginSuccess(appUser);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setAuthError(err?.message || 'Gagal login dengan akun Google. Periksa koneksi atau coba login email.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      let res;
      if (authMode === 'login') {
        res = await signInWithEmailAndPassword(auth, email, password);
      } else {
        res = await createUserWithEmailAndPassword(auth, email, password);
      }
      const user = res.user;
      const appUser: AppUser = {
        id: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna Cloud',
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        isCloudUser: true,
        createdAt: new Date().toISOString()
      };
      onCloudLoginSuccess(appUser);
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      let msg = 'Terjadi kesalahan saat masuk.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = 'Email atau kata sandi tidak cocok.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email sudah terdaftar. Silakan pilih mode Masuk.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Kata sandi minimal 6 karakter.';
      } else if (err.message) {
        msg = err.message;
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.error('Signout error:', e);
    }
    onLogoutToDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Multi Akun &amp; Akun Pengguna</h3>
              <p className="text-xs text-slate-500">Pisahkan catatan pengingat &amp; kas per akun</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Pill Info */}
        <div className="px-6 py-3 bg-indigo-50/80 border-b border-indigo-100/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName} 
                className="w-8 h-8 rounded-full object-cover border border-white shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">{currentUser.displayName}</span>
                {currentUser.isCloudUser ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <Cloud className="w-3 h-3" />
                    <span>Cloud Sync</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    <CloudOff className="w-3 h-3" />
                    <span>Lokal</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{currentUser.email || 'Data tersimpan privat untuk profil ini'}</p>
            </div>
          </div>

          {currentUser.isCloudUser && (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-6 pt-3 space-x-4 text-xs font-bold text-slate-500">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`pb-2.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'profiles' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent hover:text-slate-700'
            }`}
          >
            Daftar Akun / Profil ({localProfiles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud_login')}
            className={`pb-2.5 transition-all border-b-2 flex items-center space-x-1 cursor-pointer ${
              activeTab === 'cloud_login' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent hover:text-slate-700'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Login Cloud (Google / Email)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add_profile')}
            className={`pb-2.5 transition-all border-b-2 flex items-center space-x-1 cursor-pointer ${
              activeTab === 'add_profile' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent hover:text-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Profil Baru</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'profiles' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Pilih akun di bawah ini untuk berganti sesi kerja. Semua data pengingat, catatan kas, dan jadwal pesan akan otomatis berpindah sesuai profil yang dipilih:
              </p>

              <div className="space-y-2">
                {localProfiles.map((p) => {
                  const isActive = p.id === currentUser.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSwitchUser(p);
                        onClose();
                      }}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isActive 
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20' 
                          : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-slate-800">{p.displayName}</span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{p.email || 'Profil Lokal Offline'}</p>
                        </div>
                      </div>

                      {isActive ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                          Pilih
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('add_profile')}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-indigo-600 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Profil / Akun Pengguna Tambahan</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cloud_login' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/80 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900 flex items-center space-x-1.5 text-sm">
                  <Cloud className="w-4 h-4 text-indigo-600" />
                  <span>Sinkronisasi Multi-Perangkat dengan Cloud</span>
                </p>
                <p>
                  Dengan masuk ke akun Cloud (Firebase Firestore), catatan pengingat dan pembukuan Anda tersimpan aman dan otomatis dapat dibuka di perangkat mana pun (Laptop, HP, Tablet).
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs flex items-center justify-center space-x-3 transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{authLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-[11px] text-slate-400 font-semibold">ATAU DENGAN EMAIL</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-xs text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {authLoading 
                    ? 'Memproses...' 
                    : authMode === 'login' ? 'Masuk ke Akun Cloud' : 'Daftar Akun Cloud Baru'
                  }
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    {authMode === 'login' 
                      ? 'Belum punya akun? Klik untuk Buat Akun Baru' 
                      : 'Sudah punya akun? Klik untuk Masuk'
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'add_profile' && (
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Profil Lokal Baru (Offline)</span>
                </p>
                <p>
                  Cocok untuk staf kasir, anggota keluarga, atau cabang usaha yang menggunakan perangkat ini tanpa perlu login email. Data tersimpan terpisah pada peramban ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Profil / Pengguna *</label>
                <input
                  type="text"
                  required
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Contoh: Kasir Toko Cabang 2, Admin Keuangan, dsb."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Email (Opsional)</label>
                <input
                  type="text"
                  value={newProfileEmail}
                  onChange={(e) => setNewProfileEmail(e.target.value)}
                  placeholder="kasir@toko.id"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('profiles')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Simpan &amp; Aktifkan Profil
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
