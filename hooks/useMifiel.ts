import { useCallback } from 'react';
import { MifielService } from '../services/signatures/mifielService';
// Fix: Correct import path to resolve type error.
import { DocumentSignData } from '../types/index';

// In a real app, these would come from .env files and secrets would NEVER be here.
const MIFIEL_CONFIG = {
    appId: 'app_xxx',
    appSecret: 'secret_xxx_SERVER_SIDE_ONLY',
    baseUrl: 'https://www.mifiel.com/api/v1'
};

const mifielService = new MifielService(MIFIEL_CONFIG);

export const useMifiel = () => {
  const createDocument = useCallback(async (data: DocumentSignData) => {
    // In a real app, this hook would call our OWN backend,
    // which would then securely call Mifiel's API.
    return mifielService.createDocument(data);
  }, []);

  const getDocumentStatus = useCallback(async (documentId: string) => {
    return mifielService.getDocumentStatus(documentId);
  }, []);

  return { 
      createDocument, 
      getDocumentStatus
  };
};