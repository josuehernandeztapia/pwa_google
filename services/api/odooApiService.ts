import { Client, OpportunityData, DocumentData, OCRResult, SavingsPlanData, PaymentEventData } from '../../types/index';

// Interfaces for Odoo data structures (simplified)
interface OdooConfig {
  baseUrl: string;
  database: string;
  username: string;
  password: string;
}

export class OdooApiService {
  private config: OdooConfig;
  private sessionId: string | null = null;

  constructor(config: OdooConfig) {
    this.config = config;
  }

  async authenticate(): Promise<string> {
    // MOCK: In a real app, this would make a network request.
    console.log("[MOCK ODOO] Authenticating...");
    this.sessionId = `mock_session_${Date.now()}`;
    return Promise.resolve(this.sessionId);
  }

  async callOdoo(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    // This is a mock implementation. A real app would use the authenticated fetch call.
    console.log(`[MOCK ODOO CALL] Model: ${model}, Method: ${method}, Args:`, args, 'KWArgs:', kwargs);
    if (!this.sessionId) await this.authenticate();
    // Simulate empty successful response
    return Promise.resolve({ jsonrpc: '2.0', id: null, result: [] });
  }

  async getClients(market?: string): Promise<Client[]> {
    const domain = market ? [['market', '=', market]] : [];
    const response = await this.callOdoo('res.partner', 'search_read', [domain], {
      fields: ['name', 'email', 'phone', 'street', 'city', 'state_id', 'country_id']
    });
    // The response needs to be mapped to the Client interface. For mock, return empty.
    return response.result || [];
  }

  async createClient(data: Partial<Client>): Promise<any> {
      return this.callOdoo('res.partner', 'create', [data]);
  }

  async updateClient(clientId: string, data: Partial<Client>): Promise<any> {
      return this.callOdoo('res.partner', 'write', [[parseInt(clientId)], data]);
  }

  async createOpportunity(data: OpportunityData): Promise<any> {
    return this.callOdoo('crm.lead', 'create', [data]);
  }

  async updateClientStage(clientId: string, stageId: string): Promise<any> {
    return this.callOdoo('res.partner', 'write', [[parseInt(clientId)], { stage_id: parseInt(stageId) }]);
  }

  async uploadDocument(clientId: string, docData: DocumentData): Promise<any> {
    return this.callOdoo('ir.attachment', 'create', [{
      name: docData.filename,
      datas: docData.base64,
      res_model: 'res.partner',
      res_id: parseInt(clientId),
      mimetype: docData.mimeType
    }]);
  }

  async processOCR(attachmentId: string): Promise<OCRResult> {
    return this.callOdoo('document.ocr', 'process_document', [parseInt(attachmentId)]);
  }

  async createAnalyticAccount(planData: SavingsPlanData): Promise<any> {
    return this.callOdoo('account.analytic.account', 'create', [planData]);
  }

  async registerPaymentEvent(clientId: string, paymentData: PaymentEventData): Promise<any> {
    return this.callOdoo('account.payment', 'create', [paymentData]);
  }
}