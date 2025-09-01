
import React from 'react';
import { Client, DocumentStatus } from '../types';
import { ArrowRightIcon, CheckCircleIcon, InformationCircleIcon, LightBulbIcon, SparklesIcon } from './icons';

interface NextBestActionProps {
    client: Client;
    onAction: (action: string) => void;
}

interface ActionDetails {
    icon: JSX.Element;
    title: string;
    description: string;
    action: {
        text: string;
        onClick: () => void;
        type: 'primary' | 'secondary';
    }
    secondaryAction?: {
        text: string;
        onClick: () => void;
    }
}

const getNextBestAction = (client: Client, onAction: (action: string) => void): ActionDetails | null => {
    // Priority 1: Meta Alcanzada (Savings Plan)
    if (client.status === 'Meta Alcanzada' && client.savingsPlan) {
        return {
            icon: <SparklesIcon className="w-8 h-8 text-emerald-300" />,
            title: '¡Meta de Ahorro Completada!',
            description: `${client.name} ha acumulado lo suficiente. Es momento de decidir el siguiente paso.`,
            action: { text: 'Convertir a Venta a Plazo', onClick: () => onAction('convertir'), type: 'primary' },
            secondaryAction: { text: 'Liquidar de Contado', onClick: () => onAction('liquidar') }
        };
    }

    // Priority 2: Turno Adjudicado (Collective Credit)
    if (client.status === 'Turno Adjudicado') {
        return {
            icon: <SparklesIcon className="w-8 h-8 text-amber-300" />,
            title: '¡Turno de Crédito Adjudicado!',
            description: `El cliente ha recibido su turno en el Crédito Colectivo. Puedes iniciar su proceso de Venta a Plazo.`,
            action: { text: 'Iniciar Proceso de Venta', onClick: () => onAction('transition_collective'), type: 'primary' }
        };
    }

    // Priority 3: Unit Ready for Delivery (Venta Directa)
    if (client.status === 'Unidad Lista para Entrega' && client.remainderAmount) {
        return {
            icon: <CheckCircleIcon className="w-8 h-8 text-green-300" />,
            title: '¡Unidad Lista para Entrega!',
            description: 'La unidad ha sido liberada y está lista. Es momento de solicitar el pago del remanente al cliente.',
            action: { text: 'Generar Pago por Remanente', onClick: () => onAction('pay_remainder'), type: 'primary' }
        };
    }

    // Priority 4: Aprobado
    if (client.status === 'Aprobado') {
        return {
            icon: <InformationCircleIcon className="w-8 h-8 text-blue-300" />,
            title: 'Próxima Acción Requerida',
            description: `El crédito del cliente ha sido aprobado. Configura el plan de pagos mensual para continuar.`,
            action: { text: 'Configurar Plan de Pagos', onClick: () => onAction('configure_plan'), type: 'primary' }
        };
    }

    // Priority 5: Expediente en Proceso
    const pendingDocsCount = client.documents.filter(d => d.status === DocumentStatus.Pendiente).length;
    if (client.status === 'Expediente en Proceso' && pendingDocsCount > 0) {
        return {
            icon: <LightBulbIcon className="w-8 h-8 text-blue-300" />,
            title: 'Próxima Acción Recomendada',
            description: `Contactar a ${client.name} para completar los ${pendingDocsCount} documento(s) pendientes y avanzar en el proceso.`,
            action: { text: 'Ir a Expediente', onClick: () => onAction('scroll_to_docs'), type: 'secondary' }
        };
    }

    // Default: No specific action
    return null;
}


export const NextBestAction: React.FC<NextBestActionProps> = ({ client, onAction }) => {
    const actionDetails = getNextBestAction(client, onAction);

    if (!actionDetails) {
        return null;
    }

    const { icon, title, description, action, secondaryAction } = actionDetails;
    
    const actionButtonClasses = {
        primary: 'bg-primary-cyan-600 hover:bg-primary-cyan-700 text-white',
        secondary: 'bg-gray-600 hover:bg-gray-500 text-gray-200'
    };

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 shadow-lg mb-6 flex items-center justify-between">
            <div className="flex items-center">
                <div className="flex-shrink-0">{icon}</div>
                <div className="ml-4">
                    <h4 className="text-lg font-bold text-white">{title}</h4>
                    <p className="text-gray-300 text-sm mt-1">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 ml-8">
                {secondaryAction && (
                    <button 
                        onClick={secondaryAction.onClick} 
                        className="px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-600/50 transition-colors"
                    >
                        {secondaryAction.text}
                    </button>
                )}
                 <button 
                    onClick={action.onClick} 
                    className={`flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg transition-transform hover:scale-105 ${actionButtonClasses[action.type]}`}
                 >
                    {action.text}
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};
