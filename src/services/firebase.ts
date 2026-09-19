import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { ReminderTask, Transaction, LedgerBook, ScheduledWhatsApp } from '../types';

export { 
  signInWithPopup, 
  fbSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged 
};
export const firebaseApp = !getApps().length ? initializeApp(config) : getApp();
export const db = getFirestore(firebaseApp, config.firestoreDatabaseId || undefined);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// Connection verification
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network error.');
    }
    return false;
  }
}

// Subscriptions & Sync per User ID
export function subscribeUserReminders(
  userId: string, 
  callback: (reminders: ReminderTask[]) => void
): () => void {
  const colRef = collection(db, 'users', userId, 'reminders');
  const q = query(colRef);
  return onSnapshot(q, (snapshot) => {
    const list: ReminderTask[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ReminderTask);
    });
    callback(list);
  }, (err) => {
    console.warn('Firestore reminders sync warning:', err);
  });
}

export function subscribeUserLedgers(
  userId: string, 
  callback: (ledgers: LedgerBook[]) => void
): () => void {
  const colRef = collection(db, 'users', userId, 'ledgers');
  const q = query(colRef);
  return onSnapshot(q, (snapshot) => {
    const list: LedgerBook[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as LedgerBook);
    });
    callback(list);
  }, (err) => {
    console.warn('Firestore ledgers sync warning:', err);
  });
}

export function subscribeUserTransactions(
  userId: string, 
  callback: (txs: Transaction[]) => void
): () => void {
  const colRef = collection(db, 'users', userId, 'transactions');
  const q = query(colRef);
  return onSnapshot(q, (snapshot) => {
    const list: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Transaction);
    });
    callback(list);
  }, (err) => {
    console.warn('Firestore transactions sync warning:', err);
  });
}

export function subscribeUserScheduledWhatsApp(
  userId: string, 
  callback: (items: ScheduledWhatsApp[]) => void
): () => void {
  const colRef = collection(db, 'users', userId, 'scheduledWhatsApp');
  const q = query(colRef);
  return onSnapshot(q, (snapshot) => {
    const list: ScheduledWhatsApp[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ScheduledWhatsApp);
    });
    callback(list);
  }, (err) => {
    console.warn('Firestore scheduledWhatsApp sync warning:', err);
  });
}

// Batch / Single operations in Firestore for user
export async function syncRemindersToCloud(userId: string, reminders: ReminderTask[]): Promise<void> {
  try {
    for (const item of reminders) {
      await setDoc(doc(db, 'users', userId, 'reminders', item.id), {
        ...item,
        userId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.error('Error syncing reminders to cloud:', err);
  }
}

export async function deleteReminderFromCloud(userId: string, reminderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'reminders', reminderId));
  } catch (err) {
    console.error('Error deleting reminder from cloud:', err);
  }
}

export async function syncLedgersToCloud(userId: string, ledgers: LedgerBook[]): Promise<void> {
  try {
    for (const item of ledgers) {
      await setDoc(doc(db, 'users', userId, 'ledgers', item.id), {
        ...item,
        userId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.error('Error syncing ledgers to cloud:', err);
  }
}

export async function deleteLedgerFromCloud(userId: string, ledgerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'ledgers', ledgerId));
  } catch (err) {
    console.error('Error deleting ledger from cloud:', err);
  }
}

export async function syncTransactionsToCloud(userId: string, txs: Transaction[]): Promise<void> {
  try {
    for (const item of txs) {
      await setDoc(doc(db, 'users', userId, 'transactions', item.id), {
        ...item,
        userId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.error('Error syncing transactions to cloud:', err);
  }
}

export async function deleteTransactionFromCloud(userId: string, txId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'transactions', txId));
  } catch (err) {
    console.error('Error deleting transaction from cloud:', err);
  }
}

export async function syncScheduledWhatsAppToCloud(userId: string, items: ScheduledWhatsApp[]): Promise<void> {
  try {
    for (const item of items) {
      await setDoc(doc(db, 'users', userId, 'scheduledWhatsApp', item.id), {
        ...item,
        userId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.error('Error syncing scheduledWhatsApp to cloud:', err);
  }
}

export async function deleteScheduledWhatsAppFromCloud(userId: string, waId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'scheduledWhatsApp', waId));
  } catch (err) {
    console.error('Error deleting scheduled WhatsApp from cloud:', err);
  }
}
