import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Log } from '../types';

export function subscribeToAllLogs(
  callback: (logs: Log[]) => void
): () => void {
  const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Log[];
    callback(logs);
  });
}

export function subscribeToUserLogs(
  uid: string,
  callback: (logs: Log[]) => void
): () => void {
  const q = query(
    collection(db, 'logs'),
    where('userId', '==', uid),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Log[];
    callback(logs);
  });
}

export function subscribeToGlobalStats(
  callback: (totalWeightLifted: number) => void
): () => void {
  return onSnapshot(doc(db, 'stats', 'global'), (snapshot) => {
    if (snapshot.exists()) {
      callback((snapshot.data().totalWeightLifted as number) || 0);
    }
  });
}

export async function addLog(
  user: User,
  weight: number,
  dateInput: string
): Promise<void> {
  const [y, m, d] = dateInput.split('-').map(Number);
  const selectedDate = new Date(y, m - 1, d);
  const now = new Date();
  const isToday =
    selectedDate.getDate() === now.getDate() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getFullYear() === now.getFullYear();

  const timestamp = isToday
    ? serverTimestamp()
    : Timestamp.fromDate(selectedDate);

  const batch = writeBatch(db);

  const logRef = doc(collection(db, 'logs'));
  batch.set(logRef, {
    userId: user.uid,
    userName: user.displayName || 'Anonymous',
    weight,
    timestamp,
    photoURL: user.photoURL,
  });

  batch.update(doc(db, 'stats', 'global'), {
    totalWeightLifted: increment(weight),
  });

  await batch.commit();
}

export async function deleteLog(logId: string, weight: number): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'logs', logId));
  batch.update(doc(db, 'stats', 'global'), {
    totalWeightLifted: increment(-weight),
  });
  await batch.commit();
}
