import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Briefcase, 
  Lock, 
  KeyRound, 
  LogIn, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Cloud, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Users, 
  ArrowLeft,
  Store,
  UserPlus
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { 
  signInWithPopup, 
  googleProvider, 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../services/firebase';

interface LoginPageProps {
  currentUser: AppUser;
  localProfiles: AppUser[];
  onSelectAccount: (user: AppUser) => void;
  onCreateLocalAccount: (name: string, role: UserRole, pin: string, email?: string) => void;
  onCloudLoginSuccess: (user: AppUser) => void;
  onBackToApp?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  localProfiles,
  onSelectAccount,
  onCreateLocalAccount,
  onCloudLoginSuccess,
  onBackToApp,
}) => {
  // Mode: 'role_picker' | 'quick_pin' | 'cloud_login' | 'register_staff'
  const [activeTab, setActiveTab] = useState<'profiles' | 'cloud' | 'register'>('profiles');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'owner' | 'staff'>('all');

  // PIN Verification State
  const [verifyingUser, setVerifyingUser] = useState<AppUser | null>(null);
  const [inputPin, setInputPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Cloud Email / Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCloudRegister, setIsCloudRegister] = useState(false);
  const [cloudRole, setCloudRole] = useState<UserRole>('owner');
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  // New Staff Registration State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [newPin, setNewPin] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Filter profiles based on selected role
  const filteredProfiles = localProfiles.filter(p => {
    if (selectedRoleFilter === 'all') return true;
    return (p.role || 'staff') === selectedRoleFilter;
  });

  const ownersCount = localProfiles.filter(p => p.role === 'owner').length;
  const staffCount = localProfiles.filter(p => p.role === 'staff').length;

  // Handle clicking on an account card
  const handleAccountClick = (user: AppUser) => {
    if (user.pin && user.pin.trim() !== '') {
      setVerifyingUser(user);
      setInputPin('');
      setPinError(null);
    } else {
      // No PIN needed, switch immediately
      onSelectAccount(user);
      if (onBackToApp) onBackToApp();
    }
  };

  // Verify PIN submission
  const handleVerifyPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingUser) return;

    if (inputPin === verifyingUser.pin) {
      onSelectAccount(verifyingUser);
      setVerifyingUser(null);
      setInputPin('');
      if (onBackToApp) onBackToApp();
    } else {
      setPinError('PIN yang Anda masukkan salah. Silakan coba lagi.');
    }
  };

  // Google Sign-In with Firebase
  const handleGoogleLogin = async () => {
    setCloudLoading(true);
    setCloudError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const appUser: AppUser = {
        id: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna Cloud',
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        role: cloudRole,
        isCloudUser: true,
        createdAt: new Date().toISOString()
      };
      onCloudLoginSuccess(appUser);
      if (onBackToApp) onBackToApp();
    } catch (err: any) {
      setCloudError(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setCloudLoading(false);
    }
  };

  // Firebase Email/Password Sign-In or Register
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setCloudLoading(true);
    setCloudError(null);
    try {
      let user;
      if (isCloudRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        user = cred.user;
      }
      const appUser: AppUser = {
        id: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || (cloudRole === 'owner' ? 'Pemilik Cloud' : 'Staf Cloud'),
        email: user.email || undefined,
        role: cloudRole,
        isCloudUser: true,
        createdAt: new Date().toISOString()
      };
      onCloudLoginSuccess(appUser);
      if (onBackToApp) onBackToApp();
    } catch (err: any) {
      setCloudError(err.message || 'Gagal autentikasi cloud. Silakan periksa email dan kata sandi.');
    } finally {
      setCloudLoading(false);
    }
  };

  // Handle creating new local profile (Pemilik atau Staf)
  const handleCreateNewStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setRegError('Nama akun wajib diisi.');
      return;
    }
    onCreateLocalAccount(
      newName.trim(),
      newRole,
      newPin.trim() || (newRole === 'owner' ? '1234' : '0000'),
      newEmail.trim() || undefined
    );
    setRegSuccess(`Akun ${newRole === 'owner' ? 'Pemilik' : 'Staf'} "${newName}" berhasil ditambahkan!`);
    setNewName('');
    setNewEmail('');
    setNewPin('');
    setTimeout(() => {
      setRegSuccess(null);
      setActiveTab('profiles');
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-2 sm:py-6 px-2 sm:px-4">
      {/* Header Back Navigation if opened from within app */}
      {onBackToApp && (
        <div className="mb-4">
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Aplikasi Utama</span>
          </button>
        </div>
      )}

      {/* Main Glass Card Container */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-2xs font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Portal Masuk &amp; Akses Pengguna</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Masuk Berdasarkan Akun
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                Pilih akun <strong>Pemilik</strong> atau <strong>Staf</strong> untuk mengakses data pengingat agenda, buku kas keuangan, dan WhatsApp sesuai ruang kerja masing-masing.
              </p>
            </div>

            {/* Currently Active User Badge */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 sm:min-w-[200px]">
              <span className="text-2xs font-semibold text-slate-300 block">Akun Aktif Sekarang:</span>
              <div className="flex items-center space-x-2.5 mt-1.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-2xs ${
                  currentUser.role === 'owner' ? 'bg-amber-600' : 'bg-teal-600'
                }`}>
                  {currentUser.role === 'owner' ? <ShieldCheck className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{currentUser.displayName}</p>
                  <p className="text-2xs text-emerald-300 font-medium">
                    {currentUser.role === 'owner' ? 'Peran: Pemilik' : 'Peran: Staf / Kasir'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 mt-6 pt-5 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setActiveTab('profiles');
                setVerifyingUser(null);
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'profiles'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Daftar Akun ({localProfiles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setVerifyingUser(null);
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Akun Baru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('cloud');
                setVerifyingUser(null);
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'cloud'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>Login Cloud / Google</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: ACCOUNTS LIST WITH ROLE FILTER */}
          {activeTab === 'profiles' && !verifyingUser && (
            <div className="space-y-6">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-500">Filter Peran:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedRoleFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({localProfiles.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleFilter('owner')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedRoleFilter === 'owner'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    Pemilik Usaha ({ownersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleFilter('staff')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedRoleFilter === 'staff'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                    }`}
                  >
                    Staf / Kasir ({staffCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftarkan Staf / Akun Baru</span>
                </button>
              </div>

              {/* Account Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProfiles.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const isOwner = user.role === 'owner';

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleAccountClick(user)}
                      className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                          : isOwner
                          ? 'bg-white hover:bg-amber-50/40 border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-md'
                          : 'bg-white hover:bg-teal-50/40 border-slate-200 hover:border-teal-300 shadow-2xs hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Avatar / Role Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-white ${
                          isOwner 
                            ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20' 
                            : 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-teal-500/20'
                        }`}>
                          {isOwner ? (
                            <ShieldCheck className="w-6 h-6" />
                          ) : (
                            <Briefcase className="w-6 h-6" />
                          )}
                        </div>

                        {/* Account Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-900 truncate">
                              {user.displayName}
                            </h3>
                            {isCurrent && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-600 text-white">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Sedang Digunakan</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-extrabold uppercase ${
                              isOwner ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                            }`}>
                              {isOwner ? '👑 Akun Pemilik' : '💼 Akun Staf'}
                            </span>
                            {user.isCloudUser && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-2xs font-semibold bg-indigo-100 text-indigo-700">
                                <Cloud className="w-2.5 h-2.5" />
                                <span>Cloud Sync</span>
                              </span>
                            )}
                          </div>

                          {user.email && (
                            <p className="text-xs text-slate-500 mt-1 truncate">{user.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Card Footer & Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1 text-slate-500">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.pin ? 'Dilindungi PIN Keamanan' : 'Tanpa PIN'}</span>
                        </div>

                        <span className={`font-bold inline-flex items-center space-x-1 ${
                          isCurrent ? 'text-emerald-700' : 'text-indigo-600 group-hover:translate-x-0.5 transition-transform'
                        }`}>
                          <span>{isCurrent ? 'Tetap Menggunakan' : 'Masuk Akun Ini'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Guide Note Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Keamanan Akses Terpisah:</p>
                  <p className="mt-0.5 leading-relaxed">
                    Setiap akun memiliki database catatan pengingat tugas dan transaksi kas sendiri. 
                    Default PIN demo: <strong>1234</strong> untuk akun Pemilik, dan <strong>0000</strong> untuk akun Staf. Anda dapat mengubah atau mendaftarkan akun baru kapan pun.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VERIFY PIN MODAL/FORM (WHEN CLICKED) */}
          {activeTab === 'profiles' && verifyingUser && (
            <div className="max-w-md mx-auto py-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center mb-6">
                <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white shadow-md mb-3 ${
                  verifyingUser.role === 'owner' ? 'bg-amber-600 shadow-amber-600/30' : 'bg-teal-600 shadow-teal-600/30'
                }`}>
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Konfirmasi PIN: {verifyingUser.displayName}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan PIN 4 angka untuk membuka ruang kerja akun {verifyingUser.role === 'owner' ? 'Pemilik' : 'Staf'}.
                </p>
              </div>

              <form onSubmit={handleVerifyPinSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block text-center">
                    PIN Keamanan
                  </label>
                  <div className="relative max-w-[200px] mx-auto">
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      autoFocus
                      value={inputPin}
                      onChange={(e) => {
                        setInputPin(e.target.value);
                        setPinError(null);
                      }}
                      placeholder="••••"
                      className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-2xs text-center text-slate-400">
                    Petunjuk: PIN default akun ini adalah <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-700">{verifyingUser.pin || '1234'}</code>
                  </p>
                </div>

                {pinError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyingUser(null);
                      setInputPin('');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Buka Akun</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: REGISTER NEW LOCAL PROFILE */}
          {activeTab === 'register' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Daftarkan Akun Baru (Pemilik atau Staf)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Buat profil terpisah untuk pemilik toko, supervisor, staf kasir, atau bagian operasional.
                </p>
              </div>

              {regSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{regSuccess}</span>
                </div>
              )}

              {regError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleCreateNewStaffSubmit} className="space-y-4">
                {/* Role Selection Segmented Control */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Pilih Peran Akun</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewRole('owner')}
                      className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                        newRole === 'owner'
                          ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">Pemilik Usaha</span>
                        <span className="text-2xs text-slate-500 block mt-0.5">Akses penuh catatan &amp; keuangan</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewRole('staff')}
                      className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                        newRole === 'staff'
                          ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">Staf / Kasir</span>
                        <span className="text-2xs text-slate-500 block mt-0.5">Tugas pengingat &amp; kas operasional</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Nama Pengguna / Pegawai</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Maya Kartika (Kasir Pagi)"
                    className="w-full text-xs sm:text-sm py-2.5 px-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Email Pengguna <span className="font-normal text-slate-400">(Opsional)</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="staf@toko.id"
                    className="w-full text-xs sm:text-sm py-2.5 px-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                {/* PIN */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    PIN Keamanan (4-6 Angka) <span className="font-normal text-slate-400">(Default: {newRole === 'owner' ? '1234' : '0000'})</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder={newRole === 'owner' ? '1234' : '0000'}
                    className="w-full text-xs sm:text-sm py-2.5 px-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono tracking-widest"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Simpan &amp; Tambahkan Akun</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CLOUD AUTHENTICATION (FIREBASE GOOGLE / EMAIL) */}
          {activeTab === 'cloud' && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto mb-2.5">
                  <Cloud className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Masuk dengan Akun Cloud (Firebase)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sinkronisasi seluruh catatan pengingat dan pembukuan secara otomatis di berbagai perangkat.
                </p>
              </div>

              {cloudError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cloudError}</span>
                </div>
              )}

              {/* Choose Role for Cloud Session */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block text-center">
                  Tentukan Peran Akun Cloud Ini
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCloudRole('owner')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      cloudRole === 'owner'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    👑 Masuk sbg Pemilik
                  </button>
                  <button
                    type="button"
                    onClick={() => setCloudRole('staff')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      cloudRole === 'staff'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    💼 Masuk sbg Staf
                  </button>
                </div>
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={cloudLoading}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs transition-all flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{cloudLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Akun Google'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-4 text-2xs uppercase tracking-wider text-slate-400 font-bold">atau email</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className="w-full text-xs sm:text-sm py-2.5 px-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Kata Sandi</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full text-xs sm:text-sm py-2.5 px-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={cloudLoading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{cloudLoading ? 'Memproses...' : isCloudRegister ? 'Daftar Akun Cloud' : 'Masuk Cloud'}</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCloudRegister(!isCloudRegister)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {isCloudRegister ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun cloud? Buat akun baru'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
