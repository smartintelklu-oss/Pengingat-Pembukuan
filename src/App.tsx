import React, { useState, useEffect, useRef } from 'react';
import { 
  loadReminders, 
  saveReminders, 
  loadLedgers, 
  saveLedgers, 
  loadTransactions, 
  saveTransactions, 
  loadActiveLedgerId, 
  saveActiveLedgerId,
  loadScheduledWhatsApp,
  saveScheduledWhatsApp,
  loadLocalUserProfiles,
  saveLocalUserProfiles,
  loadActiveUserId,
  saveActiveUserId,
  loadScopedReminders,
  saveScopedReminders,
  loadScopedLedgers,
  saveScopedLedgers,
  loadScopedTransactions,
  saveScopedTransactions,
  loadScopedScheduledWhatsApp,
  saveScopedScheduledWhatsApp
} from './utils/storage';
import { ReminderTask, Transaction, LedgerBook, ScheduledWhatsApp, AppUser, UserRole } from './types';
import { 
  subscribeUserReminders, 
  subscribeUserLedgers, 
  subscribeUserTransactions, 
  subscribeUserScheduledWhatsApp,
  syncRemindersToCloud,
  deleteReminderFromCloud,
  syncLedgersToCloud,
  deleteLedgerFromCloud,
  syncTransactionsToCloud,
  deleteTransactionFromCloud,
  syncScheduledWhatsAppToCloud,
  deleteScheduledWhatsAppFromCloud,
  auth
} from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Header } from './components/Header';
import { ReminderSection } from './components/ReminderSection';
import { BookkeepingSection } from './components/BookkeepingSection';
import { WhatsAppSection } from './components/WhatsAppSection';
import { ReminderModal } from './components/ReminderModal';
import { TransactionModal } from './components/TransactionModal';
import { ManageLedgersModal } from './components/ManageLedgersModal';
import { VoicePreviewModal } from './components/VoicePreviewModal';
import { AlarmAlertModal } from './components/AlarmAlertModal';
import { AiAnalysisModal } from './components/AiAnalysisModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { UserAccountModal } from './components/UserAccountModal';
import { LoginPage } from './components/LoginPage';
import { HomeGlassNav } from './components/HomeGlassNav';
import { PageGlassHeader } from './components/PageGlassHeader';
import { SettingsPage } from './components/SettingsPage';
import { showPushNotification } from './utils/audio';
import { sendScheduledWhatsApp, getNextRecurrenceDate } from './utils/whatsapp';
import { sendViaActiveGateway } from './utils/whatsappGateway';
import { Bell, Sparkles, Plus, Volume2 } from 'lucide-react';
import { AppTab } from './types';

export default function App() {
  // Navigation: Defaults to modern glass home dashboard
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_active_tab');
      if (saved === 'home' || saved === 'reminders' || saved === 'bookkeeping' || saved === 'whatsapp' || saved === 'settings' || saved === 'login') {
        return saved as AppTab;
      }
    }
    return 'home';
  });

  // Persist current tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_active_tab', activeTab);
    }
  }, [activeTab]);

  // 1. Multi-User / Account Profiles State
  const [localProfiles, setLocalProfiles] = useState<AppUser[]>(() => loadLocalUserProfiles());
  const [activeUserId, setActiveUserId] = useState<string>(() => loadActiveUserId());
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const profiles = loadLocalUserProfiles();
    const activeId = loadActiveUserId();
    return profiles.find(p => p.id === activeId) || profiles[0] || {
      id: 'user-utama',
      displayName: 'Akun Utama (Pemilik)',
      email: 'pemilik@usaha.id',
      isCloudUser: false,
      createdAt: new Date().toISOString(),
    };
  });
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // 2. Data State (Loaded according to activeUserId)
  const [reminders, setReminders] = useState<ReminderTask[]>(() => loadScopedReminders(activeUserId));
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderTask | null>(null);

  // Bookkeeping state
  const [ledgers, setLedgers] = useState<LedgerBook[]>(() => loadScopedLedgers(activeUserId));
  const [activeLedgerId, setActiveLedgerId] = useState<string>(() => {
    const userLedgers = loadScopedLedgers(activeUserId);
    return userLedgers[0]?.id || 'ledger-usaha';
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadScopedTransactions(activeUserId));
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isManageLedgersModalOpen, setIsManageLedgersModalOpen] = useState(false);

  // Scheduled WhatsApp state
  const [scheduledWhatsApp, setScheduledWhatsApp] = useState<ScheduledWhatsApp[]>(() => loadScopedScheduledWhatsApp(activeUserId));
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [editingWhatsApp, setEditingWhatsApp] = useState<ScheduledWhatsApp | null>(null);

  // Modals & Triggers
  const [voicePreviewTask, setVoicePreviewTask] = useState<ReminderTask | null>(null);
  const [triggeredAlarmTask, setTriggeredAlarmTask] = useState<ReminderTask | null>(null);
  const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);

  // Synchronize Active User ID to LocalStorage
  useEffect(() => {
    saveActiveUserId(activeUserId);
  }, [activeUserId]);

  // Synchronize Local Profiles to LocalStorage
  useEffect(() => {
    saveLocalUserProfiles(localProfiles);
  }, [localProfiles]);

  // Listen to Firebase Auth state change for automatic sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const cloudUser: AppUser = {
          id: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Pengguna Cloud',
          email: fbUser.email || undefined,
          photoURL: fbUser.photoURL || undefined,
          isCloudUser: true,
          createdAt: new Date().toISOString()
        };
        setCurrentUser(cloudUser);
        setActiveUserId(cloudUser.id);
        // Ensure cloud user is in profiles list
        setLocalProfiles(prev => {
          if (!prev.some(p => p.id === cloudUser.id)) {
            return [cloudUser, ...prev];
          }
          return prev.map(p => p.id === cloudUser.id ? cloudUser : p);
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // When active user changes: Reload scoped data & bind cloud real-time subscription if cloud user
  useEffect(() => {
    // Load local storage scoped cache first
    const scopedRem = loadScopedReminders(activeUserId);
    const scopedLedg = loadScopedLedgers(activeUserId);
    const scopedTx = loadScopedTransactions(activeUserId);
    const scopedWa = loadScopedScheduledWhatsApp(activeUserId);

    setReminders(scopedRem);
    setLedgers(scopedLedg);
    setActiveLedgerId(scopedLedg[0]?.id || 'ledger-usaha');
    setTransactions(scopedTx);
    setScheduledWhatsApp(scopedWa);

    // If active user is Cloud User (Firebase Auth), establish live real-time listeners!
    if (currentUser.isCloudUser) {
      const unsubRem = subscribeUserReminders(activeUserId, (cloudReminders) => {
        if (cloudReminders.length > 0) {
          setReminders(cloudReminders);
          saveScopedReminders(activeUserId, cloudReminders);
        }
      });
      const unsubLedg = subscribeUserLedgers(activeUserId, (cloudLedgers) => {
        if (cloudLedgers.length > 0) {
          setLedgers(cloudLedgers);
          saveScopedLedgers(activeUserId, cloudLedgers);
        }
      });
      const unsubTx = subscribeUserTransactions(activeUserId, (cloudTransactions) => {
        if (cloudTransactions.length > 0) {
          setTransactions(cloudTransactions);
          saveScopedTransactions(activeUserId, cloudTransactions);
        }
      });
      const unsubWa = subscribeUserScheduledWhatsApp(activeUserId, (cloudWa) => {
        if (cloudWa.length > 0) {
          setScheduledWhatsApp(cloudWa);
          saveScopedScheduledWhatsApp(activeUserId, cloudWa);
        }
      });

      return () => {
        unsubRem();
        unsubLedg();
        unsubTx();
        unsubWa();
      };
    }
  }, [activeUserId, currentUser.isCloudUser]);

  // Synchronize Reminders to LocalStorage & Cloud
  useEffect(() => {
    saveScopedReminders(activeUserId, reminders);
    if (currentUser.isCloudUser) {
      syncRemindersToCloud(activeUserId, reminders);
    }
  }, [reminders, activeUserId, currentUser.isCloudUser]);

  // Synchronize Ledgers to LocalStorage & Cloud
  useEffect(() => {
    saveScopedLedgers(activeUserId, ledgers);
    if (currentUser.isCloudUser) {
      syncLedgersToCloud(activeUserId, ledgers);
    }
  }, [ledgers, activeUserId, currentUser.isCloudUser]);

  // Synchronize Transactions to LocalStorage & Cloud
  useEffect(() => {
    saveScopedTransactions(activeUserId, transactions);
    if (currentUser.isCloudUser) {
      syncTransactionsToCloud(activeUserId, transactions);
    }
  }, [transactions, activeUserId, currentUser.isCloudUser]);

  // Synchronize Scheduled WhatsApp to LocalStorage & Cloud
  useEffect(() => {
    saveScopedScheduledWhatsApp(activeUserId, scheduledWhatsApp);
    if (currentUser.isCloudUser) {
      syncScheduledWhatsAppToCloud(activeUserId, scheduledWhatsApp);
    }
  }, [scheduledWhatsApp, activeUserId, currentUser.isCloudUser]);

  // Account switching and creation handlers
  const handleSwitchUser = (user: AppUser) => {
    setCurrentUser(user);
    setActiveUserId(user.id);
  };

  const handleAddNewProfile = (name: string, email?: string) => {
    const newProfile: AppUser = {
      id: 'user-' + Date.now(),
      displayName: name,
      email: email,
      role: 'staff',
      pin: '0000',
      isCloudUser: false,
      createdAt: new Date().toISOString()
    };
    const updated = [...localProfiles, newProfile];
    setLocalProfiles(updated);
    setCurrentUser(newProfile);
    setActiveUserId(newProfile.id);
  };

  const handleCreateLocalAccountWithRole = (name: string, role: UserRole, pin: string, email?: string) => {
    const newProfile: AppUser = {
      id: 'user-' + Date.now(),
      displayName: name,
      email: email,
      role: role,
      pin: pin,
      isCloudUser: false,
      createdAt: new Date().toISOString()
    };
    const updated = [...localProfiles, newProfile];
    setLocalProfiles(updated);
    setCurrentUser(newProfile);
    setActiveUserId(newProfile.id);
  };

  const handleCloudLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setActiveUserId(user.id);
    setLocalProfiles(prev => {
      if (!prev.some(p => p.id === user.id)) {
        return [user, ...prev];
      }
      return prev.map(p => p.id === user.id ? user : p);
    });
  };

  const handleLogoutToDefault = () => {
    const defaultUser = localProfiles.find(p => !p.isCloudUser) || {
      id: 'user-utama',
      displayName: 'Akun Utama (Pemilik)',
      email: 'pemilik@usaha.id',
      isCloudUser: false,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(defaultUser);
    setActiveUserId(defaultUser.id);
  };

  // Active Ledger entity
  const activeLedger = ledgers.find(l => l.id === activeLedgerId) || ledgers[0];

  // Scheduled Notification & Push Alarm Interval Ticker
  useEffect(() => {
    const checkScheduledReminders = () => {
      const now = new Date().getTime();

      setReminders(prevReminders => {
        let updated = false;
        const nextList = prevReminders.map(task => {
          if (!task.completed && !task.notified) {
            const triggerTime = new Date(task.reminderDateTime).getTime();
            // If current time has reached or passed the trigger time (within last 24 hours)
            if (now >= triggerTime && now - triggerTime < 86400000) {
              updated = true;

              // Fire Native Web Push Notification if browser allows
              showPushNotification(
                `🔔 Pengingat: ${task.title}`,
                task.aiVoiceScript || `${task.title} - ${task.note || 'Waktu agenda Anda telah tiba.'}`,
                task.id
              );

              // Set active in-app alarm pop-up modal with AI Voice
              setTriggeredAlarmTask(task);

              return { ...task, notified: true };
            }
          }
          return task;
        });

        return updated ? nextList : prevReminders;
      });

      // Check scheduled WhatsApp messages for automatic background dispatch
      setScheduledWhatsApp(prevWa => {
        let updated = false;
        const nextWaList = prevWa.map(item => {
          if (item.status === 'pending') {
            const triggerTime = new Date(item.scheduledDateTime).getTime();
            // If due now (within 1 hour window)
            if (now >= triggerTime && now - triggerTime < 3600000) {
              updated = true;

              // 1. Push notification
              showPushNotification(
                `💬 Pesan WhatsApp Terjadwal: ${item.recipientName}`,
                `Pesan [${item.textType}] sedang dikirim otomatis melalui WhatsApp Anda.`,
                item.id
              );

              // 2. Dispatch automatic send via linked WhatsApp session
              sendViaActiveGateway({
                target: item.whatsappNumber,
                message: item.messageContent,
              }).catch(err => {
                console.error('[Auto-Send] Gagal mengirim pesan otomatis:', err);
              });

              // 3. Update recurrence or mark as sent
              if (item.recurrence !== 'none') {
                const nextDate = getNextRecurrenceDate(item.scheduledDate, item.recurrence);
                const nextDateTime = new Date(`${nextDate}T${item.scheduledTime}`).toISOString();
                return {
                  ...item,
                  scheduledDate: nextDate,
                  scheduledDateTime: nextDateTime,
                  lastSentAt: new Date().toISOString(),
                  status: 'pending',
                };
              } else {
                return {
                  ...item,
                  status: 'sent',
                  lastSentAt: new Date().toISOString(),
                };
              }
            }
          }
          return item;
        });
        return updated ? nextWaList : prevWa;
      });
    };

    // Run initial check and then every 8 seconds
    checkScheduledReminders();
    const timer = setInterval(checkScheduledReminders, 8000);
    return () => clearInterval(timer);
  }, []);

  // Reminder Handlers
  const handleSaveReminder = (taskData: Partial<ReminderTask>) => {
    if (taskData.id) {
      // Edit
      setReminders(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } as ReminderTask : t));
    } else {
      // Add
      const newTask: ReminderTask = {
        id: 'rem-' + Date.now(),
        title: taskData.title || '',
        note: taskData.note || '',
        category: taskData.category || 'Usaha',
        dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
        dueTime: taskData.dueTime || '09:00',
        reminderOffsetMinutes: taskData.reminderOffsetMinutes ?? 15,
        reminderDateTime: taskData.reminderDateTime || new Date().toISOString(),
        recurrence: taskData.recurrence || 'none',
        priority: taskData.priority || 'medium',
        completed: false,
        whatsappNumber: taskData.whatsappNumber || '',
        whatsappAutoSend: taskData.whatsappAutoSend || false,
        whatsappCustomMessage: taskData.whatsappCustomMessage || '',
        aiVoiceTone: taskData.aiVoiceTone || 'friendly',
        aiVoiceScript: taskData.aiVoiceScript || '',
        notified: false,
        createdAt: new Date().toISOString(),
      };
      setReminders(prev => [newTask, ...prev]);
    }
  };

  const handleToggleReminderComplete = (id: string) => {
    setReminders(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteReminder = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan pengingat ini?')) {
      setReminders(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSnooze = (taskId: string, minutes: number) => {
    const newTriggerTime = new Date(Date.now() + minutes * 60000).toISOString();
    setReminders(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          reminderDateTime: newTriggerTime,
          notified: false,
        };
      }
      return t;
    }));
    setTriggeredAlarmTask(null);
  };

  const handleMarkAlarmDone = (taskId: string) => {
    handleToggleReminderComplete(taskId);
    setTriggeredAlarmTask(null);
  };

  const handleUpdateAiVoiceScript = (taskId: string, newScript: string, newTone: any) => {
    setReminders(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          aiVoiceScript: newScript,
          aiVoiceTone: newTone,
        };
      }
      return t;
    }));
  };

  // Quick Test Trigger Alarm for demo/verification
  const handleSimulateInstantAlarm = () => {
    const sampleTask: ReminderTask = {
      id: 'test-alarm-' + Date.now(),
      title: 'Uji Coba Pengingat & Suara AI',
      note: 'Notifikasi push terjadwal, pembacaan suara AI alami, dan preview catatan berhasil bekerja sempurna!',
      category: 'Usaha',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '12:00',
      reminderOffsetMinutes: 0,
      reminderDateTime: new Date().toISOString(),
      recurrence: 'none',
      priority: 'high',
      completed: false,
      whatsappNumber: '081234567890',
      whatsappAutoSend: true,
      whatsappCustomMessage: 'Halo! Ini adalah contoh pesan pengingat otomatis WhatsApp.',
      aiVoiceTone: 'friendly',
      aiVoiceScript: 'Halo! Ini adalah simulasi pengingat suara AI berbahasa Indonesia. Catatan tugas dan jadwal agenda Anda siap dipantau dengan mudah!',
      notified: false,
      createdAt: new Date().toISOString(),
    };
    setTriggeredAlarmTask(sampleTask);
  };

  // Transaction Handlers
  const handleSaveTransaction = (txData: Partial<Transaction>) => {
    if (txData.id) {
      setTransactions(prev => prev.map(t => t.id === txData.id ? { ...t, ...txData } as Transaction : t));
    } else {
      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        ledgerId: txData.ledgerId || activeLedgerId,
        type: txData.type || 'income',
        category: txData.category || 'Lain-lain',
        amount: txData.amount || 0,
        title: txData.title || '',
        note: txData.note || '',
        date: txData.date || new Date().toISOString().split('T')[0],
        paymentMethod: txData.paymentMethod || 'Tunai',
        createdAt: new Date().toISOString(),
      };
      setTransactions(prev => [newTx, ...prev]);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data transaksi ini?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Ledger Handlers
  const handleCreateLedger = (ledgerData: Partial<LedgerBook>) => {
    const newL: LedgerBook = {
      id: 'ledger-' + Date.now(),
      name: ledgerData.name || 'Buku Baru',
      description: ledgerData.description || 'Pencatatan kas',
      color: ledgerData.color || 'teal',
      icon: ledgerData.icon || 'BookOpen',
      createdAt: new Date().toISOString(),
    };
    setLedgers(prev => [...prev, newL]);
    setActiveLedgerId(newL.id);
  };

  const handleDeleteLedger = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus buku pembukuan ini? Semua transaksi di dalamnya juga akan terhapus.')) {
      setLedgers(prev => prev.filter(l => l.id !== id));
      setTransactions(prev => prev.filter(t => t.ledgerId !== id));
      if (activeLedgerId === id) {
        setActiveLedgerId(ledgers[0]?.id || 'ledger-usaha');
      }
    }
  };

  // WhatsApp Handlers
  const handleSaveWhatsApp = (data: Omit<ScheduledWhatsApp, 'id' | 'createdAt'>) => {
    if (editingWhatsApp) {
      setScheduledWhatsApp(prev => prev.map(item => 
        item.id === editingWhatsApp.id ? { ...item, ...data } : item
      ));
      setEditingWhatsApp(null);
    } else {
      const newItem: ScheduledWhatsApp = {
        id: 'swa-' + Date.now(),
        ...data,
        createdAt: new Date().toISOString(),
      };
      setScheduledWhatsApp(prev => [newItem, ...prev]);
    }
    setIsWhatsAppModalOpen(false);
  };

  const handleDeleteWhatsApp = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal pesan WhatsApp ini?')) {
      setScheduledWhatsApp(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleToggleWhatsAppStatus = (id: string) => {
    setScheduledWhatsApp(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: item.status === 'pending' ? 'sent' : 'pending',
          lastSentAt: item.status === 'pending' ? new Date().toISOString() : item.lastSentAt
        };
      }
      return item;
    }));
  };

  const handleSendWhatsAppNow = (item: ScheduledWhatsApp) => {
    // Trigger WhatsApp URL in new window / WhatsApp app
    sendScheduledWhatsApp(item);

    // If recurrence is set (daily, weekly, monthly, yearly), advance date and keep as pending
    if (item.recurrence !== 'none') {
      const nextDate = getNextRecurrenceDate(item.scheduledDate, item.recurrence);
      const nextDateTime = new Date(`${nextDate}T${item.scheduledTime}`).toISOString();

      setScheduledWhatsApp(prev => prev.map(i => {
        if (i.id === item.id) {
          return {
            ...i,
            scheduledDate: nextDate,
            scheduledDateTime: nextDateTime,
            lastSentAt: new Date().toISOString(),
            status: 'pending',
          };
        }
        return i;
      }));
    } else {
      // Mark as sent
      setScheduledWhatsApp(prev => prev.map(i => {
        if (i.id === item.id) {
          return {
            ...i,
            status: 'sent',
            lastSentAt: new Date().toISOString(),
          };
        }
        return i;
      }));
    }
  };

  const handleSendWhatsAppViaGateway = async (item: ScheduledWhatsApp): Promise<{ success: boolean; message: string; provider?: string }> => {
    try {
      const res = await sendViaActiveGateway({
        target: item.whatsappNumber,
        message: item.messageContent,
      });

      if (res.status) {
        // If recurrence is set (daily, weekly, monthly, yearly), advance date and keep as pending
        if (item.recurrence !== 'none') {
          const nextDate = getNextRecurrenceDate(item.scheduledDate, item.recurrence);
          const nextDateTime = new Date(`${nextDate}T${item.scheduledTime}`).toISOString();

          setScheduledWhatsApp(prev => prev.map(i => {
            if (i.id === item.id) {
              return {
                ...i,
                scheduledDate: nextDate,
                scheduledDateTime: nextDateTime,
                lastSentAt: new Date().toISOString(),
                status: 'pending',
              };
            }
            return i;
          }));
        } else {
          // Mark as sent
          setScheduledWhatsApp(prev => prev.map(i => {
            if (i.id === item.id) {
              return {
                ...i,
                status: 'sent',
                lastSentAt: new Date().toISOString(),
              };
            }
            return i;
          }));
        }
        return { 
          success: true, 
          message: res.message || 'Pesan berhasil dikirim otomatis melalui WhatsApp Anda!',
          provider: 'direct-wa'
        };
      } else {
        return { 
          success: false, 
          message: res.message || 'Gagal mengirim pesan via WhatsApp.',
          provider: 'direct-wa'
        };
      }
    } catch (err: any) {
      return { 
        success: false, 
        message: err.message || 'Terjadi kesalahan saat mengirim via WhatsApp Gateway.',
      };
    }
  };

  const pendingRemindersCount = reminders.filter(t => !t.completed).length;
  const pendingWhatsAppCount = scheduledWhatsApp.filter(i => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/80 flex flex-col font-sans">
      
      {/* Top Application Header with User Account Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingRemindersCount={pendingRemindersCount}
        pendingWhatsAppCount={pendingWhatsAppCount}
        currentLedgerName={activeLedger.name}
        currentUser={currentUser}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-6">
        
        {/* Dynamic Pages: Beranda (Home Glass Icon Buttons) vs Halaman Pengingat vs Halaman Keuangan vs Halaman WhatsApp */}
        {activeTab === 'home' ? (
          <HomeGlassNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pendingRemindersCount={pendingRemindersCount}
            totalRemindersCount={reminders.length}
            activeLedgerName={activeLedger.name}
            totalTransactionsCount={transactions.filter(t => t.ledgerId === activeLedgerId).length}
            pendingWhatsAppCount={pendingWhatsAppCount}
            totalWhatsAppCount={scheduledWhatsApp.length}
            onSimulateAlarm={handleSimulateInstantAlarm}
            recentReminders={reminders.filter(t => !t.completed).slice(0, 3)}
            recentTransactions={transactions.filter(t => t.ledgerId === activeLedgerId).slice(0, 3)}
            recentScheduledWhatsApp={scheduledWhatsApp.filter(w => w.status === 'pending').slice(0, 3)}
            currentUser={currentUser}
            onOpenAccountModal={() => setIsAccountModalOpen(true)}
          />
        ) : activeTab === 'reminders' ? (
          <div className="space-y-4">
            <PageGlassHeader
              currentTab="reminders"
              onNavigate={setActiveTab}
              pendingRemindersCount={pendingRemindersCount}
              pendingWhatsAppCount={pendingWhatsAppCount}
              activeLedgerName={activeLedger.name}
              currentUser={currentUser}
              onOpenAccountModal={() => setIsAccountModalOpen(true)}
            />
            <ReminderSection
              tasks={reminders}
              onAddTask={() => {
                setEditingReminder(null);
                setIsReminderModalOpen(true);
              }}
              onEditTask={(task) => {
                setEditingReminder(task);
                setIsReminderModalOpen(true);
              }}
              onDeleteTask={handleDeleteReminder}
              onToggleComplete={handleToggleReminderComplete}
              onOpenVoiceModal={(task) => setVoicePreviewTask(task)}
            />
          </div>
        ) : activeTab === 'bookkeeping' ? (
          <div className="space-y-4">
            <PageGlassHeader
              currentTab="bookkeeping"
              onNavigate={setActiveTab}
              pendingRemindersCount={pendingRemindersCount}
              pendingWhatsAppCount={pendingWhatsAppCount}
              activeLedgerName={activeLedger.name}
              currentUser={currentUser}
              onOpenAccountModal={() => setIsAccountModalOpen(true)}
            />
            <BookkeepingSection
              ledgers={ledgers}
              activeLedger={activeLedger}
              onSelectLedger={(id) => setActiveLedgerId(id)}
              onOpenManageLedgers={() => setIsManageLedgersModalOpen(true)}
              onCreateLedger={handleCreateLedger}
              onDeleteLedger={handleDeleteLedger}
              transactions={transactions}
              onAddTransaction={() => {
                setEditingTransaction(null);
                setIsTransactionModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsTransactionModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenAiAnalysis={() => setIsAiAnalysisModalOpen(true)}
            />
          </div>
        ) : activeTab === 'whatsapp' ? (
          <div className="space-y-4">
            <PageGlassHeader
              currentTab="whatsapp"
              onNavigate={setActiveTab}
              pendingRemindersCount={pendingRemindersCount}
              pendingWhatsAppCount={pendingWhatsAppCount}
              activeLedgerName={activeLedger.name}
              currentUser={currentUser}
              onOpenAccountModal={() => setIsAccountModalOpen(true)}
            />
            <WhatsAppSection
              items={scheduledWhatsApp}
              onAdd={() => {
                setEditingWhatsApp(null);
                setIsWhatsAppModalOpen(true);
              }}
              onEdit={(item) => {
                setEditingWhatsApp(item);
                setIsWhatsAppModalOpen(true);
              }}
              onDelete={handleDeleteWhatsApp}
              onToggleStatus={handleToggleWhatsAppStatus}
              onSendNow={handleSendWhatsAppNow}
              onSendViaGateway={handleSendWhatsAppViaGateway}
              onOpenSettings={() => setActiveTab('settings')}
            />
          </div>
        ) : activeTab === 'settings' ? (
          <div className="space-y-4">
            <SettingsPage
              onNavigate={setActiveTab}
              reminders={reminders}
              ledgers={ledgers}
              transactions={transactions}
              scheduledWhatsApp={scheduledWhatsApp}
              onDataImported={(impReminders, impLedgers, impTx, impWa) => {
                if (impReminders) {
                  setReminders(impReminders);
                  saveScopedReminders(activeUserId, impReminders);
                }
                if (impLedgers) {
                  setLedgers(impLedgers);
                  saveScopedLedgers(activeUserId, impLedgers);
                }
                if (impTx) {
                  setTransactions(impTx);
                  saveScopedTransactions(activeUserId, impTx);
                }
                if (impWa) {
                  setScheduledWhatsApp(impWa);
                  saveScopedScheduledWhatsApp(activeUserId, impWa);
                }
              }}
            />
          </div>
        ) : (
          /* Login Page: Masuk Berdasarkan Akun Pemilik dan Staf */
          <div className="space-y-4">
            <LoginPage
              currentUser={currentUser}
              localProfiles={localProfiles}
              onSelectAccount={(selectedUser) => {
                handleSwitchUser(selectedUser);
                setActiveTab('home');
              }}
              onCreateLocalAccount={(name, role, pin, email) => {
                handleCreateLocalAccountWithRole(name, role, pin, email);
              }}
              onCloudLoginSuccess={(cloudUser) => {
                handleCloudLoginSuccess(cloudUser);
                setActiveTab('home');
              }}
              onBackToApp={() => setActiveTab('home')}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12 text-center text-xs text-slate-500">
        <p className="font-medium">
          Catatan Pengingat Tugas &amp; Pembukuan Keuangan • Dilengkapi Suara AI, Multi-Akun &amp; Integrasi WhatsApp Terjadwal
        </p>
      </footer>

      {/* MODALS */}
      {/* 0. Multi-User / Cloud Authentication Account Modal */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        localProfiles={localProfiles}
        onSwitchUser={handleSwitchUser}
        onAddNewProfile={handleAddNewProfile}
        onCloudLoginSuccess={handleCloudLoginSuccess}
        onLogoutToDefault={handleLogoutToDefault}
      />
      
      {/* 1. Add / Edit Reminder Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        editingTask={editingReminder}
      />

      {/* 2. Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        activeLedger={activeLedger}
        editingTransaction={editingTransaction}
      />

      {/* 3. Manage Multi-Ledgers Modal */}
      <ManageLedgersModal
        isOpen={isManageLedgersModalOpen}
        onClose={() => setIsManageLedgersModalOpen(false)}
        ledgers={ledgers}
        activeLedgerId={activeLedgerId}
        onSelectLedger={(id) => setActiveLedgerId(id)}
        onCreateLedger={handleCreateLedger}
        onDeleteLedger={handleDeleteLedger}
      />

      {/* 4. AI Voice Script Preview & Testing Modal */}
      <VoicePreviewModal
        task={voicePreviewTask}
        onClose={() => setVoicePreviewTask(null)}
        onUpdateScript={handleUpdateAiVoiceScript}
      />

      {/* 5. Scheduled Alarm / Push Notification Triggered Pop-up */}
      <AlarmAlertModal
        task={triggeredAlarmTask}
        onClose={() => setTriggeredAlarmTask(null)}
        onMarkDone={handleMarkAlarmDone}
        onSnooze={handleSnooze}
      />

      {/* 6. AI Financial Analysis Modal */}
      <AiAnalysisModal
        isOpen={isAiAnalysisModalOpen}
        onClose={() => setIsAiAnalysisModalOpen(false)}
        ledger={activeLedger}
        transactions={transactions.filter(t => t.ledgerId === activeLedger.id)}
      />

      {/* 7. Scheduled WhatsApp Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          setEditingWhatsApp(null);
        }}
        onSave={handleSaveWhatsApp}
        editingItem={editingWhatsApp}
      />

    </div>
  );
}
