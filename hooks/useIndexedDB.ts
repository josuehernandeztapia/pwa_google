import { useState, useEffect, useCallback } from 'react';
import { IndexedDBService } from '../services/storage/indexedDB';
import { DocumentStorage, Client } from '../types/index';

// Create a singleton instance of the service
const dbService = new IndexedDBService();

export const useIndexedDB = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    dbService.initDB().then(() => {
        if(isMounted) setIsReady(true);
    }).catch(error => {
        console.error("Failed to initialize IndexedDB", error);
    });
    return () => { isMounted = false; };
  }, []);

  const storeDocument = useCallback(async (doc: DocumentStorage) => {
    if (!isReady) throw new Error('DB not ready');
    return dbService.storeDocument(doc);
  }, [isReady]);

  const getClientDocuments = useCallback(async (clientId: string) => {
      if (!isReady) throw new Error('DB not ready');
      return dbService.getClientDocuments(clientId);
  }, [isReady]);

  const cacheClients = useCallback(async (clients: Client[]) => {
      if (!isReady) throw new Error('DB not ready');
      return dbService.cacheClients(clients);
  }, [isReady]);

  const getCachedClients = useCallback(async () => {
      if (!isReady) throw new Error('DB not ready');
      return dbService.getCachedClients();
  }, [isReady]);

  
  return { storeDocument, getClientDocuments, isReady, dbService, cacheClients, getCachedClients };
};