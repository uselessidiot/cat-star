import type { MemoryStarData } from '@/lib/memory-stars';

export type StoredMemory = {
  id: number;
  star: MemoryStarData;
  note: string;
  photos: Blob[];
  createdAt: string;
  testSeed?: boolean;
};

export type CatProfile = {
  name: string;
  guardianName: string;
  metDate: string;
  birthday: string;
  description: string;
  portrait?: Blob;
};

const DATABASE = 'cat-star-local-preview';
const STORE = 'memories';
const PROFILE_STORE = 'cat-profile';
export const MEMORY_STORE_CHANGED = 'cat-star-memory-store-changed';

function announceMemoryStoreChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MEMORY_STORE_CHANGED));
  try {
    window.localStorage.setItem(MEMORY_STORE_CHANGED, String(Date.now()));
  } catch {
    // Local preview storage can be unavailable in private or restricted contexts.
  }
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id' });
      }
      if (!request.result.objectStoreNames.contains(PROFILE_STORE)) {
        request.result.createObjectStore(PROFILE_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredMemories() {
  const database = await openDatabase();
  return new Promise<StoredMemory[]>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as StoredMemory[]);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function saveStoredMemories(memories: StoredMemory[]) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    memories.forEach((memory) => store.put(memory));
    transaction.oncomplete = () => { database.close(); announceMemoryStoreChanged(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function updateStoredMemory(id: number, updates: { star: MemoryStarData; note: string; photos?: Blob[] }) {
  const memories = await getStoredMemories();
  const current = memories.find((memory) => memory.id === id);
  if (!current) return;
  await saveStoredMemories([{ ...current, ...updates }]);
}

export async function deleteStoredMemory(id: number) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => { database.close(); announceMemoryStoreChanged(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getStoredCatProfile() {
  const database = await openDatabase();
  return new Promise<CatProfile | null>((resolve, reject) => {
    const transaction = database.transaction(PROFILE_STORE, 'readonly');
    const request = transaction.objectStore(PROFILE_STORE).get('main');
    request.onsuccess = () => resolve(request.result?.profile ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function saveStoredCatProfile(profile: CatProfile) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(PROFILE_STORE, 'readwrite');
    transaction.objectStore(PROFILE_STORE).put({ key: 'main', profile });
    transaction.oncomplete = () => { database.close(); announceMemoryStoreChanged(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
}
