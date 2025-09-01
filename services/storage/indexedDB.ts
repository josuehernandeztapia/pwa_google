import { Client, DocumentStorage, SyncOperation } from '../../types/index';

export class IndexedDBService {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<void> | null = null;

  initDB(): Promise<void> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (this.db) return resolve();
        const request = indexedDB.open('ConductoresPWA', 2);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('documents')) {
            const docStore = db.createObjectStore('documents', { keyPath: 'id' });
            docStore.createIndex('clientId', 'clientId');
            docStore.createIndex('type', 'type');
          }

          if (!db.objectStoreNames.contains('clients')) {
            const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
            clientStore.createIndex('status', 'status');
          }

          if (!db.objectStoreNames.contains('sync_queue')) {
            db.createObjectStore('sync_queue', { keyPath: 'id' });
          }
        };
      });
    }
    return this.dbPromise;
  }
  
  private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
      if (!this.db) {
          throw new Error("Database is not initialized.");
      }
      const transaction = this.db.transaction([storeName], mode);
      return transaction.objectStore(storeName);
  }

  private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
  }

  async storeDocument(document: DocumentStorage): Promise<void> {
    const store = this.getStore('documents', 'readwrite');
    await this.requestToPromise(store.put(document));
  }

  async getClientDocuments(clientId: string): Promise<DocumentStorage[]> {
    const store = this.getStore('documents', 'readonly');
    const index = store.index('clientId');
    return await this.requestToPromise(index.getAll(clientId));
  }

  async cacheClients(clients: Client[]): Promise<void> {
    const store = this.getStore('clients', 'readwrite');
    const transaction = store.transaction;
    // Clear existing clients before caching new ones to avoid stale data
    store.clear(); 
    clients.forEach(client => store.put(client));
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
  }
  
  async getCachedClients(): Promise<Client[]> {
    const store = this.getStore('clients', 'readonly');
    return await this.requestToPromise(store.getAll());
  }

  async addToSyncQueue(operation: Omit<SyncOperation, 'id'>): Promise<void> {
    const syncOpWithId: SyncOperation = { ...operation, id: crypto.randomUUID() };
    const store = this.getStore('sync_queue', 'readwrite');
    await this.requestToPromise(store.add(syncOpWithId));
  }

  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    const store = this.getStore('sync_queue', 'readonly');
    return await this.requestToPromise(store.getAll());
  }

  async removeSyncOperation(id: string): Promise<void> {
    const store = this.getStore('sync_queue', 'readwrite');
    await this.requestToPromise(store.delete(id));
  }

  async updateSyncOperation(op: SyncOperation): Promise<void> {
    const store = this.getStore('sync_queue', 'readwrite');
    await this.requestToPromise(store.put(op));
  }
}