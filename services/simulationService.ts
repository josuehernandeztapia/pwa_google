

import { Client, BusinessFlow, DocumentStatus, EventLog, Actor, PaymentLinkDetails, Document, CollectiveCreditGroup, CollectiveCreditMember, EventType, OpportunityStage, ImportStatus, Notification, NotificationType, ActionableGroup, ActionableClient, Ecosystem, Quote, Market, ProtectionScenario, TandaGroupInput, TandaSimConfig, TandaSimulationResult, TandaMonthState, TandaAward, TandaRiskBadge, View } from '../types/index';
import { annuity, getBalance } from '../utils/financial';

// Use mutable maps to simulate a database
const clientsDB = new Map<string, Client>();
const collectiveCreditGroupsDB = new Map<string, CollectiveCreditGroup>();
const ecosystemsDB = new Map<string, Ecosystem>();


// --- Document Checklists ---
const CONTADO_DOCS: Document[] = [
    { id: '1', name: 'INE Vigente', status: DocumentStatus.Pendiente },
    { id: '2', name: 'Comprobante de domicilio', status: DocumentStatus.Pendiente },
    { id: '3', name: 'Constancia de situación fiscal', status: DocumentStatus.Pendiente },
];
const AGUASCALIENTES_FINANCIERO_DOCS: Document[] = [
    { id: '1', name: 'INE Vigente', status: DocumentStatus.Pendiente },
    { id: '2', name: 'Comprobante de domicilio', status: DocumentStatus.Pendiente },
    { id: '3', name: 'Tarjeta de circulación', status: DocumentStatus.Pendiente },
    { id: '4', name: 'Copia de la concesión', status: DocumentStatus.Pendiente },
    { id: '5', name: 'Constancia de situación fiscal', status: DocumentStatus.Pendiente },
    { id: '6', name: 'Verificación Biométrica (Metamap)', status: DocumentStatus.Pendiente },
];
const EDOMEX_MIEMBRO_DOCS: Document[] = [
    ...AGUASCALIENTES_FINANCIERO_DOCS,
    { id: '7', name: 'Carta Aval de Ruta', status: DocumentStatus.Pendiente, tooltip: "Documento emitido y validado por el Ecosistema/Ruta." },
    { id: '8', name: 'Convenio de Dación en Pago', status: DocumentStatus.Pendiente, tooltip: "Convenio que formaliza el colateral social." },
];
const EDOMEX_AHORRO_DOCS: Document[] = [
    { id: '1', name: 'INE Vigente', status: DocumentStatus.Pendiente },
    { id: '2', name: 'Comprobante de domicilio', status: DocumentStatus.Pendiente },
];


// Helper to add derived properties for UI components
const addDerivedGroupProperties = (group: CollectiveCreditGroup): CollectiveCreditGroup => {
    const isSavingPhase = group.unitsDelivered < group.totalUnits;
    const isPayingPhase = group.unitsDelivered > 0;

    let phase: 'saving' | 'payment' | 'dual' | 'completed' = 'saving';
    if (isSavingPhase && isPayingPhase) {
        phase = 'dual';
    } else if (isPayingPhase && !isSavingPhase) {
        phase = 'payment';
    } else if (group.unitsDelivered === group.totalUnits) {
        phase = 'payment';
    }


    return {
        ...group,
        phase,
        savingsGoal: group.savingsGoalPerUnit,
        currentSavings: group.currentSavingsProgress,
        monthlyPaymentGoal: group.monthlyPaymentPerUnit * group.unitsDelivered,
    };
};

// --- INITIAL DATA ---
const initialEcosystems: Ecosystem[] = [
    { id: 'eco-1', name: 'Ruta 27 de Toluca S.A. de C.V.', status: 'Activo', documents: [{id: 'eco-1-doc-1', name: 'Acta Constitutiva de la Ruta', status: DocumentStatus.Aprobado}, {id: 'eco-1-doc-2', name: 'Poder del Representante Legal', status: DocumentStatus.Aprobado}]},
    { id: 'eco-2', name: 'Autotransportes de Tlalnepantla', status: 'Expediente Pendiente', documents: [{id: 'eco-2-doc-1', name: 'Acta Constitutiva de la Ruta', status: DocumentStatus.Pendiente}]},
];

const collectiveCreditClients: Client[] = Array.from({ length: 12 }, (_, i) => ({
  id: `cc-${i + 1}`,
  name: `Miembro Crédito Colectivo ${i + 1}`,
  avatarUrl: `https://picsum.photos/seed/cc-member-${i+1}/100/100`,
  flow: BusinessFlow.CreditoColectivo,
  status: 'Activo en Grupo',
  healthScore: 80,
  documents: EDOMEX_AHORRO_DOCS.map(d => ({ ...d, status: DocumentStatus.Aprobado })),
  events: [
      { id: `evt-cc-${i+1}`, timestamp: new Date(Date.now() - (i*5*24*60*60*1000)), message: `Aportación individual realizada.`, actor: Actor.Cliente, type: EventType.Contribution, details: {amount: 15000 * Math.random(), currency: 'MXN'} }
  ],
  collectiveCreditGroupId: i < 5 ? 'cc-2405' : (i < 9 ? 'cc-2406' : 'cc-2408'),
  ecosystemId: 'eco-1'
}));

const initialClients: Client[] = [
  {
    id: '1',
    name: 'Juan Pérez (Venta a Plazo AGS)',
    avatarUrl: 'https://picsum.photos/seed/juan/100/100',
    flow: BusinessFlow.VentaPlazo,
    status: 'Activo',
    healthScore: 85,
    remainderAmount: 341200, // For Venta a Plazo
    paymentPlan: {
        monthlyGoal: 18282.88,
        currentMonthProgress: 6000,
        currency: 'MXN',
        methods: {
            collection: true,
            voluntary: true
        },
        collectionDetails: {
            plates: ['XYZ-123-A'],
            pricePerLiter: 5
        }
    },
    protectionPlan: {
        type: 'Esencial',
        restructuresAvailable: 1,
        restructuresUsed: 0,
        annualResets: 1,
    },
    documents: AGUASCALIENTES_FINANCIERO_DOCS.map((doc, i) => ({
      ...doc,
      status: i < 2 ? DocumentStatus.Aprobado : DocumentStatus.Pendiente
    })),
    events: [
      { id: 'evt1-3', timestamp: new Date(), message: 'Aportación Voluntaria confirmada.', actor: Actor.Sistema, type: EventType.Contribution, details: { amount: 5000, currency: 'MXN' } },
      { id: 'evt1-4', timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000), message: 'Recaudación Flota (Placa XYZ-123-A).', actor: Actor.Sistema, type: EventType.Collection, details: { amount: 1000, currency: 'MXN', plate: 'XYZ-123-A' } },
      { id: 'evt1-2', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), message: 'Documento INE/IFE cargado.', actor: Actor.Cliente, type: EventType.ClientAction },
      { id: 'evt1-1', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), message: 'Plan de Venta a Plazo creado.', actor: Actor.Asesor, type: EventType.AdvisorAction },
    ],
  },
  {
    id: '2',
    name: 'Maria García (EdoMex)',
    avatarUrl: 'https://picsum.photos/seed/maria/100/100',
    flow: BusinessFlow.VentaPlazo,
    status: 'Pagos al Corriente',
    healthScore: 92,
    ecosystemId: 'eco-1',
    remainderAmount: 818500,
    paymentPlan: {
        monthlyGoal: 22836.83,
        currentMonthProgress: 9500,
        currency: 'MXN',
        methods: {
            collection: true,
            voluntary: true,
        },
        collectionDetails: {
            plates: ['MGA-789-C'],
            pricePerLiter: 7,
        }
    },
    protectionPlan: {
        type: 'Total',
        restructuresAvailable: 3,
        restructuresUsed: 1,
        annualResets: 3,
    },
    documents: EDOMEX_MIEMBRO_DOCS.map(doc => ({ ...doc, status: DocumentStatus.Aprobado })),
    events: [
      { id: 'evt2-3', timestamp: new Date(), message: 'Aportación a mensualidad confirmada.', actor: Actor.Sistema, type: EventType.Contribution, details: { amount: 5000, currency: 'MXN' } },
      { id: 'evt2-2', timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), message: 'Restructura de plan aplicada.', actor: Actor.Asesor, type: EventType.AdvisorAction },
    ]
  },
  {
    id: '3',
    name: 'Carlos Sánchez (Ahorro EdoMex)',
    avatarUrl: 'https://picsum.photos/seed/carlos/100/100',
    flow: BusinessFlow.AhorroProgramado,
    status: 'Meta Alcanzada',
    healthScore: 95,
    ecosystemId: 'eco-1',
    savingsPlan: {
      progress: 153075,
      goal: 153075,
      totalValue: 837000,
      currency: 'MXN',
      methods: {
        collection: true,
        voluntary: true,
      },
      collectionDetails: {
        plates: ['CSA-456-B'],
        pricePerLiter: 8
      }
    },
    documents: EDOMEX_AHORRO_DOCS.map(doc => ({ ...doc, status: DocumentStatus.Aprobado })),
    events: [
      { id: 'evt3-1', timestamp: new Date(), message: '¡Meta de ahorro alcanzada!', actor: Actor.Sistema, type: EventType.GoalAchieved, details: {amount: 153075, currency: 'MXN'} },
    ],
  },
  {
    id: '4',
    name: 'Laura Fernández (Venta Directa)',
    avatarUrl: 'https://picsum.photos/seed/laura/100/100',
    flow: BusinessFlow.VentaDirecta,
    status: 'Unidad en Proceso de Importación',
    remainderAmount: 0,
    downPayment: 837000,
    importStatus: {
      pedidoPlanta: 'completed',
      unidadFabricada: 'completed',
      transitoMaritimo: 'in_progress',
      enAduana: 'pending',
      liberada: 'pending',
    },
    documents: CONTADO_DOCS.map(doc => ({ ...doc, status: DocumentStatus.Aprobado })),
    events: [
      { id: 'evt4-1', timestamp: new Date(), message: 'Pedido a planta confirmado.', actor: Actor.Sistema, type: EventType.System },
    ],
  },
  ...collectiveCreditClients,
];

const initialGroups: CollectiveCreditGroup[] = [
    { id: 'cc-2405', name: 'Tanda Mayo 2024', capacity: 5, members: collectiveCreditClients.slice(0, 5).map(c => ({ clientId: c.id, name: c.name, avatarUrl: c.avatarUrl, status: 'active', individualContribution: 48000 })), totalUnits: 5, unitsDelivered: 2, savingsGoalPerUnit: 153075, currentSavingsProgress: 85000, monthlyPaymentPerUnit: 25720.52, currentMonthPaymentProgress: 41000},
    { id: 'cc-2406', name: 'Tanda Junio 2024', capacity: 10, members: collectiveCreditClients.slice(5, 9).map(c => ({ clientId: c.id, name: c.name, avatarUrl: c.avatarUrl, status: 'active', individualContribution: 32000 })), totalUnits: 10, unitsDelivered: 1, savingsGoalPerUnit: 153075, currentSavingsProgress: 110000, monthlyPaymentPerUnit: 25720.52, currentMonthPaymentProgress: 15000},
    { id: 'cc-2408', name: 'Tanda Agosto 2024', capacity: 8, members: collectiveCreditClients.slice(9, 12).map(c => ({ clientId: c.id, name: c.name, avatarUrl: c.avatarUrl, status: 'active', individualContribution: 15000 })), totalUnits: 8, unitsDelivered: 0, savingsGoalPerUnit: 153075, currentSavingsProgress: 75000, monthlyPaymentPerUnit: 25720.52, currentMonthPaymentProgress: 0},
];


const initializeDB = () => {
    if (clientsDB.size === 0) {
        initialClients.forEach(c => clientsDB.set(c.id, c));
    }
    if (collectiveCreditGroupsDB.size === 0) {
        initialGroups.forEach(g => collectiveCreditGroupsDB.set(g.id, addDerivedGroupProperties(g)));
    }
    if (ecosystemsDB.size === 0) {
        initialEcosystems.forEach(e => ecosystemsDB.set(e.id, e));
    }
};

initializeDB();

// --- API SIMULATION ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getClients = async (): Promise<Client[]> => {
    await delay(250);
    return Array.from(clientsDB.values());
};

const getClientById = async (id: string): Promise<Client | null> => {
    await delay(100);
    return clientsDB.get(id) || null;
};

const addNewEvent = async (clientId: string, message: string, actor: Actor, type: EventType, details?: any): Promise<EventLog> => {
    const newEvent: EventLog = {
      id: `evt-${clientId}-${Date.now()}`,
      timestamp: new Date(),
      message,
      actor,
      type,
      details,
    };
    const client = await getClientById(clientId);
    if (client) {
      client.events.push(newEvent);
      clientsDB.set(clientId, client);
    }
    return newEvent;
};


const uploadDocument = async (clientId: string, docId: string): Promise<{ success: boolean }> => {
    await delay(1500); // Simulate upload time
    const client = await getClientById(clientId);
    if (client) {
        const doc = client.documents.find(d => d.id === docId);
        if (doc) {
            doc.status = DocumentStatus.EnRevision;
            clientsDB.set(clientId, client);
            return { success: true };
        }
    }
    return { success: false };
};

const sendContract = async (clientId: string): Promise<{ success: boolean; message: string }> => {
    await delay(1200);
    return { success: true, message: "Contrato enviado para firma electrónica." };
};

const completeKyc = async (clientId: string): Promise<Client> => {
    await delay(2000); // Simulate KYC processing
    const client = await getClientById(clientId);
    if (!client) throw new Error("Client not found");
    
    const kycDoc = client.documents.find(d => d.name.includes('Verificación Biométrica'));
    if(kycDoc) kycDoc.status = DocumentStatus.Aprobado;

    // Check if all core documents are now approved
    const allDocsApproved = client.documents.every(d => d.status === DocumentStatus.Aprobado || d.isOptional);
    if(allDocsApproved) {
        client.status = 'Aprobado';
    }
    
    clientsDB.set(clientId, client);
    return client;
};


const simulateClientPayment = async (clientId: string, amount: number): Promise<Client> => {
    await delay(500);
    const client = await getClientById(clientId);
    if (!client || !client.savingsPlan) throw new Error("Client or savings plan not found");
    client.savingsPlan.progress += amount;
    
    if (client.savingsPlan.progress >= client.savingsPlan.goal && client.status !== 'Meta Alcanzada') {
        client.status = 'Meta Alcanzada';
        await addNewEvent(clientId, "¡Meta de ahorro alcanzada!", Actor.Sistema, EventType.GoalAchieved);
    }
    
    clientsDB.set(clientId, client);
    return client;
}

const simulateMonthlyPayment = async (clientId: string, amount: number): Promise<Client> => {
    await delay(500);
    const client = await getClientById(clientId);
    if (!client || !client.paymentPlan) throw new Error("Client or payment plan not found");
    client.paymentPlan.currentMonthProgress += amount;
    clientsDB.set(clientId, client);
    return client;
};


const generatePaymentLink = async (clientId: string, amount: number): Promise<PaymentLinkDetails> => {
    await delay(800);
    const useSpei = amount > 20000;
    if (useSpei) {
        return {
            type: 'SPEI',
            amount: amount,
            details: {
                bank: 'STP',
                clabe: '646180123456789123',
                reference: `CMU${clientId.slice(0,4)}${Date.now().toString().slice(-4)}`
            }
        };
    } else {
        return {
            type: 'Conekta',
            amount: amount,
            details: {
                link: `https://pay.conekta.com/link/${Date.now()}`
            }
        };
    }
};

const convertToVentaPlazo = async (clientId: string): Promise<Client> => {
    await delay(1000);
    const client = await getClientById(clientId);
    if (!client || !client.savingsPlan) throw new Error("Client or savings plan not found");
    
    const { progress, totalValue } = client.savingsPlan;

    const updatedClient: Client = {
        ...client,
        flow: BusinessFlow.VentaPlazo,
        status: 'Expediente en Proceso',
        downPayment: progress,
        remainderAmount: totalValue - progress,
        savingsPlan: undefined,
        paymentPlan: {
            monthlyGoal: 18000, // Placeholder
            currentMonthProgress: 0,
            currency: 'MXN',
            methods: { collection: true, voluntary: true },
            collectionDetails: client.savingsPlan.collectionDetails
        },
        documents: EDOMEX_MIEMBRO_DOCS, // Assigns the full checklist
    };

    clientsDB.set(clientId, updatedClient);
    return updatedClient;
};


const configurePaymentPlan = async (clientId: string, config: any): Promise<Client> => {
    await delay(700);
    const client = await getClientById(clientId);
    if (!client) throw new Error("Client not found");

    client.status = "Activo";
    if (client.paymentPlan) {
        client.paymentPlan.monthlyGoal = config.goal;
        client.paymentPlan.methods = config.methods;
        if (config.methods.collection) {
            client.paymentPlan.collectionDetails = {
                plates: config.plates.split(',').map((p: string) => p.trim()),
                pricePerLiter: config.overprice
            }
        } else {
            client.paymentPlan.collectionDetails = undefined;
        }
    }
    
    clientsDB.set(clientId, client);
    return client;
};


const getOpportunityStages = async (): Promise<OpportunityStage[]> => {
    await delay(400);
    const clients = await getClients();
    const stages: OpportunityStage[] = [
        { name: 'Nuevas Oportunidades', clientIds: [], count: 0 },
        { name: 'Expediente en Proceso', clientIds: [], count: 0 },
        { name: 'Aprobado', clientIds: [], count: 0 },
        { name: 'Activo', clientIds: [], count: 0 },
        { name: 'Completado', clientIds: [], count: 0 },
    ];
    
    clients.forEach(c => {
        let stageName: OpportunityStage['name'] | null = null;
        const status = c.status;
        if(status === 'Nuevas Oportunidades') stageName = 'Nuevas Oportunidades';
        else if (status === 'Expediente en Proceso' || status === 'Unidad en Proceso de Importación') stageName = 'Expediente en Proceso';
        else if (status === 'Aprobado') stageName = 'Aprobado';
        else if (status === 'Activo' || status === 'Pagos al Corriente' || status === 'Activo en Grupo' || status === 'Esperando Sorteo' || status === 'Turno Adjudicado' || status === 'Unidad Lista para Entrega' || status === 'Meta Alcanzada') stageName = 'Activo';
        else if (status === 'Completado') stageName = 'Completado';

        const stage = stages.find(s => s.name === stageName);
        if (stage) {
            stage.clientIds.push(c.id);
            stage.count++;
        }
    });

    return stages;
};

const getActionableGroups = async (): Promise<ActionableGroup[]> => {
    await delay(500);
    const clients = await getClients();
    const groups: ActionableGroup[] = [];

    const expedienteIncompleto = clients
        .filter(c => c.status === 'Expediente en Proceso' && c.documents.some(d => d.status === DocumentStatus.Pendiente))
        .map(c => ({ id: c.id, name: c.name, avatarUrl: c.avatarUrl, status: `Pendientes: ${c.documents.filter(d=>d.status === DocumentStatus.Pendiente).length}`}));

    if (expedienteIncompleto.length > 0) {
        groups.push({
            title: 'Expedientes por Completar',
            description: 'Estos clientes tienen documentos pendientes. Contacta para agilizar el proceso.',
            clients: expedienteIncompleto
        });
    }

    const metasAlcanzadas = clients
        .filter(c => c.status === 'Meta Alcanzada')
        .map(c => ({ id: c.id, name: c.name, avatarUrl: c.avatarUrl, status: 'Listo para convertir o liquidar' }));

    if (metasAlcanzadas.length > 0) {
        groups.push({
            title: 'Metas de Ahorro Alcanzadas',
            description: 'Estos clientes han completado su ahorro. Define el siguiente paso con ellos.',
            clients: metasAlcanzadas
        });
    }
    
    return groups;
};

const getEcosystems = async (): Promise<Ecosystem[]> => {
    await delay(300);
    return Array.from(ecosystemsDB.values());
};

const getCollectiveCreditGroups = async (): Promise<CollectiveCreditGroup[]> => {
    await delay(350);
    return Array.from(collectiveCreditGroupsDB.values());
};

const getCollectiveCreditGroupById = async(id: string): Promise<CollectiveCreditGroup | null> => {
    await delay(150);
    return collectiveCreditGroupsDB.get(id) || null;
}

const createClientFromOnboarding = async (data: {name: string, market: string, saleType: string, ecosystemId?: string}): Promise<Client> => {
    await delay(600);
    
    const flow = data.saleType === 'contado' ? BusinessFlow.VentaDirecta : BusinessFlow.VentaPlazo;
    let documents: Document[];

    if (flow === BusinessFlow.VentaDirecta) {
        documents = CONTADO_DOCS;
    } else { // Venta a Plazo
        documents = data.market === 'aguascalientes' ? AGUASCALIENTES_FINANCIERO_DOCS : EDOMEX_MIEMBRO_DOCS;
    }

    const newClient: Client = {
        id: `client-${Date.now()}`,
        name: data.name,
        avatarUrl: `https://picsum.photos/seed/${data.name}/100/100`,
        flow: flow,
        status: 'Expediente en Proceso',
        documents: documents.map(d => ({...d})), // Fresh copy
        events: [{
            id: `evt-${Date.now()}`,
            timestamp: new Date(),
            message: `Oportunidad de ${flow} creada.`,
            actor: Actor.Asesor,
            type: EventType.AdvisorAction,
        }],
        ecosystemId: data.ecosystemId,
    };
    
    clientsDB.set(newClient.id, newClient);
    return newClient;
};

const createSavingsOpportunity = async (data: {name: string, market: string, clientType: string, ecosystemId?: string}): Promise<Client> => {
     await delay(600);
    
    const flow = data.clientType === 'individual' ? BusinessFlow.AhorroProgramado : BusinessFlow.CreditoColectivo;
    
    const newClient: Client = {
        id: `client-${Date.now()}`,
        name: data.name,
        avatarUrl: `https://picsum.photos/seed/${data.name}/100/100`,
        flow: flow,
        status: 'Expediente en Proceso',
        documents: EDOMEX_AHORRO_DOCS.map(d => ({...d})), // Fresh copy
        events: [{
            id: `evt-${Date.now()}`,
            timestamp: new Date(),
            message: `Oportunidad de ${flow} creada.`,
            actor: Actor.Asesor,
            type: EventType.AdvisorAction,
        }],
        ecosystemId: data.ecosystemId,
    };
    
    clientsDB.set(newClient.id, newClient);
    return newClient;
};

const getProductPackage = async (packageKey: string) => {
    await delay(500);
    
    const packages: Record<string, any> = {
        'aguascalientes-plazo': {
            name: "Paquete Financiero AGS",
            rate: 0.255,
            terms: [12, 24],
            minDownPaymentPercentage: 0.6,
            components: [
                { id: 'unidad-h6c', name: 'Vagoneta H6C (19 Pasajeros)', price: 799000, isOptional: false },
                { id: 'gnv', name: 'Conversión a GNV', price: 54000, isOptional: false },
            ]
        },
        'aguascalientes-directa': {
             name: "Paquete Contado AGS",
            rate: 0,
            terms: [],
            minDownPaymentPercentage: 1,
            components: [
                { id: 'unidad-h6c', name: 'Vagoneta H6C (19 Pasajeros)', price: 799000, isOptional: false },
                { id: 'gnv', name: 'Conversión a GNV', price: 54000, isOptional: true },
            ]
        },
        'edomex-plazo': {
            name: "Paquete Productivo Completo EdoMex",
            rate: 0.299,
            terms: [48, 60],
            minDownPaymentPercentage: 0.2,
            components: [
                { id: 'unidad-h6c-ventanas', name: 'Vagoneta H6C (Ventanas)', price: 749000, isOptional: false },
                { id: 'gnv', name: 'Conversión a GNV', price: 54000, isOptional: false },
                { id: 'tec', name: 'Paquete Tecnológico (GPS, Cámaras)', price: 12000, isOptional: false },
                { id: 'bancas', name: 'Juego de Bancas', price: 22000, isOptional: false },
                { id: 'seguro', name: 'Seguro Financiado (por año)', price: 36700, isOptional: true, isMultipliedByTerm: true },
            ]
        },
        'edomex-directa': {
            name: "Paquete Contado EdoMex",
            rate: 0,
            terms: [],
            minDownPaymentPercentage: 1,
            components: [
                { id: 'unidad-h6c-ventanas', name: 'Vagoneta H6C (Ventanas)', price: 749000, isOptional: false },
                { id: 'gnv', name: 'Conversión a GNV', price: 54000, isOptional: true },
                { id: 'tec', name: 'Paquete Tecnológico (GPS, Cámaras)', price: 12000, isOptional: true },
                { id: 'bancas', name: 'Juego de Bancas', price: 22000, isOptional: true },
            ]
        },
        'edomex-colectivo': {
            name: "Paquete Productivo Completo EdoMex (Colectivo)",
            rate: 0.299,
            terms: [48, 60],
            minDownPaymentPercentage: 0.15,
            defaultMembers: 5,
            components: [
                { id: 'unidad-h6c-ventanas', name: 'Vagoneta H6C (Ventanas)', price: 749000, isOptional: false },
                { id: 'gnv', name: 'Conversión a GNV', price: 54000, isOptional: false },
                { id: 'tec', name: 'Paquete Tecnológico (GPS, Cámaras)', price: 12000, isOptional: false },
                { id: 'bancas', name: 'Juego de Bancas', price: 22000, isOptional: false },
                { id: 'seguro', name: 'Seguro Financiado (por año)', price: 36700, isOptional: false, isMultipliedByTerm: true },
            ]
        }
    };
    
    if (!packages[packageKey]) throw new Error("Package not found");
    return packages[packageKey];
}

const saveQuoteToClient = async (clientId: string, quote: Quote): Promise<Client> => {
    await delay(800);
    const client = await getClientById(clientId);
    if (!client) throw new Error("Client not found");

    if (quote.flow === BusinessFlow.VentaDirecta) {
        client.status = 'Unidad en Proceso de Importación';
        client.downPayment = quote.downPayment;
        client.remainderAmount = quote.amountToFinance;
        client.importStatus = { pedidoPlanta: 'in_progress', unidadFabricada: 'pending', transitoMaritimo: 'pending', enAduana: 'pending', liberada: 'pending' };
    } else if (quote.flow === BusinessFlow.AhorroProgramado || quote.flow === BusinessFlow.CreditoColectivo) {
        client.status = 'Expediente en Proceso';
        client.savingsPlan = {
            progress: 0,
            goal: quote.downPayment,
            totalValue: quote.totalPrice,
            currency: 'MXN',
            methods: { collection: true, voluntary: true }
        };
    } else { // Venta a Plazo
        client.status = 'Expediente en Proceso';
        client.downPayment = quote.downPayment;
        client.remainderAmount = quote.amountToFinance;
        client.paymentPlan = {
            monthlyGoal: quote.monthlyPayment,
            currentMonthProgress: 0,
            currency: 'MXN',
            methods: { collection: true, voluntary: true }
        }
    }

    clientsDB.set(clientId, client);
    return client;
};

const getSidebarAlertCounts = async (clients: Client[]): Promise<{ [key in View]?: number }> => {
    await delay(100);
    const opportunityClients = clients.filter(c => ['Nuevas Oportunidades', 'Expediente en Proceso'].includes(c.status));
    const clientsWithPendingDocs = clients.filter(c => c.documents.some(d => d.status === DocumentStatus.Pendiente));

    return {
        oportunidades: opportunityClients.length,
        clientes: clientsWithPendingDocs.length
    }
};

const updateImportMilestone = async (clientId: string, milestone: keyof ImportStatus): Promise<Client> => {
    await delay(600);
    const client = await getClientById(clientId);
    if (!client || !client.importStatus) throw new Error("Client or import status not found");
    
    // Set previous milestones to completed
    const milestones: (keyof ImportStatus)[] = ['pedidoPlanta', 'unidadFabricada', 'transitoMaritimo', 'enAduana', 'liberada'];
    const currentIndex = milestones.indexOf(milestone);
    
    for(let i=0; i < currentIndex; i++) {
        client.importStatus[milestones[i]] = 'completed';
    }

    client.importStatus[milestone] = 'in_progress';
    
    if(milestone === 'liberada'){
        client.status = 'Unidad Lista para Entrega';
    }

    clientsDB.set(client.id, client);
    return client;
};


const getSimulatedAlert = async (clients: Client[]): Promise<Notification | null> => {
    const activeClients = clients.filter(c => c.status === 'Activo' && c.paymentPlan);
    if (activeClients.length === 0) return null;

    const randomClient = activeClients[Math.floor(Math.random() * activeClients.length)];
    const riskTypes = [
        { type: NotificationType.Risk, message: `Posible riesgo de atraso detectado para ${randomClient.name}. Contactar proactivamente.`},
        { type: NotificationType.Milestone, message: `¡Felicidades! ${randomClient.name} ha completado 12 meses de pagos puntuales.`},
    ];
    
    const alert = riskTypes[Math.floor(Math.random() * riskTypes.length)];
    
    return {
        id: Date.now(),
        clientId: randomClient.id,
        timestamp: new Date(),
        ...alert
    };
};

const simulateRestructure = async (clientId: string, monthsToAffect: number): Promise<ProtectionScenario[]> => {
    await delay(1200);
    const client = clientsDB.get(clientId);
    if (!client || !client.paymentPlan || !client.remainderAmount) {
        throw new Error("Cliente no es elegible para restructura.");
    }
    
    // Assume the client is 1 year into their loan for this simulation
    const originalTerm = 60; // Assuming a 60-month term for simplicity
    const monthsPaid = 12;
    const remainingTerm = originalTerm - monthsPaid;
    const monthlyRate = 0.299 / 12;

    const currentBalance = getBalance(client.remainderAmount, client.paymentPlan.monthlyGoal, monthlyRate, monthsPaid);
    
    if (remainingTerm <= monthsToAffect) return [];

    const scenarios: ProtectionScenario[] = [];

    // 1. Pausa y Prorrateo (Defer and Spread)
    const futureBalanceAfterDefer = currentBalance * Math.pow(1 + monthlyRate, monthsToAffect);
    const newMonthlyPaymentSpread = annuity(futureBalanceAfterDefer, monthlyRate, remainingTerm - monthsToAffect);
    scenarios.push({
        type: 'defer',
        title: 'Pausa y Prorrateo',
        description: 'Pausa los pagos y distribuye el monto en las mensualidades restantes.',
        newMonthlyPayment: newMonthlyPaymentSpread,
        newTerm: originalTerm,
        termChange: 0,
        details: [
            `Pagos de $0 por ${monthsToAffect} meses`,
            `El pago mensual sube a ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(newMonthlyPaymentSpread)} después.`
        ]
    });

    // 2. Reducción y Compensación (Step-down and Balloon)
    const reducedPayment = client.paymentPlan.monthlyGoal / 2;
    const shortfall = (client.paymentPlan.monthlyGoal - reducedPayment) * monthsToAffect;
    // For simplicity, let's assume the shortfall is spread over the next 12 months after the step-down period
    const catchUpMonths = Math.min(12, remainingTerm - monthsToAffect);
    const catchUpPayment = shortfall / catchUpMonths;
    const newMonthlyPaymentStepDown = client.paymentPlan.monthlyGoal + catchUpPayment;
    scenarios.push({
        type: 'step-down',
        title: 'Reducción y Compensación',
        description: 'Reduce el pago a la mitad y compensa la diferencia más adelante.',
        newMonthlyPayment: newMonthlyPaymentStepDown,
        newTerm: originalTerm,
        termChange: 0,
        details: [
            `Pagos de ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(reducedPayment)} por ${monthsToAffect} meses`,
            `El pago sube a ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(newMonthlyPaymentStepDown)} después.`
        ]
    });

    // 3. Extensión de Plazo (Recalendar)
    const newTermRecalendar = remainingTerm + monthsToAffect;
    const newMonthlyPaymentRecalendar = annuity(currentBalance, monthlyRate, newTermRecalendar);
    scenarios.push({
        type: 'recalendar',
        title: 'Extensión de Plazo',
        description: 'Pausa los pagos y extiende el plazo del crédito para compensar.',
        newMonthlyPayment: client.paymentPlan.monthlyGoal, // It should be the new one, but for simplicity we keep it. The important part is the term extension.
        newTerm: originalTerm + monthsToAffect,
        termChange: monthsToAffect,
        details: [
            `Pagos de $0 por ${monthsToAffect} meses`,
            `El plazo se extiende en ${monthsToAffect} meses.`
        ]
    });

    return scenarios;
};

const applyRestructure = async(clientId: string, scenario: ProtectionScenario): Promise<Client> => {
    await delay(800);
    const client = clientsDB.get(clientId);
    if (!client || !client.protectionPlan || !client.paymentPlan) throw new Error("Client not found or not eligible.");

    client.protectionPlan.restructuresAvailable -= 1;
    client.protectionPlan.restructuresUsed += 1;
    
    // A real implementation would update the paymentPlan details, term, etc. in Odoo.
    // For now, we just decrement the counter.
    client.paymentPlan.monthlyGoal = scenario.newMonthlyPayment > 0 ? scenario.newMonthlyPayment : client.paymentPlan.monthlyGoal;

    clientsDB.set(clientId, client);
    return client;
};

const simulateProtectionDemo = async (baseQuote: {amountToFinance: number, monthlyPayment: number, term: number}, monthsToAffect: number): Promise<ProtectionScenario[]> => {
    await delay(1200);
     const { amountToFinance, monthlyPayment, term } = baseQuote;
    
    const monthsPaid = 12; // Assumption for the demo
    if (term <= monthsPaid + monthsToAffect) {
        return [];
    }
    
    const remainingTerm = term - monthsPaid;
    const monthlyRate = 0.299 / 12; // Assuming EdoMex rate

    const currentBalance = getBalance(amountToFinance, monthlyPayment, monthlyRate, monthsPaid);
    
    const scenarios: ProtectionScenario[] = [];

    // 1. Pausa y Prorrateo
    const futureBalanceAfterDefer = currentBalance * Math.pow(1 + monthlyRate, monthsToAffect);
    const newMonthlyPaymentSpread = annuity(futureBalanceAfterDefer, monthlyRate, remainingTerm - monthsToAffect);
    scenarios.push({
        type: 'defer',
        title: 'Pausa y Prorrateo',
        description: 'Pausa los pagos y distribuye el monto en las mensualidades restantes.',
        newMonthlyPayment: newMonthlyPaymentSpread,
        newTerm: term,
        termChange: 0,
        details: [
            `Pagos de $0 por ${monthsToAffect} meses`,
            `El pago mensual sube a ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(newMonthlyPaymentSpread)} después.`
        ]
    });

    // 2. Reducción y Compensación
    const reducedPayment = monthlyPayment / 2;
    const newMonthlyPaymentStepDown = monthlyPayment + (monthlyPayment / 2) / 2; // Simplified
     scenarios.push({
        type: 'step-down',
        title: 'Reducción y Compensación',
        description: 'Reduce el pago a la mitad y compensa la diferencia más adelante.',
        newMonthlyPayment: newMonthlyPaymentStepDown,
        newTerm: term,
        termChange: 0,
        details: [
            `Pagos de ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(reducedPayment)} por ${monthsToAffect} meses`,
            `El pago sube a ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(newMonthlyPaymentStepDown)} después.`
        ]
    });

    // 3. Extensión de Plazo
    scenarios.push({
        type: 'recalendar',
        title: 'Extensión de Plazo',
        description: 'Pausa los pagos y extiende el plazo del crédito para compensar.',
        newMonthlyPayment: monthlyPayment,
        newTerm: term + monthsToAffect,
        termChange: monthsToAffect,
        details: [
            `Pagos de $0 por ${monthsToAffect} meses`,
            `El plazo se extiende en ${monthsToAffect} meses.`
        ]
    });

    return scenarios;
};


const simulateTanda = async (group: TandaGroupInput, config: TandaSimConfig): Promise<TandaSimulationResult> => {
    await delay(800);

    const { members, product, rules } = group;
    const { horizonMonths, events } = config;
    const months: TandaMonthState[] = [];
    const awardsByMember: Record<string, TandaAward> = {};
    const deliveredMembers = new Set<string>();

    let savings = 0;
    const monthlyPayments: Record<string, number> = {};

    for (let t = 1; t <= horizonMonths; t++) {
        const eventsThisMonth = events.filter(e => e.t === t);
        const memberContributions = new Map<string, number>(members.map(m => [m.id, m.C]));
        
        eventsThisMonth.forEach(e => {
            const currentC = memberContributions.get(e.data.memberId) || 0;
            if (e.type === 'extra') {
                memberContributions.set(e.data.memberId, currentC + e.data.amount);
            } else if (e.type === 'miss') {
                memberContributions.set(e.data.memberId, currentC - e.data.amount);
            }
        });

        const inflow = Array.from(memberContributions.values()).reduce((sum, c) => sum + c, 0);
        const debtDue = Object.values(monthlyPayments).reduce((sum, p) => sum + p, 0);

        let deficit = 0;
        if (inflow >= debtDue) {
            savings += (inflow - debtDue);
        } else {
            deficit = debtDue - inflow;
        }

        const awardsThisMonth: TandaAward[] = [];
        const eligibleQueue = members
            .filter(m => !deliveredMembers.has(m.id))
            .filter(m => !rules.eligibility.requireThisMonthPaid || (memberContributions.get(m.id) || 0) >= m.C)
            .sort((a, b) => a.prio - b.prio);

        if (deficit === 0) {
            for (const candidate of eligibleQueue) {
                const downPaymentNeeded = product.price * product.dpPct + (product.fees || 0);
                if (savings >= downPaymentNeeded) {
                    savings -= downPaymentNeeded;
                    deliveredMembers.add(candidate.id);
                    
                    const amountToFinance = product.price * (1 - product.dpPct);
                    const monthlyRate = product.rateAnnual / 12;
                    const mds = annuity(amountToFinance, monthlyRate, product.term);
                    
                    monthlyPayments[candidate.id] = mds;
                    
                    const award: TandaAward = { memberId: candidate.id, name: candidate.name, month: t, mds };
                    awardsThisMonth.push(award);
                    awardsByMember[candidate.id] = award;
                } else {
                    break;
                }
            }
        }
        
        let riskBadge: TandaRiskBadge = 'ok';
        if (deficit > 0) riskBadge = 'debtDeficit';
        else if (inflow < debtDue * 1.1) riskBadge = 'lowInflow';

        months.push({ t, inflow, debtDue, deficit, savings, awards: awardsThisMonth, riskBadge });
    }

    const deliveredCount = Object.keys(awardsByMember).length;
    const awardTimes = Object.values(awardsByMember).map(a => a.month);
    const avgTimeToAward = awardTimes.length > 0 ? awardTimes.reduce((sum, t) => sum + t, 0) / awardTimes.length : 0;
    
    return {
        months,
        awardsByMember,
        firstAwardT: awardTimes.length > 0 ? Math.min(...awardTimes) : undefined,
        lastAwardT: awardTimes.length > 0 ? Math.max(...awardTimes) : undefined,
        kpis: {
            deliveredCount,
            avgTimeToAward,
            coverageRatioMean: 1.2, // Mock KPI
        }
    };
};

export const simulationService = {
    getClients,
    getClientById,
    getOpportunityStages,
    uploadDocument,
    sendContract,
    completeKyc,
    simulateClientPayment,
    generatePaymentLink,
    convertToVentaPlazo,
    configurePaymentPlan,
    getActionableGroups,
    getEcosystems,
    getCollectiveCreditGroups,
    getCollectiveCreditGroupById,
    createClientFromOnboarding,
    createSavingsOpportunity,
    getProductPackage,
    saveQuoteToClient,
    getSidebarAlertCounts,
    updateImportMilestone,
    getSimulatedAlert,
    addNewEvent,
    simulateMonthlyPayment,
    simulateRestructure,
    applyRestructure,
    simulateProtectionDemo,
    simulateTanda,
};