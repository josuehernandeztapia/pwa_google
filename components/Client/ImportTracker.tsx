

import React from 'react';
import { Client, ImportStatus, ImportMilestoneStatus } from '../../types/index';
import { CheckCircleIcon, ClockIcon } from '../Shared/Icon';

interface ImportTrackerProps {
    client: Client;
    onUpdateMilestone: (clientId: string, milestone: keyof ImportStatus) => void;
}

const Milestone: React.FC<{
    label: string;
    status: ImportMilestoneStatus;
    onClick: () => void;
    isClickable: boolean;
}> = ({ label, status, onClick, isClickable }) => {
    const statusMap = {
        completed: { icon: <CheckCircleIcon className="w-6 h-6 text-emerald-400" />, text: 'text-emerald-400' },
        in_progress: { icon: <ClockIcon className="w-6 h-6 text-amber-400 animate-pulse" />, text: 'text-amber-400' },
        pending: { icon: <div className="w-6 h-6 flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-gray-600 border-2 border-gray-500"></div></div>, text: 'text-gray-500' },
    };

    const currentStatus = statusMap[status];
    const cursorClass = isClickable ? 'cursor-pointer hover:bg-gray-800/50' : 'cursor-default';

    return (
        <li className={`relative flex items-start pb-8 last:pb-0 ${cursorClass} p-2 rounded-md`} onClick={isClickable ? onClick : undefined}>
            {/* The vertical line */}
            <div className="absolute left-3 top-7 -ml-[1px] h-full w-0.5 bg-gray-700" />
            
            <div className="relative flex items-center justify-center w-6 h-6 bg-gray-800 rounded-full ring-4 ring-gray-800 z-10">
                {currentStatus.icon}
            </div>
            <div className="ml-4">
                <p className={`font-semibold ${currentStatus.text}`}>{label}</p>
                 <p className="text-xs text-gray-500 capitalize">{status.replace('_', ' ')}</p>
            </div>
        </li>
    );
};


export const ImportTracker: React.FC<ImportTrackerProps> = ({ client, onUpdateMilestone }) => {
    if (!client.importStatus) return null;

    const milestones: { key: keyof ImportStatus, label: string }[] = [
        { key: 'pedidoPlanta', label: 'Pedido a Planta Confirmado' },
        { key: 'unidadFabricada', label: 'Unidad Fabricada' },
        { key: 'transitoMaritimo', label: 'En Tránsito Marítimo' },
        { key: 'enAduana', label: 'En Aduana' },
        { key: 'liberada', label: 'Liberada - Lista para Entrega' },
    ];
    
    const findNextPending = () => {
        for(const milestone of milestones) {
            if(client.importStatus && client.importStatus[milestone.key] === 'pending') {
                return milestone.key;
            }
        }
        return null;
    }

    const nextMilestoneToUpdate = findNextPending();

    return (
        <div className="bg-gray-900 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-4">Seguimiento de Importación</h4>
            <ul>
                {milestones.map(({ key, label }, index) => (
                    <Milestone
                        key={key}
                        label={label}
                        status={client.importStatus![key]}
                        onClick={() => onUpdateMilestone(client.id, key)}
                        isClickable={key === nextMilestoneToUpdate}
                    />
                ))}
            </ul>
        </div>
    );
};
