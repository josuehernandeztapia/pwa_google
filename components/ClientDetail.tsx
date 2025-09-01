import React, { useState, useEffect, useCallback, FormEvent, useRef, useMemo } from 'react';
import { Client, Document, DocumentStatus, EventLog, Actor, PaymentLinkDetails, BusinessFlow, CollectiveCreditGroup, EventType, SavingsPlan, PaymentPlan, ImportStatus, NavigationContext, ViewMode } from '../types';
import { simulationService } from '../services/simulationService';
import { CheckCircleIcon, ClockIcon, XCircleIcon, UploadIcon, FingerPrintIcon, DocumentDownloadIcon, ClipboardCopyIcon, UserGroupIcon, FuelIcon, InformationCircleIcon, ShieldCheckIcon } from './icons';
import { Modal } from './Modal';
import { toast } from './Toast';
import { GuaranteePanel } from './GuaranteePanel';
import { PlanConfigForm } from './PlanConfigForm';
import { ImportTracker } from './ImportTracker';
import { NextBestAction } from './NextBestAction';
import { Breadcrumb } from './Breadcrumb';
import { ProtectionSimulator } from './ProtectionSimulator';
import { ClientDetailSeniorView } from './ClientDetailSeniorView';

// jsPDF is loaded from a script tag in index.html
declare global {
    interface Window {
        jspdf: any;
    }
}

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

interface ClientDetailProps {
  client: Client;
  onClientUpdate: (client: Client) => void;
  onBack: () => void;
  navigationContext: NavigationContext | null;
  viewMode: ViewMode;
}

const ProgressBar: React.FC<{ progress: number; goal: number; currency: string; label: string; }> = ({ progress, goal, currency, label }) => {
  const percentage = goal > 0 ? Math.min((progress / goal) * 100, 100) : 0;
  const formattedProgress = new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(progress);
  const formattedGoal = new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(goal);

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-primary-cyan-300">{label}</span>
        <span className="text-xs font-medium text-gray-400">{formattedProgress} / {formattedGoal}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div className="bg-primary-cyan-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const SavingsInfoPanel: React.FC<{ plan: SavingsPlan }> = ({ plan }) => (
    <div className="bg-gray-900 p-4 rounded-lg">
        <h4 className="text-lg font-semibold text-white mb-3">Detalles del Plan de Ahorro</h4>
        <div className="space-y-3">
            <div>
                <h5 className="text-sm font-medium text-gray-400">Métodos de Ahorro Activos</h5>
                <div className="flex flex-wrap gap-2 mt-2">
                    {plan.methods.voluntary && <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300">Aportaciones Voluntarias</span>}
                    {plan.methods.collection && <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300">Ahorro por Recaudación</span>}
                </div>
            </div>
            {plan.methods.collection && plan.collectionDetails && (
                 <div>
                    <h5 className="text-sm font-medium text-gray-400">Detalles de Recaudación</h5>
                    <div className="text-sm text-gray-300 mt-2 p-3 bg-gray-800 rounded-md">
                        <p>Placas: <span className="font-mono">{plan.collectionDetails.plates.join(', ')}</span></p>
                        <p>Sobreprecio: <span className="font-mono">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(plan.collectionDetails.pricePerLiter)} / litro</span></p>
                    </div>
                </div>
            )}
        </div>
    </div>
);

const MonthlyPaymentPanel: React.FC<{ plan: PaymentPlan }> = ({ plan }) => {
    const outstanding = Math.max(0, plan.monthlyGoal - plan.currentMonthProgress);
    return (
        <div className="bg-gray-900 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-3">Gestión de Pago Mensual</h4>
            <ProgressBar progress={plan.currentMonthProgress} goal={plan.monthlyGoal} currency={plan.currency} label="Progreso del Mes" />
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium text-gray-300">Saldo Pendiente del Mes:</span>
                <span className="text-lg font-bold text-amber-400 font-mono">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: plan.currency }).format(outstanding)}</span>
            </div>
        </div>
    );
};

const FORMAL_DOCS: Set<Document['name']> = new Set([
    'Copia de la concesión',
    'Factura de la unidad actual',
    'Carta Aval de Ruta',
    'Convenio de Dación en Pago',
    'Acta Constitutiva de la Ruta',
    'Poder del Representante Legal'
]);

const DocumentChecklistItem: React.FC<{ doc: Document, onUpload: (docId: string) => void, isUploading: boolean }> = ({ doc, onUpload, isUploading }) => {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    
    const statusMap = {
        [DocumentStatus.Aprobado]: { icon: <CheckCircleIcon className="w-5 h-5 text-emerald-400" />, text: 'text-emerald-400' },
        [DocumentStatus.EnRevision]: { icon: <ClockIcon className="w-5 h-5 text-amber-400" />, text: 'text-amber-400 animate-pulse' },
        [DocumentStatus.Pendiente]: { icon: <XCircleIcon className="w-5 h-5 text-gray-500" />, text: 'text-gray-500' },
        [DocumentStatus.Rechazado]: { icon: <XCircleIcon className="w-5 h-5 text-red-500" />, text: 'text-red-500' },
    };
    
    const fileInputId = `file-upload-${doc.id}`;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onUpload(doc.id);
        }
        event.target.value = '';
    };

    return (
        <li className="py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <span className={statusMap[doc.status].text}>{statusMap[doc.status].icon}</span>
                    <span className={`ml-3 text-sm font-medium ${doc.status === DocumentStatus.Aprobado ? 'text-gray-300' : statusMap[doc.status].text}`}>{doc.name}</span>
                    {doc.isOptional && <span className="ml-2 text-xs text-gray-500">(Opcional)</span>}
                    {doc.tooltip && (
                        <div className="relative">
                            <button onClick={() => setIsTooltipVisible(!isTooltipVisible)} className="ml-2">
                                <InformationCircleIcon className="w-5 h-5 text-gray-500 hover:text-primary-cyan-400" />
                            </button>
                             {isTooltipVisible && (
                                <div className="absolute left-0 bottom-full mb-2 w-72 bg-gray-900 border border-gray-600 text-white rounded-lg p-3 z-10 shadow-lg" onClick={(e) => e.stopPropagation()}>
                                   <h5 className="font-bold text-primary-cyan-400 mb-2 text-sm">¿Qué es este documento?</h5>
                                   <p className="text-xs">{doc.tooltip}</p>
                                   <button onClick={() => setIsTooltipVisible(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white">&times;</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {doc.status === DocumentStatus.Pendiente && (
                     <div>
                        {isUploading ? (
                             <button disabled className="flex items-center px-3 py-1 text-xs font-medium text-white bg-gray-600 rounded-md cursor-not-allowed">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Subiendo...
                            </button>
                        ) : (
                            <label htmlFor={fileInputId} className="flex items-center px-3 py-1 text-xs font-medium text-white bg-gray-600 rounded-md hover:bg-gray-500 cursor-pointer transition-colors">
                                <UploadIcon className="w-4 h-4 mr-1"/>
                                Subir
                            </label>
                        )}
                        <input
                            id={fileInputId}
                            type="file"
                            className="hidden"
                            accept="image/png, image/jpeg, application/pdf"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </div>
                )}
            </div>
            {FORMAL_DOCS.has(doc.name) && doc.status === DocumentStatus.Pendiente && (
                <p className="text-xs text-gray-500 mt-2 pl-8">Se recomienda subir este documento como un solo archivo PDF.</p>
            )}
        </li>
    )
}

const TechnologyPackage: React.FC = () => (
    <div className="bg-gray-900 p-4 rounded-lg">
        <h4 className="text-lg font-semibold text-white mb-3">Paquete Productivo</h4>
        <ul className="space-y-2">
            {['Unidad Nueva', 'Conversión a GNV', 'GPS para tu seguridad y la de tu unidad', 'Sistema de Cámaras autorizado por la SEMOVI'].map(item => (
                <li key={item} className="flex items-center text-sm text-gray-300">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 mr-3" />
                    {item}
                </li>
            ))}
        </ul>
    </div>
);

const CollectiveCreditGroupInfoPanel: React.FC<{ client: Client, groupId: string }> = ({ client, groupId }) => {
    const [group, setGroup] = useState<CollectiveCreditGroup | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGroup = async () => {
            setIsLoading(true);
            const groupData = await simulationService.getCollectiveCreditGroupById(groupId);
            setGroup(groupData || null);
            setIsLoading(false);
        };
        fetchGroup();
    }, [groupId]);

    if (isLoading) {
        return <div className="p-4 text-center text-gray-400">Cargando información del grupo...</div>;
    }

    if (!group) {
        return <div className="p-4 text-center text-red-400">No se pudo encontrar el grupo de Crédito Colectivo.</div>;
    }

    const currentMember = group.members.find(m => m.clientId === client.id);
    const individualContribution = currentMember?.individualContribution || 0;
    
    const renderContent = () => {
        switch (group.phase) {
            case 'saving':
                return (
                    <div className='space-y-4'>
                        <ProgressBar progress={individualContribution} goal={group.savingsGoal / group.capacity} currency="MXN" label="Mi Progreso Individual (Aprox.)"/>
                        <ProgressBar progress={group.currentSavings} goal={group.savingsGoal} currency="MXN" label="Progreso Total del Grupo"/>
                    </div>
                );
            case 'dual':
                 return (
                    <div className='space-y-4'>
                        <div>
                            <h5 className="text-md font-semibold text-white mb-2">Pago de Deuda Colectiva (Unidad {group.unitsDelivered}/{group.totalUnits})</h5>
                            <ProgressBar progress={group.currentMonthPaymentProgress} goal={group.monthlyPaymentGoal || 0} currency="MXN" label="Progreso Pago del Mes"/>
                        </div>
                        <div className="pt-2 border-t border-gray-700/50">
                            <h5 className="text-md font-semibold text-white mb-2 mt-2">Ahorro Siguiente Enganche (Unidad {group.unitsDelivered + 1}/{group.totalUnits})</h5>
                            <ProgressBar progress={group.currentSavingsProgress} goal={group.savingsGoalPerUnit} currency="MXN" label="Progreso Ahorro"/>
                        </div>
                    </div>
                );
            case 'payment':
            case 'completed':
                 return (
                    <div className='space-y-4'>
                        <h5 className="text-md font-semibold text-white">Fase de Pago Colectivo</h5>
                         <div className="p-3 bg-gray-800/50 rounded-lg flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-300">Meta de Pago Mensual del Grupo:</span>
                            <span className="text-lg font-bold text-amber-400 font-mono">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(group.monthlyPaymentGoal || 0)}</span>
                        </div>
                         <ProgressBar progress={group.currentMonthPaymentProgress} goal={group.monthlyPaymentGoal || 0} currency="MXN" label="Progreso Pago del Mes"/>
                    </div>
                );
            default:
                return null;
        }
    }


    return (
        <div className="bg-gray-900 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <UserGroupIcon className="w-6 h-6 mr-3 text-primary-cyan-400"/>
                Información del Grupo: {group.name}
            </h4>
            
            {renderContent()}

            <h5 className="text-md font-semibold text-white mt-4 mb-2">Participantes ({group.members.length} / {group.capacity})</h5>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
                {group.members.map(member => (
                    <li key={member.clientId} className="flex items-center p-2 bg-gray-800 rounded-md">
                        <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full"/>
                        <span className="ml-3 text-sm text-gray-300">{member.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const EventLogItem: React.FC<{ event: EventLog }> = ({ event }) => {
  const actorColors = {
    [Actor.Asesor]: 'bg-primary-cyan-500/20 text-primary-cyan-300',
    [Actor.Cliente]: 'bg-emerald-500/20 text-emerald-300',
    [Actor.Sistema]: 'bg-indigo-500/20 text-indigo-300',
  }
  
  const formattedAmount = event.details?.amount 
    ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(event.details.amount)
    : '';

  const getIcon = () => {
      switch (event.type) {
          case EventType.Collection:
              return <div className="p-1.5 bg-blue-500/20 rounded-full"><FuelIcon className="w-4 h-4 text-blue-300" /></div>;
          case EventType.Contribution:
              return <div className="p-1.5 bg-emerald-500/20 rounded-full"><CheckCircleIcon className="w-4 h-4 text-emerald-300" /></div>;
          default:
              return <div className={`w-2.5 h-2.5 mt-1.5 rounded-full ${actorColors[event.actor].replace('text-','bg-')}`}></div>;
      }
  }

  return (
    <div className="flex items-start space-x-3 py-3">
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-300">
            {event.message}
            {event.details?.amount && <span className="font-semibold text-white"> {formattedAmount}</span>}
        </p>
        <div className="flex items-center text-xs text-gray-500 mt-1">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${actorColors[event.actor]}`}>{event.actor}</span>
          <span className="mx-2">&middot;</span>
          <span>{event.timestamp.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
        </div>
      </div>
    </div>
  )
}

const PaymentLinkModalContent: React.FC<{client: Client, onClientUpdate: (client: Client) => void, addEvent: (event: EventLog) => void, onClose: () => void, initialAmount?: number}> = ({client, onClientUpdate, addEvent, onClose, initialAmount}) => {
    const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<PaymentLinkDetails | null>(null);
   
    const handleGenerateLink = async (e: FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error("Por favor, introduce un monto válido.");
            return;
        }

        setIsLoading(true);
        setPaymentDetails(null);
        try {
            const details = await simulationService.generatePaymentLink(client.id, numericAmount);
            setPaymentDetails(details);
            const newEvent = await simulationService.addNewEvent(client.id, `Liga de pago generada por ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(numericAmount)}.`, Actor.Asesor, EventType.AdvisorAction);
            addEvent(newEvent);
        } catch (error) {
            toast.error("Hubo un error al generar la liga de pago.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('¡Copiado al portapapeles!');
    }

    const handleSimulatePayment = async () => {
        if(!paymentDetails) return;
        setIsLoading(true);
        try {
            let updatedClient: Client;
            let message: string;
            
            if (client.flow === BusinessFlow.AhorroProgramado) {
                updatedClient = await simulationService.simulateClientPayment(client.id, paymentDetails.amount);
                message = `Aportación Voluntaria confirmada.`;
            } else { // Venta a Plazo or Venta Directa
                updatedClient = await simulationService.simulateMonthlyPayment(client.id, paymentDetails.amount);
                message = `Aportación a mensualidad confirmada.`;
            }
            
            onClientUpdate(updatedClient);
            const newEvent = await simulationService.addNewEvent(client.id, message, Actor.Sistema, EventType.Contribution, { amount: paymentDetails.amount, currency: 'MXN' });
            addEvent(newEvent);
            toast.success("¡Pago simulado con éxito!");
            onClose();
        } catch(error) {
            toast.error("Error al simular el pago.");
        } finally {
            setIsLoading(false);
        }
    }
    
    if(isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan-400"></div>
                <p className="mt-4 text-gray-300">Procesando...</p>
            </div>
        )
    }

    if (paymentDetails) {
        const isConekta = paymentDetails.type === 'Conekta';
        const detailsToCopy = isConekta
            ? paymentDetails.details.link!
            : `Banco: ${paymentDetails.details.bank}\nCLABE: ${paymentDetails.details.clabe}\nReferencia: ${paymentDetails.details.reference}`;
        
        return (
            <div className="space-y-4">
                <p className="text-gray-300">Información de pago generada. Compártela con el cliente y simula el pago una vez confirmado.</p>
                {isConekta ? (
                     <div>
                        <label className="text-sm font-medium text-gray-400">Liga de Pago Conekta</label>
                        <div className="mt-1 flex items-center gap-2">
                             <input type="text" readOnly value={paymentDetails.details.link} className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-300 focus:outline-none"/>
                             <button onClick={() => handleCopy(detailsToCopy)} className="p-2 text-white bg-primary-cyan-600 rounded-lg hover:bg-primary-cyan-700 transition-colors">
                                <ClipboardCopyIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 p-4 bg-gray-900 rounded-lg border border-gray-700">
                        <div className="flex justify-between"><span className="text-gray-400">Banco:</span><span className="font-mono text-white">{paymentDetails.details.bank}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">CLABE:</span><span className="font-mono text-white">{paymentDetails.details.clabe}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Referencia:</span><span className="font-mono text-white">{paymentDetails.details.reference}</span></div>
                        <button onClick={() => handleCopy(detailsToCopy)} className="w-full mt-2 flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
                            <ClipboardCopyIcon className="w-4 h-4 mr-2" />
                            Copiar Datos
                        </button>
                    </div>
                )}
                <div className="flex gap-4 pt-4">
                     <button onClick={handleSimulatePayment} className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
                        Simular Pago del Cliente
                    </button>
                    <button onClick={onClose} className="w-full px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500">Cerrar</button>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleGenerateLink} className="space-y-4">
            <p className="text-gray-400">Introduce el monto del pago para generar la liga de pago o los datos de transferencia correspondientes.</p>
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Monto (MXN)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                        type="number"
                        name="amount"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-7 pr-12 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:ring-primary-cyan-500 focus:border-primary-cyan-500"
                        placeholder="0.00"
                        min="1"
                        step="any"
                        required
                    />
                </div>
            </div>
             <div className="pt-2">
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-cyan-600 hover:bg-primary-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-cyan-500">
                    Generar
                </button>
            </div>
        </form>
    );
}

const SimulatePaymentModalContent: React.FC<{client: Client, onClientUpdate: (client: Client) => void, addEvent: (event: EventLog) => void, onClose: () => void}> = ({client, onClientUpdate, addEvent, onClose}) => {
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSimulatePayment = async (e: FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error("Por favor, introduce un monto válido.");
            return;
        }

        setIsLoading(true);
        try {
            let updatedClient: Client;
            let message: string;
            
            if (client.savingsPlan) {
                updatedClient = await simulationService.simulateClientPayment(client.id, numericAmount);
                message = `Aportación Voluntaria (simulada) confirmada.`;
            } else if (client.paymentPlan) {
                updatedClient = await simulationService.simulateMonthlyPayment(client.id, numericAmount);
                message = `Aportación a mensualidad (simulada) confirmada.`;
            } else {
                toast.error("El cliente no tiene un plan de ahorro o pagos activo.");
                setIsLoading(false);
                return;
            }
            
            onClientUpdate(updatedClient);
            const newEvent = await simulationService.addNewEvent(client.id, message, Actor.Asesor, EventType.AdvisorAction, { amount: numericAmount, currency: 'MXN' });
            addEvent(newEvent);
            toast.success("¡Pago simulado con éxito!");
            onClose();
        } catch(error) {
            toast.error("Error al simular el pago.");
        } finally {
            setIsLoading(false);
        }
    }

    if(isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan-400"></div>
                <p className="mt-4 text-gray-300">Procesando simulación...</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSimulatePayment} className="space-y-4">
            <p className="text-gray-400">Introduce el monto que deseas simular como una aportación del cliente. Esto actualizará el estado del cliente y agregará un evento al historial.</p>
            <div>
                <label htmlFor="simAmount" className="block text-sm font-medium text-gray-300">Monto (MXN)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                        type="number"
                        name="simAmount"
                        id="simAmount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-7 pr-12 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:ring-primary-cyan-500 focus:border-primary-cyan-500"
                        placeholder="0.00"
                        min="1"
                        step="any"
                        required
                    />
                </div>
            </div>
             <div className="pt-2">
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-emerald-500">
                    Confirmar Simulación
                </button>
            </div>
        </form>
    );
}


const KycModalContent: React.FC<{ client: Client; onKycSuccess: () => void; onKycExit: () => void; }> = ({ client, onKycSuccess, onKycExit }) => {
    const metamapButtonRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const button = metamapButtonRef.current;
        if (!button) return;

        const handleSuccess = () => onKycSuccess();
        const handleExit = () => onKycExit();

        button.addEventListener('metamap:verificationSuccess', handleSuccess);
        button.addEventListener('metamap:userFinished', handleExit);

        return () => {
            button.removeEventListener('metamap:verificationSuccess', handleSuccess);
            button.removeEventListener('metamap:userFinished', handleExit);
        };
    }, [onKycSuccess, onKycExit]);

    return (
        <div className="text-center">
            <p className="text-gray-300 mb-6">Por favor, pasa el dispositivo al cliente para que complete su verificación de identidad biométrica.</p>
            <div className="flex justify-center">
                {/* @ts-ignore */}
                <metamap-button
                    ref={metamapButtonRef}
                    clientid="689833b7d4e7dd0ca48216fb"
                    flowid="689833b7d4e7dd00d08216fa"
                    metadata={JSON.stringify({ clientId: client.id, clientName: client.name })}
                />
            </div>
        </div>
    );
};

const LiquidationModalContent: React.FC<{plan: SavingsPlan, client: Client, onClose: () => void}> = ({ plan, client, onClose }) => {
    const remainder = plan.totalValue - plan.progress;
    const [isLoading, setIsLoading] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<PaymentLinkDetails | null>(null);

    const handleGenerateSpei = async () => {
        setIsLoading(true);
        setPaymentDetails(null);
        try {
            const details = await simulationService.generatePaymentLink(client.id, remainder);
            if (details.type !== 'SPEI') {
                throw new Error("Expected SPEI details for high-value transaction.");
            }
            setPaymentDetails(details);
            await simulationService.addNewEvent(client.id, `Liga de pago SPEI generada por remanente de ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(remainder)}.`, Actor.Asesor, EventType.AdvisorAction);
        } catch (error) {
            toast.error("Hubo un error al generar los datos de pago.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('¡Copiado al portapapeles!');
    }

    return (
        <div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-2 mb-4">
                <div className="flex justify-between"><span className="text-gray-400">Valor Total de la Unidad:</span><span className="font-mono text-white">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(plan.totalValue)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Ahorro Acumulado:</span><span className="font-mono text-white">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(plan.progress)}</span></div>
                <hr className="border-gray-600"/>
                <div className="flex justify-between items-center"><span className="text-lg font-semibold text-white">Remanente a Liquidar:</span><span className="text-xl font-bold text-primary-cyan-400 font-mono">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(remainder)}</span></div>
            </div>

            {isLoading && <div className="text-center p-4">Cargando...</div>}

            {paymentDetails && (
                 <div className="space-y-2 p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="flex justify-between"><span className="text-gray-400">Banco:</span><span className="font-mono text-white">{paymentDetails.details.bank}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">CLABE:</span><span className="font-mono text-white">{paymentDetails.details.clabe}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Referencia:</span><span className="font-mono text-white">{paymentDetails.details.reference}</span></div>
                    <button onClick={() => handleCopy(`Banco: ${paymentDetails.details.bank}\nCLABE: ${paymentDetails.details.clabe}\nReferencia: ${paymentDetails.details.reference}`)} className="w-full mt-2 flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
                        <ClipboardCopyIcon className="w-4 h-4 mr-2" />
                        Copiar Datos
                    </button>
                </div>
            )}
            
            <div className="flex gap-4 pt-6">
                <button onClick={onClose} className="w-full px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500">Cerrar</button>
                {!paymentDetails && <button onClick={handleGenerateSpei} disabled={isLoading} className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">Generar Liga de Pago SPEI</button>}
            </div>
        </div>
    );
};

const KycButton: React.FC<{client: Client, onClick: () => void}> = ({ client, onClick }) => {
    const coreDocsApproved = useMemo(() => {
        const ine = client.documents.find(d => d.name === 'INE Vigente');
        const comprobante = client.documents.find(d => d.name === 'Comprobante de domicilio');
        return ine?.status === DocumentStatus.Aprobado && comprobante?.status === DocumentStatus.Aprobado;
    }, [client.documents]);

    const isKycComplete = client.documents.find(d => d.name.includes("Verificación Biométrica"))?.status === DocumentStatus.Aprobado;
    const isDisabled = isKycComplete || !coreDocsApproved;

    const getTooltipText = () => {
        if (isKycComplete) return "El KYC ya ha sido aprobado.";
        if (!coreDocsApproved) return "Se requiere aprobar INE y Comprobante de Domicilio para iniciar KYC.";
        return "";
    };

    return (
        <div className="relative group">
            <button 
                onClick={onClick} 
                disabled={isDisabled} 
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center"
            >
                <FingerPrintIcon className="w-5 h-5 mr-2"/>
                Iniciar KYC
            </button>
            {isDisabled && (
                 <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 hidden group-hover:block bg-gray-900 border border-gray-600 text-white text-xs rounded-lg p-2 z-10 shadow-lg text-center">
                   {getTooltipText()}
                </div>
            )}
        </div>
    );
};


export const ClientDetail: React.FC<ClientDetailProps> = ({ client, onClientUpdate, onBack, navigationContext, viewMode }) => {
  const [events, setEvents] = useState<EventLog[]>(client.events);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSimulatePaymentModalOpen, setIsSimulatePaymentModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isLiquidationModalOpen, setIsLiquidationModalOpen] = useState(false);
  const [isPlanConfigModalOpen, setIsPlanConfigModalOpen] = useState(false);
  const [isProtectionModalOpen, setIsProtectionModalOpen] = useState(false);
  const [paymentInitialAmount, setPaymentInitialAmount] = useState<number | undefined>();
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const documentsRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Sort events initially and when client changes
    setEvents([...client.events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }, [client]);

  const addEvent = useCallback((event: EventLog) => {
    setEvents(prev => [...prev, event].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

  const handleUpload = useCallback(async (docId: string) => {
    setUploadingDocId(docId);
    try {
      await simulationService.uploadDocument(client.id, docId);
      const updatedClient = {
        ...client,
        documents: client.documents.map(d => d.id === docId ? {...d, status: DocumentStatus.EnRevision} : d)
      };
      onClientUpdate(updatedClient);
      const newEvent = await simulationService.addNewEvent(client.id, `Documento "${client.documents.find(d=>d.id===docId)?.name}" subido para revisión.`, Actor.Asesor, EventType.AdvisorAction);
      addEvent(newEvent);
      toast.success("Documento en revisión.");
    } catch(e) {
      toast.error("Error al subir el documento.");
    } finally {
        setUploadingDocId(null);
    }
  }, [client, onClientUpdate, addEvent]);

  const handleSendContract = useCallback(async () => {
    toast.info("Enviando contrato...");
    try {
      const result = await simulationService.sendContract(client.id);
      toast.success(result.message);
      const newEvent = await simulationService.addNewEvent(client.id, result.message, Actor.Asesor, EventType.AdvisorAction);
      addEvent(newEvent);
    } catch (e) {
        toast.error("Error al enviar el contrato.");
    }
  }, [client.id, addEvent]);

  const handleKycSuccess = useCallback(async () => {
    setIsKycModalOpen(false);
    toast.info("Procesando verificación de KYC...");
    try {
      const updatedClient = await simulationService.completeKyc(client.id);
      onClientUpdate(updatedClient);
      const newEvent = await simulationService.addNewEvent(client.id, "Verificación biométrica (KYC) completada con éxito.", Actor.Sistema, EventType.System);
      addEvent(newEvent);
      toast.success("¡KYC Aprobado!");
    } catch (e) {
      toast.error("Error al procesar el KYC.");
    }
  }, [client.id, onClientUpdate, addEvent]);
  
  const handleKycExit = () => {
      setIsKycModalOpen(false);
      toast.info("Proceso de KYC cancelado por el usuario.");
  };

  const handleGoalAction = async (action: 'liquidar' | 'convertir') => {
      if (action === 'liquidar') {
          setIsLiquidationModalOpen(true);
      } else {
          toast.info("Convirtiendo a Venta a Plazo...");
          const updatedClient = await simulationService.convertToVentaPlazo(client.id);
          onClientUpdate(updatedClient);
          toast.success(`${client.name} ahora está en Venta a Plazo.`);
          const newEvent = await simulationService.addNewEvent(client.id, "Ahorro completado, cliente convertido a Venta a Plazo.", Actor.Sistema, EventType.System);
          addEvent(newEvent);
      }
  };
  
  const handleConfigurePlan = async (config: any) => {
      setIsPlanConfigModalOpen(false);
      toast.info("Configurando plan de pagos...");
      try {
          const updatedClient = await simulationService.configurePaymentPlan(client.id, config);
          onClientUpdate(updatedClient);
          toast.success("Plan de pagos configurado con éxito.");
          const newEvent = await simulationService.addNewEvent(client.id, `Plan de pagos mensual configurado.`, Actor.Asesor, EventType.AdvisorAction);
          addEvent(newEvent);
      } catch (error) {
          toast.error("Error al configurar el plan.");
      }
  };

  const handleCollectiveCreditTransition = async () => {
      toast.info("Iniciando proceso de venta...");
      const updatedClient = await simulationService.convertToVentaPlazo(client.id);
      onClientUpdate(updatedClient);
      toast.success(`${client.name} ha iniciado el proceso de Venta a Plazo.`);
      const newEvent = await simulationService.addNewEvent(client.id, "Turno adjudicado, cliente convertido a Venta a Plazo.", Actor.Sistema, EventType.System);
      addEvent(newEvent);
  };

  const handleUpdateMilestone = useCallback(async (clientId: string, milestone: keyof ImportStatus) => {
    toast.info("Actualizando estado de importación...");
    try {
        const updatedClient = await simulationService.updateImportMilestone(clientId, milestone);
        onClientUpdate(updatedClient);
        
        const milestoneLabels: Record<keyof ImportStatus, string> = {
            pedidoPlanta: "Pedido a Planta",
            unidadFabricada: "Unidad Fabricada",
            transitoMaritimo: "Tránsito Marítimo",
            enAduana: "En Aduana",
            liberada: "Liberada"
        };

        toast.success(`Estado de "${milestoneLabels[milestone]}" actualizado.`);
        const newEvent = await simulationService.addNewEvent(
            clientId, 
            `Estado de importación actualizado a: ${milestoneLabels[milestone]} en progreso.`, 
            Actor.Asesor, 
            EventType.AdvisorAction
        );
        addEvent(newEvent);

    } catch (error) {
        toast.error("Error al actualizar el estado.");
        console.error(error);
    }
  }, [onClientUpdate, addEvent]);

  const handleOpenPaymentModalWithAmount = (amount: number) => {
    setPaymentInitialAmount(amount);
    setIsPaymentModalOpen(true);
  }
  
  const handleGenerateStatement = useCallback(async () => {
    setIsGeneratingPDF(true);
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

        const addLogoAndHeader = () => new Promise<void>((resolve) => {
            const logoUrl = 'https://res.cloudinary.com/dytmjjb9l/image/upload/v1755053362/Add_the_text_Conductores_del_Mundo_below_the_logo_The_text_should_be_small_centered_and_in_the_same_monochromatic_style_as_the_logo_The_logo_features_the_text_Mu_in_white_centered_within_a_teal_i_rbsaxg.png';
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = logoUrl;
            img.onload = () => {
                doc.addImage(img, 'PNG', 15, 10, 30, 15);
                resolve();
            };
            img.onerror = () => {
                console.error("Could not load logo for PDF");
                resolve(); // Continue without logo if it fails
            };
        });

        await addLogoAndHeader();

        doc.setFontSize(18);
        doc.text("Estado de Cuenta", 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-MX')}`, 195, 15, { align: 'right' });

        doc.setFontSize(12);
        doc.text(`Cliente: ${client.name}`, 15, 40);
        doc.text(`ID Cliente: ${client.id}`, 15, 46);
        doc.text(`Plan: ${client.flow}`, 15, 52);

        doc.line(15, 60, 195, 60);
        let summaryY = 68;

        if (client.savingsPlan) {
            const { goal, progress, totalValue } = client.savingsPlan;
            doc.text(`Valor de la Unidad: ${formatCurrency(totalValue)}`, 15, summaryY);
            doc.text(`Meta de Ahorro (Enganche): ${formatCurrency(goal)}`, 15, summaryY + 6);
            doc.text(`Ahorro Acumulado: ${formatCurrency(progress)}`, 105, summaryY + 6, { align: 'left' });
            doc.text(`Remanente por Ahorrar: ${formatCurrency(goal - progress)}`, 15, summaryY + 12);
        } else if (client.paymentPlan) {
            const totalContributions = client.events.filter(e => e.type === EventType.Contribution || e.type === EventType.Collection).reduce((sum, e) => sum + (e.details?.amount || 0), 0);
            const balance = Math.max(0, (client.remainderAmount || 0) - (totalContributions - (client.downPayment || 0)));
            doc.text(`Monto a Financiar Original: ${formatCurrency(client.remainderAmount || 0)}`, 15, summaryY);
            doc.text(`Pago Mensual: ${formatCurrency(client.paymentPlan.monthlyGoal)}`, 15, summaryY + 6);
            doc.text(`Total de Aportaciones: ${formatCurrency(totalContributions)}`, 105, summaryY + 6, { align: 'left' });
            doc.text(`Saldo Pendiente (Estimado): ${formatCurrency(balance)}`, 15, summaryY + 12);
        }

        const financialEvents = client.events
            .filter(e => e.details?.amount)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const head = [['Fecha', 'Descripción', 'Tipo', 'Monto']];
        const body = financialEvents.map(e => [
            new Date(e.timestamp).toLocaleDateString('es-MX'),
            e.message,
            e.type,
            { content: formatCurrency(e.details!.amount!), styles: { halign: 'right' } },
        ]);

        (doc as any).autoTable({
            startY: summaryY + 20,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [8, 145, 178] }, // primary-cyan-600
        });

        doc.save(`Estado_de_Cuenta_${client.name.replace(/\s/g, '_')}.pdf`);
        toast.success("Estado de cuenta generado y descargado.");

        const newEvent = await simulationService.addNewEvent(client.id, "Estado de cuenta generado por el asesor.", Actor.Asesor, EventType.AdvisorAction);
        addEvent(newEvent);
    } catch (err) {
        toast.error("Error al generar el PDF.");
        console.error(err);
    } finally {
        setIsGeneratingPDF(false);
    }
  }, [client, addEvent]);

  const docsForChecklist = client.documents.filter(d => d.name !== 'Carta Aval de Ruta' && d.name !== 'Convenio de Dación en Pago');
  const guaranteeDocs = client.documents.filter(d => d.name === 'Carta Aval de Ruta' || d.name === 'Convenio de Dación en Pago');
  
  const getPaymentModalTitle = () => {
      if (client.flow === BusinessFlow.AhorroProgramado) return "Generar Aportación de Ahorro";
      if (client.flow === BusinessFlow.VentaPlazo) return "Registrar Pago Mensual";
      if (client.status === 'Unidad Lista para Entrega') return "Solicitar Pago de Remanente";
      return "Generar Pago";
  }

  const handleNextAction = useCallback((action: string) => {
    switch (action) {
        case 'liquidar':
            setIsLiquidationModalOpen(true);
            break;
        case 'convertir':
            handleGoalAction('convertir');
            break;
        case 'configure_plan':
            setIsPlanConfigModalOpen(true);
            break;
        case 'transition_collective':
            handleCollectiveCreditTransition();
            break;
        case 'pay_remainder':
            if(client.remainderAmount) handleOpenPaymentModalWithAmount(client.remainderAmount);
            break;
        case 'scroll_to_docs':
             documentsRef.current?.scrollIntoView({ behavior: 'smooth' });
             break;
        default:
            break;
    }
  }, [client.remainderAmount]);
  
  const getContractButtonText = (client: Client): string => {
    const isEdoMex = !!client.ecosystemId;
    if (client.flow === BusinessFlow.VentaPlazo) {
      return isEdoMex ? 'Enviar Paquete de Venta' : 'Enviar Contrato de Venta a Plazo';
    }
    return 'Enviar Contrato Promesa';
  };

  const handleApplyRestructure = (updatedClient: Client) => {
    onClientUpdate(updatedClient);
    addEvent({
        id: `evt-${updatedClient.id}-${Date.now()}`,
        timestamp: new Date(),
        message: `Plan de pagos restructurado.`,
        actor: Actor.Sistema,
        type: EventType.System
    });
  };

  if (viewMode === 'client') {
    return <ClientDetailSeniorView client={client} onBack={onBack} navigationContext={navigationContext} />;
  }

  return (
    <div className="h-full flex flex-col p-1 sm:p-2 md:p-4 bg-gray-900/50 rounded-xl">
      {/* Client Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        {navigationContext ? (
          <Breadcrumb context={navigationContext} client={client} onNavigate={() => onBack()} />
        ) : (
          <button onClick={onBack} className="mb-4 text-sm text-gray-400 hover:text-white px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">
            &larr; Volver a la lista
          </button>
        )}
        <div className="flex items-center">
            <img src={client.avatarUrl} alt={client.name} className="w-16 h-16 rounded-full object-cover" />
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-white">{client.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className={`px-3 py-1 text-xs font-semibold rounded-full ${client.flow === BusinessFlow.VentaPlazo ? 'bg-blue-500/20 text-blue-300' : (client.flow === BusinessFlow.AhorroProgramado ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300')}`}>{client.flow}</span>
                 <span className="text-xs font-medium text-gray-400">&middot;</span>
                 <span className="text-sm font-medium text-gray-300">{client.status}</span>
              </div>
            </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Action Banners */}
        <NextBestAction client={client} onAction={handleNextAction} />
        
        {/* Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {client.savingsPlan && <SavingsInfoPanel plan={client.savingsPlan} />}
            {client.paymentPlan && <MonthlyPaymentPanel plan={client.paymentPlan} />}
            {client.collectiveCreditGroupId && <CollectiveCreditGroupInfoPanel client={client} groupId={client.collectiveCreditGroupId} />}
            {client.flow === BusinessFlow.VentaDirecta && client.importStatus && (
                <ImportTracker client={client} onUpdateMilestone={handleUpdateMilestone} />
            )}
            {client.protectionPlan && (
              <div className="bg-gray-900 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <ShieldCheckIcon className="w-6 h-6 mr-3 text-primary-cyan-400" />
                      Protección Conductores
                  </h4>
                  <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Plan Activo:</span>
                          <span className={`font-semibold ${client.protectionPlan.type === 'Total' ? 'text-amber-300' : 'text-primary-cyan-300'}`}>{client.protectionPlan.type}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Restructuras Disponibles:</span>
                          <span className="font-semibold text-white">{client.protectionPlan.restructuresAvailable}</span>
                      </div>
                      <div className="pt-3 border-t border-gray-700/50">
                          <button
                              onClick={() => setIsProtectionModalOpen(true)}
                              disabled={client.protectionPlan.restructuresAvailable <= 0}
                              className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500"
                          >
                              {client.protectionPlan.restructuresAvailable > 0 ? 'Iniciar Simulación de Restructura' : 'Sin Restructuras Disponibles'}
                          </button>
                      </div>
                  </div>
              </div>
            )}
            {client.ecosystemId && <TechnologyPackage />}
            {client.flow === BusinessFlow.VentaPlazo && client.ecosystemId && <GuaranteePanel documents={guaranteeDocs} onUpload={handleUpload}/>}
          </div>

          <div className="xl:col-span-3 space-y-6">
            {/* Document Checklist */}
            <div className="bg-gray-900 p-4 rounded-lg" ref={documentsRef}>
                <h4 className="text-lg font-semibold text-white mb-2">Expediente Digital</h4>
                <ul className="divide-y divide-gray-800">
                    {docsForChecklist.map(doc => <DocumentChecklistItem key={doc.id} doc={doc} onUpload={handleUpload} isUploading={uploadingDocId === doc.id} />)}
                </ul>
            </div>
             {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setPaymentInitialAmount(undefined); setIsPaymentModalOpen(true); }} className="px-4 py-2 text-sm font-medium text-white bg-primary-cyan-600 rounded-lg hover:bg-primary-cyan-700">Generar Liga de Pago</button>
              <button onClick={() => setIsSimulatePaymentModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500">
                Simular Aportación
              </button>
              <button onClick={handleSendContract} className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500">
                {getContractButtonText(client)}
              </button>
              {client.flow !== BusinessFlow.VentaDirecta && (
                 <KycButton client={client} onClick={() => setIsKycModalOpen(true)} />
              )}
               <button onClick={handleGenerateStatement} disabled={isGeneratingPDF} className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center">
                    <DocumentDownloadIcon className="w-5 h-5 mr-2" />
                    {isGeneratingPDF ? 'Generando...' : 'Estado de Cuenta'}
                </button>
            </div>

            {/* Event Log */}
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-2">Historial de Eventos</h4>
              <div className="divide-y divide-gray-800">
                {events.map(event => <EventLogItem key={event.id} event={event} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
       {/* Modals */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={getPaymentModalTitle()}>
          <PaymentLinkModalContent client={client} onClientUpdate={onClientUpdate} addEvent={addEvent} onClose={() => setIsPaymentModalOpen(false)} initialAmount={paymentInitialAmount} />
      </Modal>
       <Modal isOpen={isSimulatePaymentModalOpen} onClose={() => setIsSimulatePaymentModalOpen(false)} title="Simular Aportación de Cliente">
        <SimulatePaymentModalContent client={client} onClientUpdate={onClientUpdate} addEvent={addEvent} onClose={() => setIsSimulatePaymentModalOpen(false)} />
      </Modal>
      <Modal isOpen={isKycModalOpen} onClose={() => setIsKycModalOpen(false)} title="Verificación Biométrica (Metamap)">
          <KycModalContent client={client} onKycSuccess={handleKycSuccess} onKycExit={handleKycExit} />
      </Modal>
       {client.savingsPlan && <Modal isOpen={isLiquidationModalOpen} onClose={() => setIsLiquidationModalOpen(false)} title="Liquidar de Contado">
          <LiquidationModalContent plan={client.savingsPlan} client={client} onClose={() => setIsLiquidationModalOpen(false)} />
      </Modal>}
       <Modal isOpen={isPlanConfigModalOpen} onClose={() => setIsPlanConfigModalOpen(false)} title="Configurar Plan de Pagos">
           <PlanConfigForm onSubmit={handleConfigurePlan} isSavings={false} onBack={() => setIsPlanConfigModalOpen(false)} />
       </Modal>
       <Modal isOpen={isProtectionModalOpen} onClose={() => setIsProtectionModalOpen(false)} title={`Simulador de Protección para ${client.name}`}>
          <ProtectionSimulator client={client} onApply={handleApplyRestructure} onClose={() => setIsProtectionModalOpen(false)} />
      </Modal>
    </div>
  );
};