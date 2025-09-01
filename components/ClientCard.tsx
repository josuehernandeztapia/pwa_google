
import React, { useState } from 'react';
import { Client, BusinessFlow } from '../types';
import { DotsVerticalIcon } from './icons';

interface ClientCardProps {
  client: Client;
  isSelected: boolean;
  onSelect: () => void;
  showContextTags?: boolean;
}

const flowColors: Record<BusinessFlow, { bg: string; text: string }> = {
  [BusinessFlow.VentaPlazo]: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
  [BusinessFlow.AhorroProgramado]: { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  [BusinessFlow.CreditoColectivo]: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  [BusinessFlow.VentaDirecta]: { bg: 'bg-indigo-500/20', text: 'text-indigo-300' },
};

const statusColors: { [key: string]: string } = {
    'Activo': 'bg-emerald-500/20 text-emerald-300',
    'Pagos al Corriente': 'bg-emerald-500/20 text-emerald-300',
    'Meta Alcanzada': 'bg-green-400/30 text-green-300 ring-1 ring-inset ring-green-400/30 font-semibold',
    'Aprobado': 'bg-sky-500/20 text-sky-300',
    'Turno Adjudicado': 'bg-violet-500/20 text-violet-300 font-semibold',
    'Expediente en Proceso': 'bg-amber-500/20 text-amber-300',
    'Unidad en Proceso de Importación': 'bg-blue-500/20 text-blue-300',
    'Unidad Lista para Entrega': 'bg-green-400/30 text-green-300',
    'Esperando Sorteo': 'bg-gray-600/50 text-gray-300',
    'Activo en Grupo': 'bg-gray-600/50 text-gray-300',
    'Nuevas Oportunidades': 'bg-gray-600/50 text-gray-300',
    'Completado': 'bg-gray-700 text-gray-400',
};

const getHealthScoreColor = (score: number) => {
    if (score >= 90) return { dot: 'bg-emerald-400', text: 'text-emerald-400' };
    if (score >= 75) return { dot: 'bg-yellow-400', text: 'text-yellow-400' };
    return { dot: 'bg-red-500', text: 'text-red-500' };
};


const ClientCardKPIs: React.FC<{ client: Client }> = ({ client }) => {
    const renderContent = () => {
        if (client.savingsPlan) {
            const percentage = client.savingsPlan.goal > 0 ? Math.min((client.savingsPlan.progress / client.savingsPlan.goal) * 100, 100) : 0;
            return (
                <>
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-medium text-gray-400">Ahorro</span>
                        <span className="text-xs font-semibold text-white">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div className="bg-primary-cyan-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                </>
            )
        }
        if (client.paymentPlan) {
            const percentage = client.paymentPlan.monthlyGoal > 0 ? Math.min((client.paymentPlan.currentMonthProgress / client.paymentPlan.monthlyGoal) * 100, 100) : 0;
            return (
                <>
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-medium text-gray-400">Pago del Mes</span>
                         <span className="text-xs font-semibold text-white">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                </>
            )
        }
        if (client.importStatus) {
            const milestones = ['pedidoPlanta', 'unidadFabricada', 'transitoMaritimo', 'enAduana', 'liberada'];
            const completedCount = milestones.filter(m => client.importStatus![m as keyof typeof client.importStatus] !== 'pending').length;
            const percentage = (completedCount / milestones.length) * 100;
             return (
                <>
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-medium text-gray-400">Progreso Importación</span>
                        <span className="text-xs font-semibold text-white">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                </>
            )
        }
        return <div className="h-1.5"></div>; // Placeholder for consistent height
    }

    return <div className="mt-3">{renderContent()}</div>;
}


const QuickActionsMenu: React.FC<{ client: Client }> = ({ client }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleAction = (e: React.MouseEvent, action: string) => {
        e.stopPropagation();
        console.log(action, client.id);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(prev => !prev);
                }}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white"
            >
                <DotsVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-20"
                  onClick={(e) => e.stopPropagation()} // Prevent card click when clicking menu background
                >
                    <div className="py-1">
                        <a href="#" onClick={(e) => handleAction(e, "Ver Expediente")} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Ver Expediente</a>
                        {client.savingsPlan && <a href="#" onClick={(e) => handleAction(e, "Generar Aportación")} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Generar Aportación</a>}
                        {client.status === 'Expediente Pendiente' && <a href="#" onClick={(e) => handleAction(e, "Completar Expediente")} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Completar Expediente</a>}
                    </div>
                </div>
            )}
        </div>
    );
};


export const ClientCard: React.FC<ClientCardProps> = ({ client, isSelected, onSelect, showContextTags = true }) => {
  const flowColor = flowColors[client.flow] || { bg: 'bg-gray-500/20', text: 'text-gray-300' };
  const statusColor = statusColors[client.status] || 'bg-gray-600/50 text-gray-300';
  const healthScore = client.healthScore || 0;
  const healthColor = getHealthScoreColor(healthScore);
  const isCollective = !!client.collectiveCreditGroupId;
  const market = client.ecosystemId ? 'EDOMEX' : 'AGS';

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 flex flex-col cursor-pointer transition-all duration-200 ${
        isSelected ? 'bg-primary-cyan-900/40 border-primary-cyan-600 shadow-lg' : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-800/80'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center min-w-0">
            <img src={client.avatarUrl} alt={client.name} className="w-11 h-11 rounded-full object-cover" />
            <div className="ml-3 flex-1 min-w-0">
                <p className="text-md font-semibold text-white truncate">{client.name}</p>
                 <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${flowColor.bg} ${flowColor.text}`}>
                        {client.flow}
                    </span>
                    {showContextTags && (
                        <>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${market === 'EDOMEX' ? 'bg-teal-500/20 text-teal-300' : 'bg-rose-500/20 text-rose-300'}`}>
                              {market}
                          </span>
                           <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isCollective ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-600/50 text-gray-300'}`}>
                              {isCollective ? 'COLECTIVO' : 'INDIVIDUAL'}
                          </span>
                        </>
                    )}
                 </div>
            </div>
        </div>
        <QuickActionsMenu client={client} />
      </div>

      {/* KPIs */}
      <ClientCardKPIs client={client}/>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-between items-center">
         <span className={`px-2.5 py-1 text-xs font-medium rounded-full leading-none ${statusColor}`}>
            {client.status}
        </span>
        <div className="flex items-center" title={`Health Score: ${healthScore}`}>
            <span className={`text-xs font-bold font-mono ${healthColor.text}`}>{healthScore}</span>
            <div className={`ml-1.5 w-2.5 h-2.5 rounded-full ${healthColor.dot}`}></div>
        </div>
      </div>
    </div>
  );
};
