import { IndexedDBService } from '../storage/indexedDB';
import { OdooApiService } from '../api/odooApiService';
import { SyncOperation } from '../../types/index';

class DataSyncService {
  private indexedDB: IndexedDBService;
  private odooApi: OdooApiService;
  private isSyncing = false;

  constructor(indexedDB: IndexedDBService, odooApi: OdooApiService) {
    this.indexedDB = indexedDB;
    this.odooApi = odooApi;
    
    // Auto-sync every 5 minutes if online
    setInterval(() => {
        if(navigator.onLine) {
            this.processSyncQueue()
        }
    }, 5 * 60 * 1000);

    // Add event listener for online status changes
    window.addEventListener('online', () => this.processSyncQueue());
  }

  async queueOperation(operation: Omit<SyncOperation, 'id'>): Promise<void> {
    await this.indexedDB.addToSyncQueue(operation);
    
    // Trigger sync immediately if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }
  }

  async processSyncQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    const pendingOps = await this.indexedDB.getPendingSyncOperations();
    if (pendingOps.length === 0) {
        this.isSyncing = false;
        return;
    }
    
    console.log(`[SYNC] Processing ${pendingOps.length} items from sync queue.`);

    for (const op of pendingOps) {
      try {
        await this.executeSyncOperation(op);
        await this.indexedDB.removeSyncOperation(op.id);
      } catch (error) {
        op.retries++;
        if (op.retries < 3) {
          await this.indexedDB.updateSyncOperation(op);
        } else {
          console.error('[SYNC] Max retries reached for sync operation:', op);
          // Potentially move to a "failed" queue
        }
      }
    }
    this.isSyncing = false;
  }

  private async executeSyncOperation(op: SyncOperation): Promise<void> {
    console.log(`[SYNC] Executing operation: ${op.type} ${op.entity}`);
    switch (op.entity) {
      case 'client':
        if (op.type === 'CREATE') {
          await this.odooApi.createClient(op.data);
        } else if (op.type === 'UPDATE') {
          await this.odooApi.updateClient(op.data.id, op.data);
        }
        break;
      case 'document':
        await this.odooApi.uploadDocument(op.data.clientId, op.data.docData);
        break;
      // ... more entities
      default:
        throw new Error(`Unknown entity type for sync: ${op.entity}`);
    }
  }
}

// Singleton instance
let dataSyncServiceInstance: DataSyncService;

export const getDataSyncService = (indexedDB: IndexedDBService, odooApi: OdooApiService) => {
    if (!dataSyncServiceInstance) {
        dataSyncServiceInstance = new DataSyncService(indexedDB, odooApi);
    }
    return dataSyncServiceInstance;
}