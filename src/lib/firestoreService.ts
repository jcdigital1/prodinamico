import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { ModelCalibration, PlateBatch, PlateItem, DynamicQrRecord, UserProfile, UserStatus } from '../types';
import { OFFICIAL_MODELS } from './modelsData';

export function formatPlateNumber(n: number): string {
  return String(n).padStart(6, '0');
}

/**
 * Generate cryptographically sound, human-readable unique QR token
 */
export function generateQrId(): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  let result = 'dp';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Atomic reservation of plate numbers via Firestore transaction
 */
export async function reservePlateNumbers(quantity: number): Promise<{ startNumber: number; endNumber: number }> {
  const counterRef = doc(db, 'counters', 'plate_counter');

  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let current = 0;

      if (counterSnap.exists()) {
        const data = counterSnap.data();
        current = Number(data.currentNumber) || 0;
      }

      const startNumber = current + 1;
      const endNumber = current + quantity;

      transaction.set(
        counterRef,
        {
          currentNumber: endNumber,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return { startNumber, endNumber };
    });

    return result;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'counters/plate_counter');
  }
}

/**
 * Create a new Batch of plates and dynamic QR records
 */
export async function createBatchWithPlates(params: {
  buyerId: string;
  buyerEmail: string;
  modelId: string;
  quantity: number;
  batchName: string;
  defaultTargetUrl?: string;
}): Promise<{ batch: PlateBatch; plates: PlateItem[] }> {
  const { buyerId, buyerEmail, modelId, quantity, batchName, defaultTargetUrl } = params;

  // 1. Reserve unique continuous numbers atomically
  const { startNumber, endNumber } = await reservePlateNumbers(quantity);

  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newBatch: PlateBatch = {
    id: batchId,
    name: batchName.trim() || `Lote ${new Date().toLocaleDateString('pt-BR')}`,
    buyerId,
    buyerEmail,
    modelId,
    quantity,
    startNumber,
    endNumber,
    createdAt: now,
  };

  const plates: PlateItem[] = [];
  const qrRecords: DynamicQrRecord[] = [];

  const initialUrl = (defaultTargetUrl || '').trim();

  for (let num = startNumber; num <= endNumber; num++) {
    const plateId = `plate_${num}`;
    const qrCodeId = generateQrId();
    const formatted = formatPlateNumber(num);

    const plate: PlateItem = {
      id: plateId,
      plateNumber: num,
      formattedNumber: formatted,
      batchId,
      buyerId,
      modelId,
      qrCodeId,
      targetUrl: initialUrl,
      title: `Plaquinha Nº ${formatted}`,
      clickCount: 0,
      createdAt: now,
    };

    const qrRecord: DynamicQrRecord = {
      id: qrCodeId,
      plateNumber: num,
      formattedNumber: formatted,
      buyerId,
      targetUrl: initialUrl,
      clickCount: 0,
      createdAt: now,
    };

    plates.push(plate);
    qrRecords.push(qrRecord);
  }

  try {
    // Save batch document
    await setDoc(doc(db, 'batches', batchId), newBatch);

    // Save individual plates and dynamic QR docs
    for (const plate of plates) {
      await setDoc(doc(db, 'plates', plate.id), plate);
    }
    for (const qr of qrRecords) {
      await setDoc(doc(db, 'qrcodes', qr.id), qr);
    }

    return { batch: newBatch, plates };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'batches/' + batchId);
  }
}

/**
 * Fetch Batches for a specific buyer (or all for admin)
 */
export async function getBatches(buyerId: string, isAdmin: boolean): Promise<PlateBatch[]> {
  try {
    const batchesRef = collection(db, 'batches');
    const q = isAdmin
      ? query(batchesRef, orderBy('createdAt', 'desc'))
      : query(batchesRef, where('buyerId', '==', buyerId), orderBy('createdAt', 'desc'));

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PlateBatch);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'batches');
  }
}

/**
 * Fetch Plates by Batch
 */
export async function getPlatesByBatch(batchId: string): Promise<PlateItem[]> {
  try {
    const platesRef = collection(db, 'plates');
    const q = query(platesRef, where('batchId', '==', batchId), orderBy('plateNumber', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PlateItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'plates');
  }
}

/**
 * Fetch All Plates for buyer or admin
 */
export async function getAllPlates(buyerId: string, isAdmin: boolean): Promise<PlateItem[]> {
  try {
    const platesRef = collection(db, 'plates');
    const q = isAdmin
      ? query(platesRef, orderBy('plateNumber', 'desc'))
      : query(platesRef, where('buyerId', '==', buyerId), orderBy('plateNumber', 'desc'));

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PlateItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'plates');
  }
}

/**
 * Update dynamic destination URL of a QR code and plate
 */
export async function updateQrTargetUrl(qrCodeId: string, plateId: string, newTargetUrl: string): Promise<void> {
  const cleanUrl = newTargetUrl.trim();
  const now = new Date().toISOString();

  try {
    await updateDoc(doc(db, 'qrcodes', qrCodeId), {
      targetUrl: cleanUrl,
      updatedAt: now,
    });

    await updateDoc(doc(db, 'plates', plateId), {
      targetUrl: cleanUrl,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `qrcodes/${qrCodeId}`);
  }
}

/**
 * Resolve dynamic QR code destination and increment real click read
 */
export async function resolveAndRecordQrRead(qrId: string): Promise<DynamicQrRecord | null> {
  const qrRef = doc(db, 'qrcodes', qrId);
  try {
    const snap = await getDoc(qrRef);
    if (!snap.exists()) return null;

    const data = snap.data() as DynamicQrRecord;

    // Real click registration
    updateDoc(qrRef, {
      clickCount: increment(1),
      lastClickAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).catch((e) => console.warn('Falha assíncrona ao registrar leitura do QR:', e));

    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `qrcodes/${qrId}`);
  }
}

/**
 * Fetch model calibrations (merges Firestore custom calibrations with defaults)
 */
export async function getModelCalibrations(): Promise<Record<string, ModelCalibration>> {
  const calibrations: Record<string, ModelCalibration> = {};
  OFFICIAL_MODELS.forEach((m) => {
    calibrations[m.modelId] = { ...m };
  });

  try {
    const snap = await getDocs(collection(db, 'calibrations'));
    snap.docs.forEach((d) => {
      const data = d.data() as ModelCalibration;
      if (data.modelId) {
        calibrations[data.modelId] = data;
      }
    });
  } catch (e) {
    console.warn('Usando calibrações padrão:', e);
  }

  return calibrations;
}

/**
 * Save custom calibration for a model (Admin only)
 */
export async function saveModelCalibration(model: ModelCalibration): Promise<void> {
  try {
    const ref = doc(db, 'calibrations', model.modelId);
    await setDoc(ref, {
      ...model,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `calibrations/${model.modelId}`);
  }
}

/**
 * Fetch all registered users for Admin management
 */
export function subscribeToUsers(callback: (users: UserProfile[]) => void, onError: (err: any) => void) {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    usersRef,
    (snap) => {
      const users = snap.docs.map((d) => d.data() as UserProfile);
      // Sort: pending first, then by createdAt desc
      users.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      callback(users);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      onError(error);
    }
  );
}

/**
 * Update buyer status (Admin only: 'approved' | 'blocked' | 'pending')
 */
export async function updateUserStatus(uid: string, status: UserStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

/**
 * Get real administrator statistics from Firestore
 */
export async function getAdminRealStats() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map((d) => d.data() as UserProfile);

    const buyers = users.filter((u) => u.role === 'buyer');
    const buyersTotal = buyers.length;
    const buyersPending = buyers.filter((u) => u.status === 'pending').length;
    const buyersApproved = buyers.filter((u) => u.status === 'approved').length;
    const buyersBlocked = buyers.filter((u) => u.status === 'blocked').length;

    const batchesSnap = await getDocs(collection(db, 'batches'));
    const batchesCount = batchesSnap.size;

    const platesSnap = await getDocs(collection(db, 'plates'));
    const platesCount = platesSnap.size;

    const qrcodesSnap = await getDocs(collection(db, 'qrcodes'));
    const qrcodesCount = qrcodesSnap.size;

    let totalReads = 0;
    qrcodesSnap.docs.forEach((doc) => {
      const data = doc.data();
      totalReads += Number(data.clickCount) || 0;
    });

    return {
      buyersTotal,
      buyersPending,
      buyersApproved,
      buyersBlocked,
      batchesCount,
      platesCount,
      qrcodesCount,
      totalReads,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'admin_stats');
  }
}
