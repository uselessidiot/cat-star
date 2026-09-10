import type { MemoryStarData } from '@/lib/memory-stars';

export type StoredMemory = {
  id: number;
  star: MemoryStarData;
  note: string;
  photos: Blob[];
  createdAt: string;
};

const DATABASE = 'cat-star-local-preview';
const STORE = 'memories';

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id' });
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
    transaction.oncomplete = () => { database.close(); resolve(); };
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
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
}
