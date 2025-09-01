import { DocumentSignData, MifielDocument, DocumentStatusResponse } from '../../types/index';

interface MifielConfig {
  appId: string;
  appSecret: string; // WARNING: Should only exist on a secure backend
  baseUrl: string;
}

export class MifielService {
  private config: MifielConfig;

  constructor(config: MifielConfig) {
    this.config = config;
  }

  private getAuthHeaders(): Record<string, string> {
    // CRITICAL: This is unsafe on the client, for demonstration only.
    // App ID and Secret must never be exposed client-side.
    const auth = btoa(`${this.config.appId}:${this.config.appSecret}`);
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
  }

  async createDocument(documentData: DocumentSignData): Promise<MifielDocument> {
    // Mock implementation - real call would be made from backend
    console.log("[MOCK MIFIEL CALL] Creating document for signing:", documentData.name);
    return new Promise(resolve => setTimeout(() => resolve({ id: `mifiel-doc-${Date.now()}` }), 1000));
  }

  async getDocumentStatus(documentId: string): Promise<DocumentStatusResponse> {
    // Mock implementation
    console.log(`[MOCK MIFIEL CALL] Getting document status for: ${documentId}`);
    return new Promise(resolve => setTimeout(() => resolve({ id: documentId, status: 'pending' }), 600));
  }

  async downloadSignedDocument(documentId: string): Promise<Blob> {
    // Mock implementation
    console.log(`[MOCK MIFIEL CALL] Downloading signed document: ${documentId}`);
    const blob = new Blob(["Mock PDF content for signed document."], { type: "application/pdf" });
    return Promise.resolve(blob);
  }
}