import React from 'react';

// TypeScript declaration for the Metamap custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'metamap-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        clientid?: string;
        flowid?: string;
        metadata?: string;
      };
    }
  }
}

export enum BusinessFlow {
  VentaPlazo = 'Venta a Plazo',
  AhorroProgramado = 'Plan de Ahorro',
  CreditoColectivo = 'Crédito Colectivo',
  VentaDirecta = 'Venta Directa',
}

export enum DocumentStatus {
  Pendiente = 'Pendiente',
  EnRevision = 'En Revisión',
  Aprobado = 'Aprobado',
  Rechazado = 'Rechazado',
}

export enum Actor {
    Asesor = 'Asesor',
    Cliente = 'Cliente',
    Sistema = 'Sistema',
}

export enum EventType {
    Contribution = 'Contribution',
    Collection = 'Collection',
    System = 'System',
    AdvisorAction = 'AdvisorAction',
    ClientAction = 'ClientAction',
    GoalAchieved = 'GoalAchieved'
}

export interface Document {
  id: string;
  name: 'INE Vigente' | 'Comprobante de domicilio' | 'Constancia de situación fiscal' | 'Copia de la concesión' | 'Tarjeta de circulación' | 'Factura de la unidad actual' | 'Carta de antigüedad de la ruta' | 'Verificación Biométrica (Metamap)' | 'Expediente Completo' | 'Contrato Venta a Plazo' | 'Identificación' | 'Carta Aval de Ruta' | 'Convenio de Dación en Pago' | 'Acta Constitutiva de la Ruta' | 'Poder del Representante Legal';
  status: DocumentStatus;
  isOptional?: boolean;
  tooltip?: string;
}

export interface EventLog {
  id:string;
  timestamp: Date;
  message: string;
  actor: Actor;
  type: EventType;
  details?: {
      amount?: number;
      currency?: 'MXN';
      plate?: string;
  }
}

export interface CollectionDetails {
    plates: string[];
    pricePerLiter: number;
}

export interface SavingsPlan {
    progress: number;
    goal: number;
    currency: 'MXN';
    totalValue: number; // Total value of the unit being saved for
    methods: {
        collection: boolean;
        voluntary: boolean;
    };
    collectionDetails?: CollectionDetails;
}

export interface PaymentPlan {
    monthlyGoal: number;
    currentMonthProgress: number;
    currency: 'MXN';
    methods: {
        collection: boolean;
        voluntary: boolean;
    };
    collectionDetails?: CollectionDetails;
}


export interface CollectiveCreditMember {
  clientId: string;
  name: string;
  avatarUrl: string;
  status: 'active' | 'pending';
  individualContribution: number;
}

export interface CollectiveCreditGroup {
  id: string;
  name: string;
  capacity: number;
  members: CollectiveCreditMember[];
  totalUnits: number;
  unitsDelivered: number;
  savingsGoalPerUnit: number;
  currentSavingsProgress: number; // Savings towards the *next* unit
  monthlyPaymentPerUnit: number;
  currentMonthPaymentProgress: number; // Payment towards the *collective debt*

  // Derived properties for UI convenience
  phase?: 'saving' | 'payment' | 'dual' | 'completed';
  savingsGoal?: number;
  currentSavings?: number;
  monthlyPaymentGoal?: number;
}

export type ImportMilestoneStatus = 'completed' | 'in_progress' | 'pending';

export type ImportStatus = {
    pedidoPlanta: ImportMilestoneStatus;
    unidadFabricada: ImportMilestoneStatus;
    transitoMaritimo: ImportMilestoneStatus;
    enAduana: ImportMilestoneStatus;
    liberada: ImportMilestoneStatus;
};

export interface Ecosystem {
    id: string;
    name: string;
    documents: Document[];
    status: 'Activo' | 'Expediente Pendiente';
}

export interface Quote {
    totalPrice: number;
    downPayment: number;
    amountToFinance: number;
    term: number;
    monthlyPayment: number;
    market: string;
    clientType: string;
    flow: BusinessFlow;
}

export interface ProtectionPlan {
  type: 'Esencial' | 'Total';
  restructuresAvailable: number;
  restructuresUsed: number;
  annualResets: number;
}

export interface ProtectionScenario {
  type: 'defer' | 'step-down' | 'recalendar';
  title: string;
  description: string;
  newMonthlyPayment: number;
  newTerm: number;
  termChange: number;
  details: string[];
}

export interface Client {
  id: string;
  name: string;
  avatarUrl: string;
  flow: BusinessFlow;
  status: string;
  savingsPlan?: SavingsPlan;
  paymentPlan?: PaymentPlan;
  documents: Document[];
  events: EventLog[];
  collectiveCreditGroupId?: string;
  importStatus?: ImportStatus;
  remainderAmount?: number;
  downPayment?: number;
  healthScore?: number;
  ecosystemId?: string;
  protectionPlan?: ProtectionPlan;
}

export interface PaymentLinkDetails {
    type: 'Conekta' | 'SPEI';
    amount: number;
    details: {
        link?: string;
        clabe?: string;
        reference?: string;
        bank?: string;
    };
}

export enum NotificationType {
    Lead = 'lead',
    Milestone = 'milestone',
    Risk = 'risk',
    System = 'system'
}

export type NotificationAction = {
    text: string;
    type: 'convert' | 'assign_unit' | 'configure_plan';
}

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
    timestamp: Date;
    clientId?: string;
    action?: NotificationAction;
}

export type OpportunityStage = {
    name: 'Nuevas Oportunidades' | 'Expediente en Proceso' | 'Aprobado' | 'Activo' | 'Completado';
    clientIds: string[];
    count: number;
};

export type ActionableClient = {
    id: string;
    name: string;
    avatarUrl: string;
    status: string;
};

export type ActionableGroup = {
    title: string;
    description: string;
    clients: ActionableClient[];
};

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

export type TandaMilestone = {
    type: 'ahorro' | 'entrega';
    unitNumber?: number;
    duration: number; // in months
    label: string;
};

export type Market = 'all' | 'aguascalientes' | 'edomex';

export interface NavigationContext {
  ecosystem?: Ecosystem;
  group?: CollectiveCreditGroup;
}

// --- Tanda Simulator Types ---

export type TandaMemberStatus = 'active' | 'frozen' | 'left' | 'delivered';

export interface TandaMember {
  id: string;
  name: string;
  prio: number;
  status: TandaMemberStatus;
  C: number; // Base monthly contribution
}

export interface TandaProduct {
  price: number;
  dpPct: number;
  term: number;
  rateAnnual: number;
  fees?: number;
}

export interface TandaGroupInput {
  name: string;
  members: TandaMember[];
  product: TandaProduct;
  rules: {
    allocRule: 'debt_first';
    eligibility: { requireThisMonthPaid: boolean };
  };
  seed: number;
}

export type TandaEventType = 'miss' | 'extra';

export interface TandaSimEvent {
  t: number; // month
  type: TandaEventType;
  data: {
    memberId: string;
    amount: number;
  };
  id: string;
}

export interface TandaSimConfig {
  horizonMonths: number;
  events: TandaSimEvent[];
}

export interface TandaAward {
  memberId: string;
  name: string;
  month: number;
  mds: number; // monthly payment
}

export type TandaRiskBadge = 'ok' | 'debtDeficit' | 'lowInflow';

export interface TandaMonthState {
  t: number;
  inflow: number;
  debtDue: number;
  deficit: number;
  savings: number;
  awards: TandaAward[];
  riskBadge: TandaRiskBadge;
}

export interface TandaSimulationResult {
  months: TandaMonthState[];
  awardsByMember: Record<string, TandaAward | undefined>;
  firstAwardT?: number;
  lastAwardT?: number;
  kpis: {
    coverageRatioMean: number;
    deliveredCount: number;
    avgTimeToAward: number;
  };
}

export interface TandaSimDraft {
  group: TandaGroupInput;
  config: TandaSimConfig;
}

export type ViewMode = 'advisor' | 'client';
